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
	BuyTokensEvent,
	CreateTokenEvent,
	SellTokensEvent
} from "@root/programs/ponz/events"
import { Ponz } from "@root/programs/ponz/program"
import { InjectConnection } from "@root/programs/programs.module"
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

	async handlerCreateToken({
		event,
		signature
	}: { event: CreateTokenEvent; signature: string }) {
		const tokenBySig = await this.tokenTxRepository.findBySignature(signature)

		if (tokenBySig) {
			return
		}

		const token = await this.tokenRepository.findOneByAddress(event.mint)
		if (!token) {
			return
		}

		const date = await this.getTimeFromSignature(signature)

		try {
			await this.prisma.$transaction(
				async tx => {
					await this.tokenRepository.updateTokenOnchain(
						event.mint,
						{
							metadata: await getTokenMetaData(event.uri),
							bumpAt: date.toJSDate(),
							name: event.name,
							uri: event.uri,
							ticker: event.symbol,
							network: Network.Solana,
							bump: true
						},
						tx
					)

					await this.updateToken(event.mint, undefined, tx)
				},
				{
					maxWait: 5000, // 5s
					timeout: 10000, // 10s
					isolationLevel: Prisma.TransactionIsolationLevel.Serializable
				}
			)
		} catch (e) {
			// @ts-ignore
			if (e.code === "P2002" && e.meta?.target?.includes("signature")) {
				Logger.warn(`Duplicate signature: ${signature}, skipping.`)
				return
			}
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

	async handlerBuyToken({
		event,
		signature
	}: { event: BuyTokensEvent; signature: string }) {
		event.amount = BigInt(`0x${event.amount}`).toString()
		event.timestamp = BigInt(`0x${event.timestamp}`).toString()
		event.lamports = BigInt(`0x${event.lamports}`).toString()

		const [tokenBySig, token, user] = await Promise.all([
			this.tokenTxRepository.findBySignature(signature),
			this.tokenRepository.findOneByAddress(event.mint),
			this.userRepository.createIfNotExist({
				address: event.buyer
			})
		])

		if (tokenBySig) {
			return
		}

		if (!token || !user) {
			return
		}

		try {
			await this.prisma.$transaction(
				async tx => {
					await this.updateTokenAfterTransaction(event.mint, event, tx)

					await this.tokenTxRepository.create(
						{
							address: event.mint,
							date: DateTime.fromSeconds(Number(event.timestamp)),
							amount: event.amount,
							lamports: event.lamports,
							type: "Buy",
							signer: event.buyer,
							price: event.previousPrice,
							newPrice: event.newPrice,
							network: "Solana",
							signature: signature
						},
						tx
					)
				},
				{
					maxWait: 5000, // 5s
					timeout: 10000, // 10s
					isolationLevel: Prisma.TransactionIsolationLevel.Serializable
				}
			)
		} catch (e) {
			// @ts-ignore
			if (e.code === "P2002" && e.meta?.target?.includes("signature")) {
				Logger.warn(`Duplicate signature: ${signature}, skipping.`)
				return
			}
			throw new InternalServerErrorException("Failed to handle buy token")
		}

		await this.rabbitMQService.emit("new-candle", {
			address: event.mint,
			date: Number(event.timestamp)
		})
	}

	async handlerSellToken({
		event,
		signature
	}: { event: SellTokensEvent; signature: string }) {
		event.amount = BigInt(`0x${event.amount}`).toString()
		event.timestamp = BigInt(`0x${event.timestamp}`).toString()
		event.lamports = BigInt(`0x${event.lamports}`).toString()

		const [tokenBySig, token, user] = await Promise.all([
			this.tokenTxRepository.findBySignature(signature),
			this.tokenRepository.findOneByAddress(event.mint),
			this.userRepository.createIfNotExist({
				address: event.seller
			})
		])

		if (tokenBySig) {
			return
		}

		if (!token || !user) {
			return
		}

		try {
			await this.prisma.$transaction(
				async tx => {
					await this.updateTokenAfterTransaction(event.mint, event, tx)

					await this.tokenTxRepository.create(
						{
							type: "Sell",
							date: DateTime.fromSeconds(Number(event.timestamp)),
							signature,
							amount: event.amount,
							lamports: event.lamports,
							address: event.mint,
							signer: event.seller,
							price: event.previousPrice,
							newPrice: event.newPrice,
							network: "Solana"
						},
						tx
					)
				},
				{
					maxWait: 5000, // 5s
					timeout: 10000, // 10s
					isolationLevel: Prisma.TransactionIsolationLevel.Serializable
				}
			)
		} catch (e) {
			// @ts-ignore
			if (e.code === "P2002" && e.meta?.target?.includes("signature")) {
				Logger.warn(`Duplicate signature: ${signature}, skipping.`)
				return
			}
			throw new InternalServerErrorException("Failed to handle sell token")
		}
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

		const kingOfHill = await this.isKingOfHill(
			marketCapacity.toString(),
			token.bondingCurveTarget.toString()
		)

		updateTokenParams.isCompletedKingOfHill = kingOfHill

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
