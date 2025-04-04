import { Injectable } from "@nestjs/common"
import { Cron, CronExpression } from "@nestjs/schedule"
import { TokenKeyRepository } from "@root/_database/repositories/token-key.repository"
import { TokenRepository } from "@root/_database/repositories/token.repository"
import { Env, InjectEnv } from "@root/_env/env.module"
import { keypairFromPrivateKey } from "@root/_shared/helpers/encode-decode-tx"
import { IndexerService } from "@root/indexer/indexer.service"
import {
	ASSOCIATED_TOKEN_PROGRAM_ID,
	TOKEN_2022_PROGRAM_ID,
	getAssociatedTokenAddressSync,
	withdrawWithheldTokensFromAccounts
} from "@solana/spl-token"
import { Connection, Keypair, PublicKey } from "@solana/web3.js"

@Injectable()
export class TokenJobs {
	private connection: Connection
	private payer: Keypair
	private HELIUS_RPC =
		this.env.IS_TEST === "true"
			? `https://devnet.helius-rpc.com/?api-key=${this.env.HELIUS_API_KEY}`
			: `https://mainnet.helius-rpc.com/?api-key=${this.env.HELIUS_API_KEY}`
	constructor(
		private readonly tokenKeyRepository: TokenKeyRepository,
		private readonly tokenRepository: TokenRepository,
		private indexer: IndexerService,
		@InjectEnv() private env: Env
	) {
		this.connection = new Connection(this.HELIUS_RPC)
		this.payer = keypairFromPrivateKey(this.env.COLLECT_FEE_PRIVATE_KEY)
	}

	@Cron(CronExpression.EVERY_5_MINUTES)
	async collectFeesFromAllMints() {
		try {
			console.log("start collect fee")
			const PAGE_SIZE = 10 // Process 10 tokens at a time
			let currentPage = 1
			let hasMorePages = true

			while (hasMorePages) {
				// Get tokens for current page
				const { tokens, maxPage } = await this.tokenRepository.findAllByPage(
					currentPage,
					PAGE_SIZE
				)
				console.log(
					`Processing page ${currentPage}/${maxPage} with ${tokens.length} tokens`
				)

				for (const token of tokens) {
					console.log(`Processing token: ${token.address}`)
					await this.collectFeesForToken(new PublicKey(token.address))
					console.log(`Done Processing token: ${token.address}`)
				}

				// Check if we've processed all pages
				hasMorePages = currentPage < maxPage
				console.log("hasMorePages", hasMorePages)
				currentPage++
			}
		} catch (error) {
			console.error("Error in collectFeesFromAllMints:", error)
		}
	}

	async collectFeesForToken(mint: PublicKey) {
		let page = 1
		const pageSize = 100 // Process 10 user at a time

		const destinationTokenAccount = getAssociatedTokenAddressSync(
			mint,
			this.payer.publicKey,
			undefined,
			TOKEN_2022_PROGRAM_ID,
			ASSOCIATED_TOKEN_PROGRAM_ID
		)

		while (true) {
			try {
				const holders = await this.indexer.getTokenHoldersByPage(
					mint.toBase58(),
					page,
					pageSize
				)
				if (!holders) break

				if (holders.length === 0) break

				const txSig = await withdrawWithheldTokensFromAccounts(
					this.connection,
					this.payer,
					mint,
					destinationTokenAccount,
					this.payer,
					[],
					holders.map(account => new PublicKey(account)),
					{
						commitment: "confirmed"
					},
					TOKEN_2022_PROGRAM_ID
				)
				console.log("txSign collect fee", txSig)
				page++
			} catch (error) {
				console.log("err when collect fee:", error)
				break
			}
		}
	}
}
