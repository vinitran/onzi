import { RedisModule } from "@nestjs-modules/ioredis"
import { Module } from "@nestjs/common"
import { DatabaseModule } from "@root/_database/database.module"
import { EnvModule } from "@root/_env/env.module"
import { AppController } from "@root/app.controller"
import { AppService } from "@root/app.service"
import { AuthModule } from "@root/auth/auth.module"
import { UsersModule } from "@root/users/users.module"

@Module({
	imports: [
		DatabaseModule,
		EnvModule,
		AuthModule,
		UsersModule,
		RedisModule.forRoot({
			type: "single"
		})
	],
	controllers: [AppController],
	providers: [AppService]
})
export class AppModule {}
