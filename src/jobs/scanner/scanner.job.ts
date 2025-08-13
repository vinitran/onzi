import { Injectable, Logger, OnModuleInit } from "@nestjs/common"
import { Cron, CronExpression } from "@nestjs/schedule"
import { TokenRepository } from "@root/_database/repositories/token.repository"
import { RabbitMQService } from "@root/_rabbitmq/rabbitmq.service"
import { IndexerService } from "@root/indexer/indexer.service"
import {
	UNLOCK_TOKEN_EVENTS,
	UnlockTokenEventPayload
} from "@root/jobs/scanner/unlock-token.controller"
import {
	UPDATE_BALANCE_EVENTS,
	UpdateBalancePayload
} from "@root/jobs/scanner/update-balance.controller"

@Injectable()
export class ScannerJobs implements OnModuleInit {
	constructor(
		private readonly indexer: IndexerService,
		private readonly tokenRepository: TokenRepository,
		private readonly rabbitMQService: RabbitMQService
	) {}

	async onModuleInit() {
		this.indexer.connectToWebSocketSolana()
	}

	@Cron(CronExpression.EVERY_MINUTE)
	async scannerPonz() {
		Logger.log("starting scan ponz", "scanner")
		await this.indexer.scannerPonz()
		Logger.log("ending scan ponz", "scanner")
	}

	// @Cron(CronExpression.EVERY_MINUTE)
	// async scannerRaydium() {
	// 	Logger.log("starting scan raydium", "scanner")
	// 	await this.indexer.scannerRaydium()
	// 	Logger.log("ending scan raydium", "scanner")
	// }

	@Cron(CronExpression.EVERY_MINUTE)
	async updateTokenOwner() {
		const tokens = await this.tokenRepository.getAllTokenAddress()
		for (const token of tokens) {
			const data: UpdateBalancePayload = {
				address: token.address
			}

			await this.rabbitMQService.emit(
				"scanner",
				UPDATE_BALANCE_EVENTS.UPDATE,
				data
			)
		}
	}

	@Cron(CronExpression.EVERY_5_MINUTES)
	async unlockToken() {
		const tokens = await this.tokenRepository.getAllTokenAddressForUnlock()

		const unlockedTokens = tokens.filter(
			token =>
				token.lockAmount !== null &&
				token.unlockAt !== null &&
				token.unlockAt <= new Date()
		)

		for (const token of unlockedTokens) {
			const data: UnlockTokenEventPayload = {
				address: token.address,
				creatorAddress: token.creatorAddress
			}

			await this.rabbitMQService.emit(
				"scanner",
				UNLOCK_TOKEN_EVENTS.UNLOCK,
				data
			)
		}
	}
}
