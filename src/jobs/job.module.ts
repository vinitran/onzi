import { Module } from "@nestjs/common"
import { ScheduleModule } from "@nestjs/schedule"
import { DatabaseModule } from "@root/_database/database.module"
import { EnvModule } from "@root/_env/env.module"
import { TokenJobs } from "./tokens/token.job"

@Module({
	imports: [EnvModule, ScheduleModule.forRoot(), DatabaseModule],
	providers: [TokenJobs]
})
export class JobsModule {}
