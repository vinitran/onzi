import { Injectable, OnModuleInit } from "@nestjs/common"
import { Cron, CronExpression } from "@nestjs/schedule"
import { IndexerService } from "@root/indexer/indexer.service"

@Injectable()
export class ScannerJobs implements OnModuleInit {
	constructor(private readonly indexer: IndexerService) {}

	async onModuleInit() {
		this.indexer.connectToWebSocketSolana()
	}

	@Cron(CronExpression.EVERY_MINUTE)
	async run() {
		await this.indexer.scannerSolana()
	}
}
