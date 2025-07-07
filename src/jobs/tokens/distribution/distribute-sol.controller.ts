import { web3 } from "@coral-xyz/anchor"
import { Controller, Logger, NotFoundException } from "@nestjs/common"
import { Ctx, EventPattern, Payload, RmqContext } from "@nestjs/microservices"
import { TokenKeyWithHeldRepository } from "@root/_database/repositories/token-key-with-held.repository"
import { TokenRepository } from "@root/_database/repositories/token.repository"
import { Env, InjectEnv } from "@root/_env/env.module"
import { RabbitMQService } from "@root/_rabbitmq/rabbitmq.service"
import { RedisService } from "@root/_redis/redis.service"
import { IndexerService } from "@root/indexer/indexer.service"
import { ExecuteDistributionPayload } from "@root/jobs/tokens/distribution/execute-distribution.controller"
import { UpdateJackpotAfterSwapPayload } from "@root/jobs/tokens/distribution/jackpot.controller"
import { REWARD_DISTRIBUTOR_EVENTS } from "@root/jobs/tokens/token.job"
import { HeliusService } from "@root/onchain/helius.service"
import { Ponz } from "@root/programs/ponz/program"
import { InjectConnection } from "@root/programs/programs.module"
import { Raydium } from "@root/programs/raydium/program"
import { PonzVault } from "@root/programs/vault/program"
import { NATIVE_MINT } from "@solana/spl-token"
import { Keypair, PublicKey, SystemProgram, Transaction } from "@solana/web3.js"
import bs58 from "bs58"

export type PrepareRewardDistributionPayload = {
	id: string
	address: string
	lamport: string
	idPayload: string
}

export type DistributionTransaction = {
	from: string
	tokenId: string
	to: string
	lamport: string
	type: string
}

@Controller()
export class DistributeSolController {
	// System wallet keypair for transaction signing
	private systemWalletKeypair: Keypair

	constructor(
		@InjectEnv() private env: Env,
		private readonly indexer: IndexerService,
		@InjectConnection() private connection: web3.Connection,
		private readonly tokenKeyWithHeld: TokenKeyWithHeldRepository,
		private readonly tokenRepository: TokenRepository,
		private readonly rabbitMQService: RabbitMQService,
		private readonly raydium: Raydium,
		private readonly ponz: Ponz,
		private readonly helius: HeliusService,
		private readonly ponzVault: PonzVault,
		private redis: RedisService
	) {
		// Initialize system wallet from private key stored in environment
		this.systemWalletKeypair = Keypair.fromSecretKey(
			bs58.decode(this.env.SYSTEM_WALLET_PRIVATE_KEY)
		)
	}

	redisKey(id: string) {
		return `distribute_holder: ${id}`
	}

	@EventPattern(REWARD_DISTRIBUTOR_EVENTS.PREPARE_REWARD_DISTRIBUTION)
	async handleDistributeToHolder(
		@Payload() data: PrepareRewardDistributionPayload,
		@Ctx() context: RmqContext
	) {
		const channel = context.getChannelRef()
		channel.prefetch(20, false)
		const originalMsg = context.getMessage()

		const id = await this.redis.get(this.redisKey(data.idPayload))
		if (id) {
			channel.ack(originalMsg, false)
		}

		await this.redis.set(this.redisKey(data.idPayload), "true", 600)

		try {
			Logger.log("start distribute token for token address: ", data.address)
			await this.distributeSolToHolder(data)
			Logger.log("end distribute token for token address: ", data.address)
			channel.ack(originalMsg, false)
			await this.redis.del(this.redisKey(data.idPayload))
		} catch (error) {
			Logger.error(error, "distribute token")
			await this.redis.del(this.redisKey(data.idPayload))
			throw error
		}
	}

	async distributeSolToHolder(data: PrepareRewardDistributionPayload) {
		const batchSize = 10 // Process 5 users at a time

		const keyWithHeld = await this.tokenKeyWithHeld.find(data.id)
		if (!keyWithHeld) {
			throw new NotFoundException("not found key with held")
		}

		const token = await this.tokenRepository.getTaxByID(data.id)
		if (!token) {
			throw new NotFoundException("not found token")
		}

		const totalTax = token.rewardTax + token.jackpotTax + token.burnTax

		const [holders, poolAddress, bondingCurve, tokenPoolVault] =
			await Promise.all([
				this.helius.getTokenHolders(data.address),
				this.raydium.fetchPoolAddress(NATIVE_MINT, new PublicKey(data.address)),
				this.ponz.getBondingCurve(new PublicKey(data.address)),
				this.ponzVault.tokenPoolPDA(new PublicKey(data.address))
			])
		if (!holders || holders.length === 0) return

		// Filter out pool address and keyWithHeld.publicKey from holders
		const filteredHolders = holders.filter(
			holder =>
				holder.address !== poolAddress?.toBase58() &&
				holder.address !== keyWithHeld.publicKey &&
				holder.address !== bondingCurve?.toBase58() &&
				holder.address !== tokenPoolVault?.toBase58()
		)

		const holderPubkeys = filteredHolders.map(
			holder => new PublicKey(holder.address)
		)
		const accountsInfo =
			await this.connection.getMultipleAccountsInfo(holderPubkeys)

		// Filter out non-existent accounts
		const existingHolders = filteredHolders.filter(
			(_holder, index) => accountsInfo[index] !== null
		)

		// Process holders in batches of 5
		for (let i = 0; i < existingHolders.length; i += batchSize) {
			const batch = existingHolders.slice(i, i + batchSize)

			const tx = new Transaction()

			const createTokenTxDistribute: DistributionTransaction[] = []
			for (const holder of batch) {
				const lamportToSend =
					(BigInt(data.lamport) *
						BigInt(holder.amount) *
						BigInt(token.rewardTax)) /
					(BigInt(totalTax) * BigInt(token.totalSupply))

				if (lamportToSend > 0) {
					tx.add(
						SystemProgram.transfer({
							fromPubkey: new PublicKey(keyWithHeld.publicKey),
							toPubkey: new PublicKey(holder.address),
							lamports: lamportToSend
						})
					)
					createTokenTxDistribute.push({
						from: keyWithHeld.publicKey,
						tokenId: data.id,
						to: holder.address,
						lamport: lamportToSend.toString(),
						type: "Distribute"
					})
				}
			}

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
		}

		const sendVaultTx = new Transaction().add(
			SystemProgram.transfer({
				fromPubkey: new PublicKey(keyWithHeld.publicKey),
				toPubkey: new PublicKey(this.env.REWARD_VAULT_ADDRESS),
				lamports: BigInt(data.lamport) / BigInt(100)
			})
		)

		sendVaultTx.feePayer = this.systemWalletKeypair.publicKey

		// Set fake/dummy recentBlockhash
		sendVaultTx.recentBlockhash = PublicKey.default.toBase58()

		await this.rabbitMQService.emit(
			"distribute-reward-distributor",
			REWARD_DISTRIBUTOR_EVENTS.EXECUTE_DISTRIBUTION,
			{
				transactions: [
					{
						from: keyWithHeld.publicKey,
						tokenId: data.id,
						to: this.env.MULTI_SIG_PUBKEY,
						lamport: (BigInt(data.lamport) / BigInt(100)).toString(),
						type: "SendToVault"
					}
				],
				rawTx: sendVaultTx
					.serialize({
						requireAllSignatures: false,
						verifySignatures: false
					})
					.toString("base64")
			} as ExecuteDistributionPayload
		)

		if (token.jackpotTax > 0) {
			const amountJackpot =
				(BigInt(data.lamport) * BigInt(token.jackpotTax)) / BigInt(totalTax)

			await this.rabbitMQService.emit(
				"distribute-reward-distributor",
				REWARD_DISTRIBUTOR_EVENTS.UPDATE_JACKPOT_AFTER_SWAP,
				{
					id: data.id,
					address: data.address,
					amount: amountJackpot.toString()
				} as UpdateJackpotAfterSwapPayload
			)
		}
	}
}
