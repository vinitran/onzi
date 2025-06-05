import { Injectable, Logger } from "@nestjs/common"
import { Cron, CronExpression } from "@nestjs/schedule"
import { PrismaClient } from "@prisma/client"
import { TokenRepository } from "@root/_database/repositories/token.repository"
import { Env, InjectEnv } from "@root/_env/env.module"
import { RabbitMQService } from "@root/_rabbitmq/rabbitmq.service"
import { keypairFromPrivateKey } from "@root/_shared/helpers/encode-decode-tx"
import { IndexerService } from "@root/indexer/indexer.service"
import { Connection, Keypair } from "@solana/web3.js"

export const REWARD_DISTRIBUTOR_EVENTS = {
	Token: "reward-distributor.token"
} as const

@Injectable()
export class TokenJobs {
	private connection: Connection
	private systemWallet: Keypair
	private prisma = new PrismaClient()
	private HELIUS_RPC =
		this.env.IS_TEST === "true"
			? `https://devnet.helius-rpc.com/?api-key=${this.env.HELIUS_API_KEY}`
			: `https://mainnet.helius-rpc.com/?api-key=${this.env.HELIUS_API_KEY}`
	constructor(
		private readonly tokenRepository: TokenRepository,
		private indexer: IndexerService,
		@InjectEnv() private env: Env,
		private readonly rabbitMQService: RabbitMQService
	) {
		this.connection = new Connection(this.HELIUS_RPC)
		this.systemWallet = keypairFromPrivateKey(
			this.env.SYSTEM_WALLET_PRIVATE_KEY
		)
	}

	@Cron(CronExpression.EVERY_MINUTE)
	async collectFeesFromAllMints() {
		const tokens = await this.tokenRepository.getAllTokenAddress()

		for (const token of tokens) {
			await this.rabbitMQService.emit(
				"reward-distributor",
				"reward-distributor.token",
				token
			)
		}
	}

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
		Logger.log("Starting updatePriceChange at", new Date())
		try {
			await this.prisma.$executeRawUnsafe(rawSql)
			Logger.log("Finished updatePriceChange at", new Date())
		} catch (error) {
			Logger.error("Error in updatePriceChange:", error)
		}
	}
}
