import { web3 } from "@coral-xyz/anchor"
import { Controller, Logger, NotFoundException } from "@nestjs/common"
import { Ctx, EventPattern, Payload, RmqContext } from "@nestjs/microservices"
import { TokenFeeBalanceRepository } from "@root/_database/repositories/token-fee-balance"
import { TokenKeyWithHeldRepository } from "@root/_database/repositories/token-key-with-held.repository"
import { Env, InjectEnv } from "@root/_env/env.module"
import { keypairFromPrivateKey } from "@root/_shared/helpers/encode-decode-tx"
import { IndexerService } from "@root/indexer/indexer.service"
import { REWARD_DISTRIBUTOR_EVENTS } from "@root/jobs/tokens/token.job"
import { InjectConnection } from "@root/programs/programs.module"
import {
	ASSOCIATED_TOKEN_PROGRAM_ID,
	TOKEN_2022_PROGRAM_ID,
	TransferFeeAmount,
	getAccount,
	getAssociatedTokenAddressSync,
	getOrCreateAssociatedTokenAccount,
	getTransferFeeAmount,
	withdrawWithheldTokensFromAccounts
} from "@solana/spl-token"
import { Keypair, PublicKey } from "@solana/web3.js"
import bs58 from "bs58"

@Controller()
export class TokenJobsController {
	constructor(
		@InjectEnv() private env: Env,
		private readonly indexer: IndexerService,
		@InjectConnection() private connection: web3.Connection,
		private readonly tokenKeyWithHeld: TokenKeyWithHeldRepository,
		private readonly tokenFeeBalance: TokenFeeBalanceRepository
	) {}

	@EventPattern(REWARD_DISTRIBUTOR_EVENTS.Token)
	async handleCreateToken(
		@Payload() data: { id: string; address: string },
		@Ctx() context: RmqContext
	) {
		const channel = context.getChannelRef()
		channel.prefetch(5, false)

		await this.collectFeesForToken(data)
	}

	async collectFeesForToken(data: { id: string; address: string }) {
		let page = 1
		const pageSize = 2 // Process 50 user at a time

		const systemWalletKeypair = Keypair.fromSecretKey(
			bs58.decode(this.env.SYSTEM_WALLET_PRIVATE_KEY)
		)

		const keyWithHeld = await this.tokenKeyWithHeld.find(data.id)
		if (!keyWithHeld) {
			throw new NotFoundException("not found key with held")
		}

		const destinationTokenAccount = await getOrCreateAssociatedTokenAccount(
			this.connection,
			systemWalletKeypair,
			new PublicKey(data.address),
			new PublicKey(keyWithHeld.publicKey),
			true,
			"confirmed",
			{},
			TOKEN_2022_PROGRAM_ID,
			ASSOCIATED_TOKEN_PROGRAM_ID
		)

		let feeAmountTotal = BigInt(0)

		while (true) {
			try {
				const holders = await this.indexer.getTokenHoldersByPage(
					data.address,
					page,
					pageSize
				)
				if (!holders) break

				if (holders.length === 0) break

				const sourceAddress = [...new Set(holders)].map(account =>
					getAssociatedTokenAddressSync(
						new PublicKey(data.address),
						new PublicKey(account),
						true,
						TOKEN_2022_PROGRAM_ID,
						ASSOCIATED_TOKEN_PROGRAM_ID
					)
				)

				// Filter source addresses that have transfer fees > 0
				const sourceAddressesWithFees = (
					await Promise.all(
						sourceAddress.map(async address => {
							try {
								const account = await getAccount(
									this.connection,
									address,
									"finalized",
									TOKEN_2022_PROGRAM_ID
								)

								const feeAmount = getTransferFeeAmount(account)
								return { address, feeAmount }
							} catch (_error) {
								return null
							}
						})
					)
				).filter(
					(
						item
					): item is {
						address: PublicKey
						feeAmount: TransferFeeAmount | null
					} => item !== null
				)

				const validSourceAddresses = sourceAddressesWithFees
					.filter(({ feeAmount }) => feeAmount && feeAmount.withheldAmount > 0)
					.map(({ address, feeAmount }) => {
						feeAmountTotal = feeAmountTotal + feeAmount!.withheldAmount
						return address
					})

				if (validSourceAddresses.length === 0) {
					page++
					continue
				}

				const txSig = await withdrawWithheldTokensFromAccounts(
					this.connection,
					systemWalletKeypair,
					new PublicKey(data.address),
					destinationTokenAccount.address,
					keypairFromPrivateKey(keyWithHeld.privateKey),
					[],
					validSourceAddresses,
					{
						commitment: "confirmed"
					},
					TOKEN_2022_PROGRAM_ID
				)

				Logger.log("txSign collect fee", txSig)
				page++
			} catch (error) {
				Logger.log("err when collect fee:", error)
				break
			}
		}

		await this.tokenFeeBalance.upsert(data.id, feeAmountTotal)
	}
}
