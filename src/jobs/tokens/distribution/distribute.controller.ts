import { web3 } from "@coral-xyz/anchor"
import { Controller, Logger, NotFoundException } from "@nestjs/common"
import { Ctx, EventPattern, Payload, RmqContext } from "@nestjs/microservices"
import { Prisma } from "@prisma/client"
import { TokenKeyWithHeldRepository } from "@root/_database/repositories/token-key-with-held.repository"
import { TokenTransactionDistributeRepository } from "@root/_database/repositories/token-tx-distribute"
import { TokenRepository } from "@root/_database/repositories/token.repository"
import { Env, InjectEnv } from "@root/_env/env.module"
import { RabbitMQService } from "@root/_rabbitmq/rabbitmq.service"
import { keypairFromPrivateKey } from "@root/_shared/helpers/encode-decode-tx"
import { IndexerService } from "@root/indexer/indexer.service"
import { REWARD_DISTRIBUTOR_EVENTS } from "@root/jobs/tokens/token.job"
import { InjectConnection } from "@root/programs/programs.module"
import { Raydium } from "@root/programs/raydium/program"
import { NATIVE_MINT } from "@solana/spl-token"
import {
	ConfirmOptions,
	Keypair,
	PublicKey,
	SystemProgram,
	Transaction
} from "@solana/web3.js"
import bs58 from "bs58"

type PrepareRewardDistributionPayload = {
	id: string
	address: string
	lamport: string
}

export type BurnFeePayload = {
	id: string
	address: string
	amount: string
}

type DistributionTransaction = {
	from: string
	tokenId: string
	to: string
	lamport: string
	type: string
}

type ExecuteDistributionPayload = {
	tx: string
	data: DistributionTransaction[]
}

type UpdateJackpotAfterSwapPayload = {
	id: string
	address: string
	amount: string
}

type PrepareJackpotDistributionPayload = {
	id: string
	address: string
	amount: string
	times: number
}

@Controller()
export class DistributorController {
	private readonly systemWalletKeypair: Keypair

	constructor(
		@InjectEnv() private env: Env,
		private readonly indexer: IndexerService,
		@InjectConnection() private connection: web3.Connection,
		private readonly tokenKeyWithHeld: TokenKeyWithHeldRepository,
		private readonly tokentxDistribute: TokenTransactionDistributeRepository,
		private readonly tokenRepository: TokenRepository,
		private readonly rabbitMQService: RabbitMQService,
		private readonly raydium: Raydium
	) {
		this.systemWalletKeypair = Keypair.fromSecretKey(
			bs58.decode(this.env.SYSTEM_WALLET_PRIVATE_KEY)
		)
	}

	@EventPattern(REWARD_DISTRIBUTOR_EVENTS.PREPARE_REWARD_DISTRIBUTION)
	async handleDistributeToHolder(
		@Payload() data: PrepareRewardDistributionPayload,
		@Ctx() context: RmqContext
	) {
		const channel = context.getChannelRef()
		channel.prefetch(20, false)
		const originalMsg = context.getMessage()

		try {
			await this.distributeSolToHolder(data)
			channel.ack(originalMsg, false)
		} catch (error) {
			Logger.error(error)
			throw error
		}
	}

	@EventPattern(REWARD_DISTRIBUTOR_EVENTS.BURN_FEE)
	async handleBurnToken(
		@Payload() data: BurnFeePayload,
		@Ctx() context: RmqContext
	) {
		const channel = context.getChannelRef()
		channel.prefetch(20, false)
		const originalMsg = context.getMessage()

		try {
			const txSign = await this.raydium.burnToken(
				new PublicKey(data.address),
				data.amount,
				this.systemWalletKeypair
			)
			await this.tokentxDistribute.insert({
				from: this.systemWalletKeypair.publicKey.toBase58(),
				tokenId: data.id,
				amountToken: BigInt(data.amount),
				signature: txSign,
				type: "Burn"
			})

			channel.ack(originalMsg, false)
		} catch (error) {
			Logger.error(error)
			throw error
		}
	}

	@EventPattern(REWARD_DISTRIBUTOR_EVENTS.EXECUTE_DISTRIBUTION)
	async handleDistributeSOLToHolder(
		@Payload() data: ExecuteDistributionPayload,
		@Ctx() context: RmqContext
	) {
		const channel = context.getChannelRef()
		channel.prefetch(20, false)
		const originalMsg = context.getMessage()

		if (data.data.length === 0) {
			channel.ack(originalMsg, false)
			return
		}

		const keyWithHeld = await this.tokenKeyWithHeld.find(data.data[0].tokenId)
		if (!keyWithHeld) {
			throw new NotFoundException("not found key with held")
		}

		try {
			const txBuffer = Buffer.from(data.tx, "base64")
			const tx = Transaction.from(txBuffer)

			const options: ConfirmOptions = {
				skipPreflight: true,
				commitment: "processed",
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
			const createTokenTxDistribute = data.data.map(tx => ({
				tokenId: tx.tokenId,
				from: tx.from,
				to: tx.to,
				lamport: BigInt(tx.lamport),
				type: tx.type,
				signature: txSig
			})) as Prisma.TokenTransactionDistributeCreateInput[]

			await this.tokentxDistribute.insertManyWithSign(createTokenTxDistribute)

			if (data.data[0].type === "Jackpot") {
				await this.tokenRepository.resetJackpotQueue(data.data[0].tokenId)
			}

			channel.ack(originalMsg, false)
		} catch (error) {
			Logger.error(error)
			throw error
		}
	}

	@EventPattern(REWARD_DISTRIBUTOR_EVENTS.UPDATE_JACKPOT_AFTER_SWAP)
	async handleJackpot(
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
	async handleDistributeJackpot(
		@Payload() data: PrepareJackpotDistributionPayload,
		@Ctx() context: RmqContext
	) {
		const channel = context.getChannelRef()
		channel.prefetch(20, false)
		const originalMsg = context.getMessage()

		let page = 1
		const pageSize = 1000

		let holdersAddress: string[] = []

		while (true) {
			const holders = await this.indexer.getTokenHoldersByPage(
				data.address,
				page,
				pageSize
			)
			if (!holders || holders.length === 0) break

			holdersAddress = [
				...holdersAddress,
				...holders.map(holder => holder.owner)
			]

			if (holders.length < pageSize) break
			page++
		}

		const [keyWithHeld, poolAddress] = await Promise.all([
			this.tokenKeyWithHeld.find(data.id),
			this.raydium.fetchPoolAddress(NATIVE_MINT, new PublicKey(data.address))
		])
		if (!keyWithHeld) {
			throw new NotFoundException("not found key with held")
		}

		// Filter out pool address and keyWithHeld.publicKey from holders
		const filteredHolders = holdersAddress.filter(
			holder =>
				holder !== poolAddress?.toBase58() && holder !== keyWithHeld.publicKey
		)

		const listHolders = [...new Set(filteredHolders)]

		const createTokenTxDistribute: DistributionTransaction[] = []
		const tx = new Transaction()

		for (let i = 0; i < data.times; i++) {
			// Get random user from holders
			const randomIndex = Math.floor(Math.random() * holdersAddress.length)
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
				tx: tx
					.serialize({ requireAllSignatures: false, verifySignatures: false })
					.toString("base64"),
				data: createTokenTxDistribute
			}
		)

		channel.ack(originalMsg, false)
	}

	async distributeSolToHolder(data: PrepareRewardDistributionPayload) {
		let page = 1
		const pageSize = 1000 // Get 1000 users per page
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

		while (true) {
			try {
				const [holders, poolAddress] = await Promise.all([
					this.indexer.getTokenHoldersByPage(data.address, page, pageSize),
					this.raydium.fetchPoolAddress(
						NATIVE_MINT,
						new PublicKey(data.address)
					)
				])
				if (!holders || holders.length === 0) break

				// Filter out pool address and keyWithHeld.publicKey from holders
				const filteredHolders = holders.filter(
					holder =>
						holder.owner !== poolAddress?.toBase58() &&
						holder.owner !== keyWithHeld.publicKey
				)

				const listHolders = [...new Set(filteredHolders)]
				const holderPubkeys = listHolders.map(
					holder => new PublicKey(holder.owner)
				)
				const accountsInfo =
					await this.connection.getMultipleAccountsInfo(holderPubkeys)

				// Filter out non-existent accounts
				const existingHolders = listHolders.filter(
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

						tx.add(
							SystemProgram.transfer({
								fromPubkey: new PublicKey(keyWithHeld.publicKey),
								toPubkey: new PublicKey(holder.owner),
								lamports: lamportToSend
							})
						)
						createTokenTxDistribute.push({
							from: keyWithHeld.publicKey,
							tokenId: data.id,
							to: holder.owner,
							lamport: lamportToSend.toString(),
							type: "Distribute"
						})
					}

					tx.feePayer = this.systemWalletKeypair.publicKey

					// Set fake/dummy recentBlockhash
					tx.recentBlockhash = PublicKey.default.toBase58()

					await this.rabbitMQService.emit(
						"distribute-reward-distributor",
						REWARD_DISTRIBUTOR_EVENTS.EXECUTE_DISTRIBUTION,
						{
							tx: tx
								.serialize({
									requireAllSignatures: false,
									verifySignatures: false
								})
								.toString("base64"),
							data: createTokenTxDistribute
						}
					)
				}

				// If we got less than pageSize users, we've reached the end
				if (holders.length < pageSize) break

				page++
			} catch (error) {
				Logger.log("Error when distributing SOL:", error)
				break
			}
		}

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
				}
			)
		}
	}
}
