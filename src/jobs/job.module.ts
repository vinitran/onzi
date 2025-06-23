import { Module } from "@nestjs/common"
import { ScheduleModule } from "@nestjs/schedule"
import { DatabaseModule } from "@root/_database/database.module"
import { EnvModule } from "@root/_env/env.module"
import { RedisModule } from "@root/_redis/redis.module"
import { IndexerController } from "@root/indexer/indexer.controller"
import { IndexerModule } from "@root/indexer/indexer.module"
import { IndexerService } from "@root/indexer/indexer.service"
import { ScannerJobs } from "@root/jobs/scanner/scanner.job"
import { BurnTokenController } from "@root/jobs/tokens/distribution/burn-token.controller"
import { CollectFeeController } from "@root/jobs/tokens/distribution/collect-fee.controller"
import { DistributeSolController } from "@root/jobs/tokens/distribution/distribute-sol.controller"
import { ExecuteDistributionController } from "@root/jobs/tokens/distribution/execute-distribution.controller"
import { JackpotController } from "@root/jobs/tokens/distribution/jackpot.controller"
import { SwapController } from "@root/jobs/tokens/distribution/swap.controller"
import { Ponz } from "@root/programs/ponz/program"
import { ProgramsModule } from "@root/programs/programs.module"
import { Raydium } from "@root/programs/raydium/program"
import { PonzVault } from "@root/programs/vault/program"
import { TokenJobs } from "./tokens/token.job"

@Module({
	imports: [
		EnvModule,
		RedisModule,
		ProgramsModule.register(Ponz, Raydium, PonzVault),
		ScheduleModule.forRoot(),
		DatabaseModule,
		IndexerModule
	],
	controllers: [
		IndexerController,
		CollectFeeController,
		SwapController,
		BurnTokenController,
		DistributeSolController,
		ExecuteDistributionController,
		JackpotController
	],

	providers: [IndexerService, TokenJobs, ScannerJobs]
})
export class JobsModule {}
