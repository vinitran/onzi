import { web3 } from "@coral-xyz/anchor"
import { Controller, Logger, NotFoundException } from "@nestjs/common"
import { Ctx, EventPattern, Payload, RmqContext } from "@nestjs/microservices"
import { Prisma } from "@prisma/client"
import { TokenKeyWithHeldRepository } from "@root/_database/repositories/token-key-with-held.repository"
import { TokenTransactionDistributeRepository } from "@root/_database/repositories/token-tx-distribute"
import { Env, InjectEnv } from "@root/_env/env.module"
import { keypairFromPrivateKey } from "@root/_shared/helpers/encode-decode-tx"
import { IndexerService } from "@root/indexer/indexer.service"
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

type DistributeMessageType = {
	id: string
	address: string
	lamport: string
}

@Controller()
export class DistributorController {
	private systemWalletKeypair: Keypair

	constructor(
		@InjectEnv() private env: Env,
		private readonly indexer: IndexerService,
		@InjectConnection() private connection: web3.Connection,
		private readonly tokenKeyWithHeld: TokenKeyWithHeldRepository,
		private readonly tokentxDistribute: TokenTransactionDistributeRepository
	) {
		this.systemWalletKeypair = Keypair.fromSecretKey(
			bs58.decode(this.env.SYSTEM_WALLET_PRIVATE_KEY)
		)
	}

	@EventPattern(REWARD_DISTRIBUTOR_EVENTS.DISTRIBUTE)
	async handleDistributeToHolder(
		@Payload() data: DistributeMessageType,
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

	async distributeSolToHolder(data: DistributeMessageType) {
		console.log("start distribute to")
		let page = 1
		const pageSize = 1000 // Get 1000 users per page
		const batchSize = 10 // Process 5 users at a time

		const keyWithHeld = await this.tokenKeyWithHeld.find(data.id)
		if (!keyWithHeld) {
			throw new NotFoundException("not found key with held")
		}

		while (true) {
			try {
				const holders = await this.indexer.getTokenHoldersByPage(
					data.address,
					page,
					pageSize
				)
				if (!holders || holders.length === 0) break

				const listHolders = [...new Set(holders)]

				// Process holders in batches of 5
				for (let i = 0; i < listHolders.length; i += batchSize) {
					const batch = listHolders.slice(i, i + batchSize)

					const tx = new Transaction()

					let createTokenTxDistribute: Prisma.TokenTransactionDistributeCreateInput[] =
						[]
					for (const holder of batch) {
						const lamportToSend =
							(BigInt(data.lamport) * BigInt(holder.amount)) /
							BigInt(1000000000000000)
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
							lamport: BigInt(lamportToSend),
							type: "Distribute"
						})
					}

					tx.recentBlockhash = (
						await this.connection.getLatestBlockhash()
					).blockhash
					tx.feePayer = this.systemWalletKeypair.publicKey

					const options: ConfirmOptions = {
						preflightCommitment: "confirmed",
						commitment: "confirmed"
					}

					const txSig = await this.connection.sendTransaction(
						tx,
						[
							this.systemWalletKeypair,
							keypairFromPrivateKey(keyWithHeld.privateKey)
						],
						options
					)

					// Add signature to each transaction record
					createTokenTxDistribute = createTokenTxDistribute.map(tx => ({
						...tx,
						signature: txSig
					}))

					await this.tokentxDistribute.insertManyWithSign(
						createTokenTxDistribute
					)
					Logger.log(
						`Transaction signature for page ${page}, batch ${Math.floor(i / batchSize) + 1}:`,
						txSig
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
	}
}
