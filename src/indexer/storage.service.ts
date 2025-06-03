import { web3 } from "@coral-xyz/anchor"
import {
	Injectable,
	InternalServerErrorException,
	Logger,
	NotFoundException
} from "@nestjs/common"
import { Network, Prisma } from "@prisma/client"
import { Decimal } from "@prisma/client/runtime/library"
import { PrismaService } from "@root/_database/prisma.service"
import { TokenChartRepository } from "@root/_database/repositories/token-candle.repository"
import { TokenOwnerRepository } from "@root/_database/repositories/token-owner.repository"
import { TokenTransactionRepository } from "@root/_database/repositories/token-transaction.repository"
import { TokenRepository } from "@root/_database/repositories/token.repository"
import { UserRepository } from "@root/_database/repositories/user.repository"
import { Env, InjectEnv } from "@root/_env/env.module"
import { RabbitMQService } from "@root/_rabbitmq/rabbitmq.service"
import { getTokenMetaData } from "@root/_shared/helpers/get-token-metadata"
import {
	TokenTransaction,
	TransactionType
} from "@root/dtos/token-transaction.dto"
import { Token } from "@root/dtos/token.dto"
import { User } from "@root/dtos/user.dto"
import {
	BuyTokensEvent,
	CreateTokenEvent,
	SellTokensEvent
} from "@root/programs/ponz/events"
import { Ponz } from "@root/programs/ponz/program"
import { InjectConnection } from "@root/programs/programs.module"
import { plainToInstance } from "class-transformer"
import { DateTime } from "luxon"

@Injectable()
export class StorageIndexerService {
	private readonly SOL_MARKETCAP_DEFAULT = BigInt(80000000000)

	constructor(
		@InjectEnv() private env: Env,
		private ponz: Ponz,
		@InjectConnection() private connection: web3.Connection,
		private readonly userRepository: UserRepository,
		private readonly tokenRepository: TokenRepository,
		private readonly tokenTxRepository: TokenTransactionRepository,
		private readonly tokenOwner: TokenOwnerRepository,
		private readonly tokenChart: TokenChartRepository,
		private prisma: PrismaService,
		private readonly rabbitMQService: RabbitMQService
	) {}

	async handlerCreateToken(data: CreateTokenEvent) {
		const [token, tokenTx] = await Promise.all([
			this.tokenRepository.findOneByAddress(data.mint),
			this.tokenTxRepository.findBySignature(data.signature, data.type)
		])
		if (!token) {
			return
		}

		if (tokenTx) {
			return
		}

		const date = await this.getTimeFromSignature(data.signature)

		try {
			await this.prisma.$transaction(
				async tx => {
					const txCreateInput: Prisma.TokenTransactionCreateInput = {
						signature: data.signature,
						network: "Solana",
						type: "Create",
						date: date.toJSDate(),
						token: {
							connect: {
								address: data.mint
							}
						},
						price: 0,
						newPrice: 0
					}
					await this.tokenTxRepository.create(txCreateInput, tx)

					await this.tokenRepository.updateTokenOnchain(
						data.mint,
						{
							metadata: await getTokenMetaData(data.uri),
							bumpAt: date.toJSDate(),
							name: data.name,
							uri: data.uri,
							ticker: data.symbol,
							network: Network.Solana,
							bump: true
						},
						tx
					)

					await this.updateToken(data.mint, undefined, tx)
				},
				{
					maxWait: 5000, // 5s
					timeout: 10000, // 10s
					isolationLevel: Prisma.TransactionIsolationLevel.Serializable
				}
			)
		} catch (e) {
			Logger.log(e)
			throw new InternalServerErrorException("Failed to handle create token")
		}
	}

	async updateTokenAfterTransaction(
		mint: string,
		event: BuyTokensEvent | SellTokensEvent,
		tx?: Prisma.TransactionClient
	) {
		await Promise.all([
			this.updateToken(mint, event, tx),
			this.updateBalanceUser(event, tx),
			this.updateTokenChart(mint, event, tx)
		])
	}

	async handlerBuyToken(data: BuyTokensEvent) {
		data.amount = BigInt(`0x${data.amount}`).toString()
		data.timestamp = BigInt(`0x${data.timestamp}`).toString()
		data.lamports = BigInt(`0x${data.lamports}`).toString()

		const [token, tokenTx, user] = await Promise.all([
			this.tokenRepository.findOneByAddress(data.mint),
			this.tokenTxRepository.findBySignature(data.signature, data.type),
			this.userRepository.createIfNotExist({
				address: data.buyer
			})
		])

		if (!token || !user) {
			return
		}

		if (tokenTx) {
			return
		}

		try {
			await this.prisma.$transaction(
				async tx => {
					await this.updateTokenAfterTransaction(data.mint, data, tx)
					const txCreateInput: Prisma.TokenTransactionCreateInput = {
						signature: data.signature,
						network: "Solana",
						type: "Buy",
						date: DateTime.fromSeconds(Number(data.timestamp)).toJSDate(),
						token: {
							connect: {
								address: data.mint
							}
						},
						price: data.previousPrice,
						newPrice: data.newPrice,
						amount: BigInt(data.amount),
						lamports: BigInt(data.lamports),
						createdBy: {
							connect: {
								address: data.buyer
							}
						}
					}

					await this.tokenTxRepository.create(txCreateInput, tx)
				},
				{
					maxWait: 5000, // 5s
					timeout: 10000, // 10s
					isolationLevel: Prisma.TransactionIsolationLevel.Serializable
				}
			)
		} catch (e) {
			Logger.log(e)
			throw new InternalServerErrorException("Failed to handle buy token")
		}

		await this.rabbitMQService.emit("socket", "new-candle", {
			address: data.mint,
			date: Number(data.timestamp)
		})

		const transaction = {
			type: TransactionType.BUY,
			date: DateTime.fromSeconds(Number(data.timestamp)).toJSDate(),
			signature: data.signature,
			amount: data.amount,
			lamports: data.lamports,
			tokenAddress: data.mint,
			signer: data.buyer,
			price: data.previousPrice,
			newPrice: data.newPrice,
			token: plainToInstance(Token, token),
			createdBy: plainToInstance(User, user)
		}

		await this.rabbitMQService.emit(
			"socket",
			"new-transaction",
			plainToInstance(TokenTransaction, transaction)
		)
	}

	async handlerSellToken(data: SellTokensEvent) {
		data.amount = BigInt(`0x${data.amount}`).toString()
		data.timestamp = BigInt(`0x${data.timestamp}`).toString()
		data.lamports = BigInt(`0x${data.lamports}`).toString()

		const [token, tokenTx, user] = await Promise.all([
			this.tokenRepository.findOneByAddress(data.mint),
			this.tokenTxRepository.findBySignature(data.signature, data.type),
			this.userRepository.createIfNotExist({
				address: data.seller
			})
		])

		if (!token || !user) {
			return
		}

		if (tokenTx) {
			return
		}

		try {
			await this.prisma.$transaction(
				async tx => {
					await this.updateTokenAfterTransaction(data.mint, data, tx)

					const txCreateInput: Prisma.TokenTransactionCreateInput = {
						signature: data.signature,
						network: "Solana",
						type: "Sell",
						date: DateTime.fromSeconds(Number(data.timestamp)).toJSDate(),
						token: {
							connect: {
								address: data.mint
							}
						},
						price: data.previousPrice,
						newPrice: data.newPrice,
						amount: BigInt(data.amount),
						lamports: BigInt(data.lamports),
						createdBy: {
							connect: {
								address: data.seller
							}
						}
					}

					await this.tokenTxRepository.create(txCreateInput, tx)
				},
				{
					maxWait: 5000, // 5s
					timeout: 10000, // 10s
					isolationLevel: Prisma.TransactionIsolationLevel.Serializable
				}
			)
		} catch (e) {
			Logger.log(e)
			throw new InternalServerErrorException("Failed to handle sell token")
		}

		const transaction = {
			type: TransactionType.SELL,
			date: DateTime.fromSeconds(Number(data.timestamp)).toJSDate(),
			signature: data.signature,
			amount: data.amount,
			lamports: data.lamports,
			tokenAddress: data.mint,
			signer: data.seller,
			price: data.previousPrice,
			newPrice: data.newPrice,
			token: plainToInstance(Token, token),
			createdBy: plainToInstance(User, user)
		}

		await this.rabbitMQService.emit("socket", "new-candle", {
			address: data.mint,
			date: Number(data.timestamp)
		})

		await this.rabbitMQService.emit(
			"socket",
			"new-transaction",
			plainToInstance(TokenTransaction, transaction)
		)
	}

	private async updateToken(
		address: string,
		event?: BuyTokensEvent | SellTokensEvent,
		tx?: Prisma.TransactionClient
	) {
		const token = await this.tokenRepository.findOneByAddress(address)
		if (!token) throw new NotFoundException("not found token")

		const marketCapacity = await this.ponz.calculateMarketcap(address)
		if (!marketCapacity)
			throw new InternalServerErrorException("can not get market cap")

		const updateTokenParams: Prisma.TokenUpdateInput = {
			marketCapacity,
			hallOfFame: marketCapacity > BigInt(1000000000) // 1000000000 is in test
		}

		if (event) {
			const isBuy = "buyer" in event
			updateTokenParams.volumn =
				BigInt(token.volumn) + BigInt(isBuy ? event.lamports : event.amount)
			updateTokenParams.price = new Decimal(event.newPrice)
		} else {
			const lockData = await this.ponz.getLockData(address)

			if (lockData) {
				updateTokenParams.lockAmount = lockData.lockAmount
				updateTokenParams.unlockAt = new Date(lockData.unlockAt * 1000)
			}
		}

		updateTokenParams.isCompletedKingOfHill = await this.isKingOfHill(
			marketCapacity.toString(),
			token.bondingCurveTarget.toString()
		)

		await this.tokenRepository.update(address, updateTokenParams, tx)
	}

	private async updateTokenChart(
		address: string,
		event: BuyTokensEvent | SellTokensEvent,
		tx?: Prisma.TransactionClient
	) {
		const token = await this.tokenRepository.findOneByAddress(address)
		if (!token) {
			throw new NotFoundException("not found token")
		}

		await this.tokenChart.upsertWithManySteps(
			token.id,
			event.timestamp,
			event.previousPrice,
			event.newPrice,
			event.amount,
			tx
		)
	}

	private async updateBalanceUser(
		event: BuyTokensEvent | SellTokensEvent,
		tx?: Prisma.TransactionClient
	) {
		const isBuy = "buyer" in event
		const userAddress = isBuy ? event.buyer : event.seller
		const tokenAddress = event.mint

		await this.tokenOwner.updateBalance(
			{
				userAddress: userAddress,
				tokenAddress: tokenAddress,
				amount: event.amount,
				type: isBuy ? "Buy" : "Sell"
			},
			tx
		)
	}

	private async isKingOfHill(
		marketCapacity: string,
		bondingCurveTarget: string
	) {
		const realMarketCap = BigInt(marketCapacity) - this.SOL_MARKETCAP_DEFAULT

		const realBondingCurveTarget =
			BigInt(bondingCurveTarget) - this.SOL_MARKETCAP_DEFAULT

		// Check if marketCapacity (adjusted by 28) meets 70% of bondingCurveTarget (adjusted by 28). 28 is virtual sol
		if (realMarketCap < (realBondingCurveTarget * BigInt(7)) / BigInt(10))
			return false

		const tokenWithMaxCap = await this.tokenRepository.findMaxMarketCap()
		// If the current dont have any token has the highest marketCapacity, update token as the "King of Hill".
		if (!tokenWithMaxCap) {
			return true
		}

		// find token has highest marketCap, if not exist set token is king of hill
		if (BigInt(marketCapacity) < tokenWithMaxCap.marketCapacity) return false

		// If the current token has the highest marketCapacity, update it as the "King of Hill".
		return true
	}

	private async getTimeFromSignature(signature: string) {
		const transaction = await this.connection.getTransaction(signature, {
			commitment: "confirmed",
			maxSupportedTransactionVersion: 0
		})

		if (!transaction) throw new Error(`not found transaction >> ${signature}`)

		if (!transaction.blockTime)
			throw new Error("not found block time from transaction")

		return DateTime.fromSeconds(transaction.blockTime)
	}
}
