import { Controller, Logger, NotFoundException } from "@nestjs/common"
import { Ctx, EventPattern, Payload, RmqContext } from "@nestjs/microservices"
import { TokenKeyWithHeldRepository } from "@root/_database/repositories/token-key-with-held.repository"
import { TokenRepository } from "@root/_database/repositories/token.repository"
import { Env, InjectEnv } from "@root/_env/env.module"
import { RabbitMQService } from "@root/_rabbitmq/rabbitmq.service"
import {
	ExecuteDistributionPayload,
	Transactionspayload
} from "@root/jobs/tokens/distribution/execute-distribution.controller"
import { REWARD_DISTRIBUTOR_EVENTS } from "@root/jobs/tokens/token.job"
import { HeliusService } from "@root/onchain/helius.service"
import { Ponz } from "@root/programs/ponz/program"
import { Raydium } from "@root/programs/raydium/program"
import { NATIVE_MINT } from "@solana/spl-token"
import { Keypair, PublicKey, SystemProgram, Transaction } from "@solana/web3.js"
import bs58 from "bs58"

export type JackpotPayload = {
	id: string
	address: string
	amount: string
	times: number
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
		private readonly helius: HeliusService
	) {
		this.systemWalletKeypair = Keypair.fromSecretKey(
			bs58.decode(this.env.SYSTEM_WALLET_PRIVATE_KEY)
		)
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
			await this.tokenRepository.updateJackpotPending(data.id, data.amount)
			channel.ack(originalMsg, false)
		} catch (error) {
			Logger.error(error)
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

		const _page = 1
		const _pageSize = 1000

		const [keyWithHeld, poolAddress, bondingCurve] = await Promise.all([
			this.tokenKeyWithHeld.find(data.id),
			this.raydium.fetchPoolAddress(NATIVE_MINT, new PublicKey(data.address)),
			this.ponz.getBondingCurve(new PublicKey(data.address))
		])

		if (!keyWithHeld) {
			throw new NotFoundException("not found key with held")
		}

		const listHolders = (await this.helius.getTokenHolders(data.address))
			.filter(
				holder =>
					holder.address !== poolAddress?.toBase58() &&
					holder.address !== keyWithHeld.publicKey &&
					holder.address !== bondingCurve?.toBase58()
			)
			.map(holder => holder.address)

		const createTokenTxDistribute: Transactionspayload[] = []
		const tx = new Transaction()

		for (let i = 0; i < data.times; i++) {
			// Get random user from holders
			const randomIndex = Math.floor(Math.random() * listHolders.length)
			const randomUser = listHolders[randomIndex]

			tx.add(
				SystemProgram.transfer({
					fromPubkey: new PublicKey(keyWithHeld.publicKey),
					toPubkey: new PublicKey(randomUser),
					lamports: BigInt(data.amount)
				})
			)

			createTokenTxDistribute.push({
				from: keyWithHeld.publicKey,
				tokenId: data.id,
				to: randomUser,
				lamport: data.amount,
				type: "Jackpot"
			})
		}

		tx.feePayer = this.systemWalletKeypair.publicKey

		// Set fake/dummy recentBlockhash
		tx.recentBlockhash = PublicKey.default.toBase58()

		await this.rabbitMQService.emit(
			"distribute-reward-distributor",
			REWARD_DISTRIBUTOR_EVENTS.EXECUTE_DISTRIBUTION,
			{
				rawTx: tx
					.serialize({ requireAllSignatures: false, verifySignatures: false })
					.toString("base64"),
				transactions: createTokenTxDistribute
			} as ExecuteDistributionPayload
		)

		channel.ack(originalMsg, false)
	}
}
