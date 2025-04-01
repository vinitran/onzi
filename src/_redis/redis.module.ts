import { Global, Module } from "@nestjs/common"
import { RedisService } from "./redis.service" // Tạo một service để quản lý kết nối Redis
import { Env, ENV_TOKEN, EnvModule } from "@root/_env/env.module"
import {
	RedisModule as IoRedis,
	RedisModuleOptions
} from "@nestjs-modules/ioredis" // Tạo repository để thao tác với Redis

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
