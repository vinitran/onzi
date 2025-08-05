import { Controller, Logger, NotFoundException } from "@nestjs/common"
import { Ctx, EventPattern, Payload, RmqContext } from "@nestjs/microservices"
import { TokenKeyWithHeldRepository } from "@root/_database/repositories/token-key-with-held.repository"
import { TokenRepository } from "@root/_database/repositories/token.repository"
import { Env, InjectEnv } from "@root/_env/env.module"
import { RabbitMQService } from "@root/_rabbitmq/rabbitmq.service"
import { RedisService } from "@root/_redis/redis.service"
import {
	ExecuteDistributionPayload,
	Transactionspayload
} from "@root/jobs/tokens/distribution/execute-distribution.controller"
import { REWARD_DISTRIBUTOR_EVENTS } from "@root/jobs/tokens/token.job"
import { HeliusService, TokenHolder } from "@root/onchain/helius.service"
import { Ponz } from "@root/programs/ponz/program"
import { Raydium } from "@root/programs/raydium/program"
import { PonzVault } from "@root/programs/vault/program"
import { NATIVE_MINT } from "@solana/spl-token"
import { Keypair, PublicKey, SystemProgram, Transaction } from "@solana/web3.js"
import bs58 from "bs58"

export type JackpotPayload = {
	id: string
	address: string
	amount: string
	times: number
	idPayload: string
}

export type UpdateJackpotAfterSwapPayload = {
	id: string
	address: string
	amount: string
}

@Controller()
export class JackpotController {
	private readonly systemWalletKeypair: Keypair

	constructor(
		@InjectEnv() private env: Env,
		private readonly tokenKeyWithHeld: TokenKeyWithHeldRepository,
		private readonly tokenRepository: TokenRepository,
		private readonly raydium: Raydium,
		private readonly ponz: Ponz,
		private readonly rabbitMQService: RabbitMQService,
		private readonly helius: HeliusService,
		private readonly ponzVault: PonzVault,
		private redis: RedisService
	) {
		this.systemWalletKeypair = Keypair.fromSecretKey(
			bs58.decode(this.env.SYSTEM_WALLET_PRIVATE_KEY)
		)
	}

	redisKey(id: string) {
		return `jackpot: ${id}`
	}

	@EventPattern(REWARD_DISTRIBUTOR_EVENTS.UPDATE_JACKPOT_AFTER_SWAP)
	async handleJackpotAfterSwap(
		@Payload() data: UpdateJackpotAfterSwapPayload,
		@Ctx() context: RmqContext
	) {
		const channel = context.getChannelRef()
		channel.prefetch(20, false)
		const originalMsg = context.getMessage()

		try {
			Logger.log("start add jackpot for token address: ", data.address)
			await this.tokenRepository.updateJackpotPending(data.id, data.amount)
			await this.tokenRepository.updateJackpotPercent(data.id)
			Logger.log("end add jackpot for token address: ", data.address)
			channel.ack(originalMsg, false)
		} catch (error) {
			Logger.error(error, "jackpot")
			throw error
		}
	}

	@EventPattern(REWARD_DISTRIBUTOR_EVENTS.PREPARE_JACKPOT_DISTRIBUTION)
	async handleJackpot(
		@Payload() data: JackpotPayload,
		@Ctx() context: RmqContext
	) {
		const channel = context.getChannelRef()
		channel.prefetch(20, false)
		const originalMsg = context.getMessage()

		const id = await this.redis.get(this.redisKey(data.idPayload))
		if (id) {
			channel.ack(originalMsg, false)
			return
		}

		await this.redis.set(this.redisKey(data.idPayload), "true", 600)

		try {
			const [token, keyWithHeld, poolAddress, bondingCurve] = await Promise.all(
				[
					await this.tokenRepository.getTaxByID(data.id),
					this.tokenKeyWithHeld.find(data.id),
					this.raydium.fetchPoolAddress(
						NATIVE_MINT,
						new PublicKey(data.address)
					),
					this.ponz.getBondingCurve(new PublicKey(data.address))
				]
			)

			if (!token) {
				throw new NotFoundException("not found token")
			}

			if (!keyWithHeld) {
				throw new NotFoundException("not found key with held")
			}

			const listHolders = (
				await this.helius.getTokenHolders(data.address)
			).filter(
				holder =>
					holder.address !== poolAddress?.toBase58() &&
					holder.address !== keyWithHeld.publicKey &&
					holder.address !== bondingCurve?.toBase58() &&
					holder.address !== this.env.RAYDIUM_TOKEN_POOL_ADDRESS
			)

			if (token.lockAmount) {
				const creatorIndex = listHolders.findIndex(
					h => h.address === token.creatorAddress
				)

				if (creatorIndex === -1) {
					listHolders.push({
						address: token.creatorAddress,
						amount: token.lockAmount
					})
				} else {
					listHolders[creatorIndex].amount =
						listHolders[creatorIndex].amount + token.lockAmount
				}
			}

			for (let i = 0; i < data.times; i++) {
				// Get random user from holders
				const randomUser = this.randomUser(listHolders)

				const tx = new Transaction()

				tx.add(
					SystemProgram.transfer({
						fromPubkey: new PublicKey(keyWithHeld.publicKey),
						toPubkey: new PublicKey(randomUser),
						lamports: BigInt(data.amount)
					})
				)

				const createTokenTxDistribute: Transactionspayload[] = []

				createTokenTxDistribute.push({
					from: keyWithHeld.publicKey,
					tokenId: data.id,
					to: randomUser,
					lamport: data.amount,
					type: "Jackpot"
				})

				tx.feePayer = this.systemWalletKeypair.publicKey

				// Set fake/dummy recentBlockhash
				tx.recentBlockhash = PublicKey.default.toBase58()

				await this.rabbitMQService.emit(
					"distribute-reward-distributor",
					REWARD_DISTRIBUTOR_EVENTS.EXECUTE_DISTRIBUTION,
					{
						rawTx: tx
							.serialize({
								requireAllSignatures: false,
								verifySignatures: false
							})
							.toString("base64"),
						transactions: createTokenTxDistribute
					} as ExecuteDistributionPayload
				)
				await this.tokenRepository.resetJackpotQueue(data.id)
			}

			channel.ack(originalMsg, false)
			await this.redis.del(this.redisKey(data.idPayload))
		} catch (_error) {
			await this.redis.del(this.redisKey(data.idPayload))
			throw _error
		}
	}

	private randomUser(listHolders: TokenHolder[]): string {
		if (listHolders.length === 0) {
			throw new Error("Holder list is empty")
		}

		const total = listHolders.reduce((sum, h) => sum + BigInt(h.amount), 0n)
		const rand = BigInt(Math.floor(Math.random() * Number(total)))

		let cumulative = 0n
		for (const holder of listHolders) {
			cumulative += BigInt(holder.amount)
			if (rand <= cumulative) {
				return holder.address
			}
		}

		// fallback: return last address
		return listHolders[listHolders.length - 1].address
	}
}
