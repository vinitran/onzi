import { Injectable, Logger } from "@nestjs/common"
import { Cron, CronExpression } from "@nestjs/schedule"
import { PrismaClient, RaydiumStatusType } from "@prisma/client"
import { TokenRepository } from "@root/_database/repositories/token.repository"
import { Env, InjectEnv } from "@root/_env/env.module"
import { RabbitMQService } from "@root/_rabbitmq/rabbitmq.service"
import { SwapMessageType } from "@root/jobs/tokens/token.controller"

export const REWARD_DISTRIBUTOR_EVENTS = {
	COLLECT_FEE: "reward-distributor.collect-fee",
	SWAP_FEE_TO_SOL: "reward-distributor.swap-fee-to-sol",
	BURN_FEE: "reward-distributor.burn-fee",
	PREPARE_REWARD_DISTRIBUTION: "reward-distributor.prepare-reward-distribution",
	PREPARE_JACKPOT_DISTRIBUTION:
		"reward-distributor.prepare-jackpot-distribution",
	UPDATE_JACKPOT_AFTER_SWAP: "reward-distributor.update-jackpot-after-swap",
	EXECUTE_DISTRIBUTION: "reward-distributor.execute-distribution"
} as const

@Injectable()
export class TokenJobs {
	private prisma = new PrismaClient()

	constructor(
		private readonly tokenRepository: TokenRepository,
		@InjectEnv() private env: Env,
		private readonly rabbitMQService: RabbitMQService
	) {}

	@Cron(CronExpression.EVERY_MINUTE)
	async collectFeesFromAllMints() {
		const tokens = await this.tokenRepository.getAllTokenAddress()

		for (const token of tokens) {
			const data: SwapMessageType = {
				id: token.id,
				address: token.address,
				type:
					token.raydiumStatus === RaydiumStatusType.Listed ? "raydium" : "ponz"
			}

			await this.rabbitMQService.emit(
				"collect-fee-reward-distributor",
				REWARD_DISTRIBUTOR_EVENTS.COLLECT_FEE,
				data
			)
		}
	}

	@Cron(CronExpression.EVERY_MINUTE)
	async sendJackpot() {
		const tokens = await this.tokenRepository.getTokenWithJackpot()

		for (const token of tokens) {
			await this.rabbitMQService.emit(
				"distribute-reward-distributor",
				REWARD_DISTRIBUTOR_EVENTS.PREPARE_JACKPOT_DISTRIBUTION,
				{
					id: token.id,
					address: token.address,
					amount: token.jackpotAmount.toString(),
					times: token.jackpotQueue
				}
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
