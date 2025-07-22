import { web3 } from "@coral-xyz/anchor"
import { Controller, Logger, NotFoundException } from "@nestjs/common"
import { Ctx, EventPattern, Payload, RmqContext } from "@nestjs/microservices"
import { Prisma } from "@prisma/client"
import { TokenKeyWithHeldRepository } from "@root/_database/repositories/token-key-with-held.repository"
import { TokenTransactionDistributeRepository } from "@root/_database/repositories/token-tx-distribute"
import { TokenRepository } from "@root/_database/repositories/token.repository"
import { Env, InjectEnv } from "@root/_env/env.module"
import { RedisService } from "@root/_redis/redis.service"
import { keypairFromPrivateKey } from "@root/_shared/helpers/encode-decode-tx"
import { REWARD_DISTRIBUTOR_EVENTS } from "@root/jobs/tokens/token.job"
import { InjectConnection } from "@root/programs/programs.module"
import {
	ConfirmOptions,
	Keypair,
	PublicKey,
	SystemProgram,
	Transaction
} from "@solana/web3.js"
import bs58 from "bs58"

export type ExecuteDistributionPayload = {
	rawTx: string
	transactions: Transactionspayload[]
}

export type ExecuteTxWithKeyHeldPayload = {
	tx: string
	tokenId?: string
}

export type ExecuteTransactionPayload = {
	to: string
}

export type Transactionspayload = {
	tokenId: string
	from: string
	to: string
	lamport: string
	type: string
	signature?: string
}

@Controller()
export class ExecuteDistributionController {
	private readonly systemWalletKeypair: Keypair

	constructor(
		@InjectEnv() private env: Env,
		private readonly tokentxDistribute: TokenTransactionDistributeRepository,
		private readonly tokenKeyWithHeld: TokenKeyWithHeldRepository,
		private readonly tokenRepository: TokenRepository,
		@InjectConnection() private connection: web3.Connection,
		private redis: RedisService
	) {
		this.systemWalletKeypair = Keypair.fromSecretKey(
			bs58.decode(this.env.SYSTEM_WALLET_PRIVATE_KEY)
		)
	}

	sendFeeRedisKey(id: string) {
		return `send_fee: ${id}`
	}

	executeDistributionRedisKey(id: string) {
		return `send_fee: ${id}`
	}

	@EventPattern(REWARD_DISTRIBUTOR_EVENTS.SEND_FEE_SOL)
	async handleExecuteTransferFee(
		@Payload() data: ExecuteTransactionPayload,
		@Ctx() context: RmqContext
	) {
		const channel = context.getChannelRef()
		channel.prefetch(20, false)
		const originalMsg = context.getMessage()

		const id = await this.redis.get(this.sendFeeRedisKey(data.to))
		if (id) {
			channel.ack(originalMsg, false)
		}

		await this.redis.set(this.sendFeeRedisKey(data.to), "true", 600)

		try {
			Logger.log(data.to, "start execute transfer fee for token address: ")

			const accountInfo = await this.connection.getAccountInfo(
				new PublicKey(data.to)
			)
			if (accountInfo) {
				Logger.warn(`Account ${data.to} exist, skipping transfer`)
				channel.ack(originalMsg, false)
				return
			}

			const initTx = new Transaction().add(
				SystemProgram.transfer({
					fromPubkey: new PublicKey(this.systemWalletKeypair.publicKey),
					toPubkey: new PublicKey(data.to),
					lamports: 890880
				})
			)
			initTx.feePayer = this.systemWalletKeypair.publicKey

			initTx.recentBlockhash = (
				await this.connection.getLatestBlockhash()
			).blockhash

			await this.connection.sendTransaction(
				initTx,
				[this.systemWalletKeypair],
				{
					preflightCommitment: "confirmed",
					maxRetries: 5
				}
			)

			Logger.log(data.to, "end execute transfer fee for token address: ")

			channel.ack(originalMsg, false)
			await this.redis.del(this.sendFeeRedisKey(data.to))
		} catch (_error) {
			await this.redis.del(this.sendFeeRedisKey(data.to))
			throw _error
		}
	}

	@EventPattern(REWARD_DISTRIBUTOR_EVENTS.EXECUTE_DISTRIBUTION)
	async handleExecuteDistribution(
		@Payload() data: ExecuteDistributionPayload,
		@Ctx() context: RmqContext
	) {
		const channel = context.getChannelRef()
		channel.prefetch(20, false)
		const originalMsg = context.getMessage()

		const id = await this.redis.get(
			this.executeDistributionRedisKey(data.rawTx)
		)
		if (id) {
			channel.ack(originalMsg, false)
			return
		}

		await this.redis.set(
			this.executeDistributionRedisKey(data.rawTx),
			"true",
			600
		)

		try {
			if (data.transactions.length === 0) {
				channel.ack(originalMsg, false)
				return
			}

			const keyWithHeld = await this.tokenKeyWithHeld.find(
				data.transactions[0].tokenId
			)
			if (!keyWithHeld) {
				throw new NotFoundException("not found key with held")
			}

			const txBuffer = Buffer.from(data.rawTx, "base64")
			const tx = Transaction.from(txBuffer)

			const options: ConfirmOptions = {
				skipPreflight: true,
				commitment: "confirmed",
				maxRetries: 5
			}

			tx.recentBlockhash = (
				await this.connection.getLatestBlockhash()
			).blockhash

			tx.sign(
				this.systemWalletKeypair,
				keypairFromPrivateKey(keyWithHeld.privateKey)
			)

			const txSig = await this.connection.sendRawTransaction(
				tx.serialize(),
				options
			)

			// Add signature to each transaction record
			const createTokenTxDistribute = data.transactions.map(tx => ({
				tokenId: tx.tokenId,
				from: tx.from,
				to: tx.to,
				lamport: BigInt(tx.lamport),
				type: tx.type,
				signature: txSig
			})) as Prisma.TokenTransactionDistributeCreateInput[]

			await this.tokentxDistribute.insertManyWithSign(createTokenTxDistribute)

			channel.ack(originalMsg, false)
			await this.redis.del(this.executeDistributionRedisKey(data.rawTx))
		} catch (error) {
			Logger.error(error)
			await this.redis.del(this.executeDistributionRedisKey(data.rawTx))
			throw error
		}
	}
}
