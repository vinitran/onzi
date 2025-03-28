import { RedisModule } from "@nestjs-modules/ioredis"
import { Module } from "@nestjs/common"
import { JwtModule } from "@nestjs/jwt"
import { DatabaseModule } from "@root/_database/database.module"
import { EnvModule } from "@root/_env/env.module"
import { AppController } from "@root/app.controller"
import { AppService } from "@root/app.service"
import { AuthModule } from "@root/auth/auth.module"
import { FileModule } from "@root/file/file.module"
import { IndexerModule } from "@root/indexer/indexer.module"
import { UsersModule } from "@root/users/users.module"
import { CommentModule } from "./comments/comment.module"
import { TokensModule } from "./tokens/tokens.module"

@Module({
	imports: [
		DatabaseModule,
		EnvModule,
		AuthModule,
		UsersModule,
		CommentModule,
		TokensModule,
		JwtModule.register({
			global: true
		}),
		FileModule,
		RedisModule.forRoot({
			type: "single"
		}),
		IndexerModule
	],
	controllers: [AppController],
	providers: [AppService]
})
export class AppModule {}
