import { Injectable } from "@nestjs/common"
import { Cron, CronExpression } from "@nestjs/schedule"
import { PrismaClient } from "@prisma/client"
import { TokenKeyRepository } from "@root/_database/repositories/token-key.repository"
import { TokenRepository } from "@root/_database/repositories/token.repository"
import { Env, InjectEnv } from "@root/_env/env.module"
import { keypairFromPrivateKey } from "@root/_shared/helpers/encode-decode-tx"
import { IndexerService } from "@root/indexer/indexer.service"
import { Connection, Keypair } from "@solana/web3.js"

@Injectable()
export class TokenJobs {
	private connection: Connection
	private payer: Keypair
	private prisma = new PrismaClient()
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

	// @Cron(CronExpression.EVERY_MINUTE)
	// async collectFeesFromAllMints() {
	// 	try {
	// 		console.log("start collect fee")
	// 		const PAGE_SIZE = 10 // Process 10 tokens at a time
	// 		let currentPage = 1
	// 		let hasMorePages = true
	//
	// 		while (hasMorePages) {
	// 			// Get tokens for current page
	// 			const { tokens, maxPage } = await this.tokenRepository.findAllByPage(
	// 				currentPage,
	// 				PAGE_SIZE
	// 			)
	// 			console.log(
	// 				`Processing page ${currentPage}/${maxPage} with ${tokens.length} tokens`
	// 			)
	//
	// 			for (const token of tokens) {
	// 				console.log(`Processing token: ${token.address}`)
	// 				await this.collectFeesForToken(new PublicKey(token.address))
	// 				console.log(`Done Processing token: ${token.address}`)
	// 			}
	//
	// 			// Check if we've processed all pages
	// 			hasMorePages = currentPage < maxPage
	// 			console.log("hasMorePages", hasMorePages)
	// 			currentPage++
	// 		}
	// 	} catch (error) {
	// 		console.error("Error in collectFeesFromAllMints:", error)
	// 	}
	// }
	//
	// async collectFeesForToken(mint: PublicKey) {
	// 	let page = 1
	// 	const pageSize = 100 // Process 10 user at a time
	//
	// 	const destinationTokenAccount = getAssociatedTokenAddressSync(
	// 		mint,
	// 		this.payer.publicKey,
	// 		undefined,
	// 		TOKEN_2022_PROGRAM_ID,
	// 		ASSOCIATED_TOKEN_PROGRAM_ID
	// 	)
	//
	// 	while (true) {
	// 		try {
	// 			const holders = await this.indexer.getTokenHoldersByPage(
	// 				mint.toBase58(),
	// 				page,
	// 				pageSize
	// 			)
	// 			if (!holders) break
	//
	// 			if (holders.length === 0) break
	//
	// 			const txSig = await withdrawWithheldTokensFromAccounts(
	// 				this.connection,
	// 				this.payer,
	// 				mint,
	// 				destinationTokenAccount,
	// 				this.payer,
	// 				[],
	// 				holders.map(account => new PublicKey(account)),
	// 				{
	// 					commitment: "confirmed"
	// 				},
	// 				TOKEN_2022_PROGRAM_ID
	// 			)
	// 			console.log("txSign collect fee", txSig)
	// 			page++
	// 		} catch (error) {
	// 			console.log("err when collect fee:", error)
	// 			break
	// 		}
	// 	}
	// }
	//
	@Cron(CronExpression.EVERY_5_MINUTES)
	async updatePriceChange() {
		const rawSql = `WITH
											latest AS (
												SELECT DISTINCT ON (token_address)
											token_address,
											new_price    AS price_now
										FROM token_transaction
										ORDER BY token_address, date DESC
											),
											price_1h AS (
										SELECT DISTINCT ON (token_address)
											token_address,
											new_price    AS price_1h
										FROM token_transaction
										WHERE date >= now() - interval '1 hour'
										ORDER BY token_address, date ASC
											),
											price_24h AS (
										SELECT DISTINCT ON (token_address)
											token_address,
											new_price    AS price_24h
										FROM token_transaction
										WHERE date >= now() - interval '24 hours'
										ORDER BY token_address, date ASC
											),
											price_7d AS (
										SELECT DISTINCT ON (token_address)
											token_address,
											new_price    AS price_7d
										FROM token_transaction
										WHERE date >= now() - interval '7 days'
										ORDER BY token_address, date ASC
											),
											computed AS (
										SELECT
											l.token_address,
											COALESCE((l.price_now - p1.price_1h) / NULLIF(p1.price_1h,0) * 100, 0) AS change_1h,
											COALESCE((l.price_now - p24.price_24h) / NULLIF(p24.price_24h,0) * 100, 0) AS change_24h,
											COALESCE((l.price_now - p7.price_7d) / NULLIF(p7.price_7d,0) * 100, 0) AS change_7d
										FROM latest l
											LEFT JOIN price_1h   p1  ON p1.token_address  = l.token_address
											LEFT JOIN price_24h  p24 ON p24.token_address = l.token_address
											LEFT JOIN price_7d   p7  ON p7.token_address  = l.token_address
											)
		UPDATE token t
		SET
			"1h_change"  = c.change_1h,
			"24h_change" = c.change_24h,
			"7d_change"  = c.change_7d,
			updated_at   = now()
			FROM computed c
		WHERE t.address = c.token_address;`
		console.log("Starting updatePriceChange at", new Date())
		try {
			await this.prisma.$executeRawUnsafe(rawSql)
			console.log("Finished updatePriceChange at", new Date())
		} catch (error) {
			console.error("Error in updatePriceChange:", error)
		}
	}
}
