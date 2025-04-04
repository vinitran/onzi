import { Module } from "@nestjs/common"
import { ScheduleModule } from "@nestjs/schedule"
import { DatabaseModule } from "@root/_database/database.module"
import { EnvModule } from "@root/_env/env.module"
import { RedisModule } from "@root/_redis/redis.module"
import { IndexerService } from "@root/indexer/indexer.service"
import { TokenJobs } from "./tokens/token.job"

@Module({
	imports: [
		EnvModule,
		RedisModule,
		ScheduleModule.forRoot(),
		DatabaseModule,
		RedisModule
	],
	providers: [TokenJobs, IndexerService]
})
export class JobsModule {}
