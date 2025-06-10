import { Module } from "@nestjs/common"
import { ScheduleModule } from "@nestjs/schedule"
import { DatabaseModule } from "@root/_database/database.module"
import { EnvModule } from "@root/_env/env.module"
import { RedisModule } from "@root/_redis/redis.module"
import { IndexerController } from "@root/indexer/indexer.controller"
import { IndexerModule } from "@root/indexer/indexer.module"
import { IndexerService } from "@root/indexer/indexer.service"
import { ScannerJobs } from "@root/jobs/scanner/scanner.job"
import { DistributorController } from "@root/jobs/tokens/distribute.controller"
import { TokenJobsController } from "@root/jobs/tokens/token.controller"
import { Ponz } from "@root/programs/ponz/program"
import { ProgramsModule } from "@root/programs/programs.module"
import { Raydium } from "@root/programs/raydium/program"
import { TokenJobs } from "./tokens/token.job"

@Module({
	imports: [
		EnvModule,
		RedisModule,
		ProgramsModule.register(Ponz, Raydium),
		ScheduleModule.forRoot(),
		DatabaseModule,
		IndexerModule
	],
	controllers: [IndexerController, TokenJobsController, DistributorController],

	providers: [IndexerService, TokenJobs, ScannerJobs]
})
export class JobsModule {}
