import {
	RedisModule as IoRedis,
	RedisModuleOptions
} from "@nestjs-modules/ioredis"
import { Global, Module } from "@nestjs/common"
import { ENV_TOKEN, Env, EnvModule } from "@root/_env/env.module"
import { RedisService } from "@root/_redis/redis.service"

@Global()
@Module({
	imports: [
		IoRedis.forRootAsync({
			imports: [EnvModule],
			inject: [ENV_TOKEN],
			useFactory: (env: Env): RedisModuleOptions => {
				return {
					type: "single",
					url: env.REDIS_URL || "http//localhost:6379"
				}
			}
		})
	],
	providers: [RedisService],
	exports: [RedisService]
})
export class RedisModule {}
