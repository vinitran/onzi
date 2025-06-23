import { Module } from "@nestjs/common"
import { DatabaseModule } from "@root/_database/database.module"
import { EnvModule } from "@root/_env/env.module"
import { RedisModule } from "@root/_redis/redis.module"
import { HeliusService } from "@root/onchain/helius.service"

@Module({
	imports: [EnvModule, RedisModule, DatabaseModule],
	controllers: [],
	providers: [HeliusService],
	exports: [HeliusService]
})
export class OnchainModule {}
