import { web3 } from "@coral-xyz/anchor"
import { Injectable, Logger, OnModuleInit } from "@nestjs/common"
import { Network } from "@prisma/client"
import { TokenOwnerRepository } from "@root/_database/repositories/token-owner.repository"
import { TokenTransactionRepository } from "@root/_database/repositories/token-transaction.repository"
import { TokenRepository } from "@root/_database/repositories/token.repository"
import { UserRepository } from "@root/_database/repositories/user.repository"
import { Env, InjectEnv } from "@root/_env/env.module"
import { getTokenMetaData } from "@root/_shared/helpers/get-token-metadata"
import { IndexerGateway } from "@root/indexer/indexer.gateway"
import {
	BuyTokensEvent,
	CreateTokenEvent,
	SellTokensEvent
} from "@root/programs/ponz/events"
import { Ponz } from "@root/programs/ponz/program"
import { InjectConnection } from "@root/programs/programs.module"
import { DateTime } from "luxon"
import WebSocket from "ws"

@Injectable()
export class SolanaIndexerService implements OnModuleInit {
	private HELIUS_WS = "wss://devnet.helius-rpc.com/?api-key="
	private wsSolana: WebSocket

	constructor(
		@InjectEnv() private env: Env,
		private ponz: Ponz,
		@InjectConnection() private connection: web3.Connection,
		private userRepository: UserRepository,
		private tokenRepository: TokenRepository,
		private tokenTxRepository: TokenTransactionRepository,
		private tokenOwner: TokenOwnerRepository,
		private socket: IndexerGateway
	) {}

	async onModuleInit() {
		this.connectToWebSocketSolana()
	}

	private connectToWebSocketSolana() {
		this.wsSolana = new WebSocket(`${this.HELIUS_WS}${this.env.HELIUS_API_KEY}`) // Replace with the WebSocket server URL

		this.wsSolana.on("open", () => {
			const contractAddress = this.env.CONTRACT_ADDRESS
			this.wsSolana.send(
				JSON.stringify({
					jsonrpc: "2.0",
					id: 1,
					method: "logsSubscribe",
					params: [
						{
							mentions: [contractAddress]
						},
						{
							commitment: "finalized"
						}
					]
				})
			)
			console.log("connectToWebSocketSolana")
		})

		this.wsSolana.on("message", async (data: string) => {
			const parsedData = JSON.parse(data)
			if (parsedData?.params?.result?.value?.logs) {
				const logData = this.ponz.parseLogs(parsedData.params.result.value.logs)

				for await (const log of logData) {
					const signature: string = parsedData.params.result.value.signature
					switch (log.name) {
						case "createTokenEvent": {
							const event = log.data as CreateTokenEvent
							await this.handlerCreateToken({ event, signature })
							break
						}

						case "buyEvent": {
							const event = log.data as BuyTokensEvent
							await this.handlerBuyToken({ event, signature })
							break
						}

						case "sellEvent": {
							const event = log.data as SellTokensEvent
							await this.handlerSellToken({ event, signature })
							break
						}

						default: {
							break
						}
					}
				}
			}
		})

		this.wsSolana.on("close", () => {
			console.log("WebSocket connection closed. Reconnecting...")
			this.connectToWebSocketSolana()
		})
	}

	private async handlerCreateToken({
		event,
		signature
	}: { event: CreateTokenEvent; signature: string }) {
		const tokenBySig = await this.tokenTxRepository.findBySignature(signature)

		if (tokenBySig) {
			return
		}

		const [date, user, metadata] = await Promise.all([
			this.getTimeFromSignature(signature),
			this.userRepository.createIfNotExist({
				address: event.creator.toBase58()
			}),
			getTokenMetaData(event.uri)
		])

		await this.tokenRepository.updateTokenOnchain(event.mint.toBase58(), {
			metadata,
			bumpAt: date.toJSDate(),
			name: event.name,
			uri: event.uri,
			ticker: event.symbol,
			network: Network.Solana,
			bump: true,
			creator: {
				connect: {
					address: event.creator.toBase58()
				}
			}
		})

		await this.updateToken(event.mint)

		this.socket.handleTokenCreation({
			address: event.mint.toBase58(),
			name: event.name,
			network: Network.Solana,
			createdBy: user
		})
	}

	private async updateTokenAfterTransaction(
		mint: web3.PublicKey,
		event: BuyTokensEvent | SellTokensEvent
	) {
		await Promise.all([
			this.updateToken(mint, event),
			this.updateBalanceUser(event)
		])
	}

	private async handlerBuyToken({
		event,
		signature
	}: { event: BuyTokensEvent; signature: string }) {
		const date = await this.getTimeFromSignature(signature)

		this.socket.handleBuyTx({
			address: event.mint.toBase58(),
			date: date.toMillis(),
			amount: event.amount,
			lamports: event.lamports,
			signer: event.buyer.toBase58(),
			price: event.previousPrice,
			newPrice: event.newPrice,
			network: "Solana",
			signature: signature
		})

		await this.updateTokenAfterTransaction(event.mint, event)

		const tokenBySig = await this.tokenTxRepository.findBySignature(signature)
		if (tokenBySig) {
			return
		}

		await this.userRepository.createIfNotExist({
			address: event.buyer.toBase58()
		})

		await this.tokenTxRepository.create({
			address: event.mint,
			date,
			amount: event.amount,
			lamports: event.lamports,
			type: "Buy",
			signer: event.buyer,
			price: event.previousPrice,
			newPrice: event.newPrice,
			network: "Solana",
			signature: signature
		})
	}

	private async handlerSellToken({
		event,
		signature
	}: { event: SellTokensEvent; signature: string }) {
		const date = await this.getTimeFromSignature(signature)

		this.socket.handleSellTx({
			address: event.mint.toBase58(),
			date: date.toMillis(),
			amount: event.amount,
			lamports: event.lamports,
			signer: event.seller.toBase58(),
			price: event.previousPrice,
			newPrice: event.newPrice,
			network: "Solana",
			signature: signature
		})

		await this.userRepository.createIfNotExist({
			address: event.seller.toBase58()
		})

		await this.updateTokenAfterTransaction(event.mint, event)

		const tokenBySig = await this.tokenTxRepository.findBySignature(signature)

		if (tokenBySig) {
			return
		}

		await this.userRepository.createIfNotExist({
			address: event.seller.toBase58()
		})

		await this.tokenTxRepository.create({
			type: "Sell",
			date,
			signature,
			amount: event.amount,
			lamports: event.lamports,
			address: event.mint,
			signer: event.seller,
			price: event.previousPrice,
			newPrice: event.newPrice,
			network: "Solana"
		})
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

	private async updateToken(
		address: web3.PublicKey,
		event?: BuyTokensEvent | SellTokensEvent
	) {
		const token = await this.tokenRepository.findOneByAddress(
			address.toBase58()
		)
		if (!token) return

		const marketCapacity = await this.ponz.calculateMarketcap(address)
		if (!marketCapacity) return

		const hallOfFame = marketCapacity > 1000000000 // 1000000000 is in test
		if (event) {
			const isBuy = "buyer" in event
			const volumeChange = isBuy ? Number(event.lamports) : Number(event.amount)
			const newVolume = (token.volumn || 0) + volumeChange

			await this.tokenRepository.update(address.toBase58(), {
				marketCapacity,
				volumn: newVolume,
				price: event.newPrice,
				hallOfFame
			})
		} else {
			const lockData = await this.ponz.getLockData(address)

			await this.tokenRepository.update(address.toBase58(), {
				marketCapacity,
				hallOfFame,
				lockAmount: lockData.lockAmount,
				unlockAt: new Date(lockData.unlockAt * 1000)
			})
		}

		await this.verifyKingOfHill(
			token.id,
			marketCapacity,
			token.bondingCurveTarget
		)
	}

	private async updateBalanceUser(event: BuyTokensEvent | SellTokensEvent) {
		const isBuy = "buyer" in event
		const userAddress = (isBuy ? event.buyer : event.seller).toBase58()
		const tokenAddress = event.mint.toBase58()

		// First ensure both user and token exist
		await this.userRepository.createIfNotExist({ address: userAddress })

		// Check if token exists
		const token = await this.tokenRepository.findOneByAddress(tokenAddress)
		if (!token) {
			Logger.warn(
				`Token ${tokenAddress} not found when trying to update balance for user ${userAddress}`
			)
			return
		}

		await this.tokenOwner.saveTokenOwner({
			userAddress: userAddress,
			tokenAddress: tokenAddress,
			amount: event.amount,
			type: isBuy ? "BUY" : "SELL"
		})
	}

	private async verifyKingOfHill(
		id: string,
		marketCapacity: number,
		bondingCurveTarget: number
	) {
		// Check if marketCapacity (adjusted by 28) meets 70% of bondingCurveTarget (adjusted by 28). 28 is virtual sol
		if (marketCapacity - 28 < 0.7 * (bondingCurveTarget - 28)) return

		const tokenWithMaxCap = await this.tokenRepository.findMaxMarketCap()
		// If the current dont have any token has the highest marketCapacity, update token as the "King of Hill".
		if (!tokenWithMaxCap) {
			return this.tokenRepository.updateKingOfCoin(id)
		}

		// find token has highest marketCap, if not exist set token is king of hill
		if (marketCapacity < tokenWithMaxCap.marketCapacity) return

		// If the current token has the highest marketCapacity, update it as the "King of Hill".
		return this.tokenRepository.updateKingOfCoin(id)
	}
}
