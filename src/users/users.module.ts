import { Module } from "@nestjs/common"
import { JwtService } from "@nestjs/jwt"
import { DatabaseModule } from "@root/_database/database.module"
import { EnvModule } from "@root/_env/env.module"
import { AuthService } from "@root/auth/auth.service"
import { FileModule } from "@root/file/file.module"
import { S3Service } from "@root/file/file.service"
import { IndexerModule } from "@root/indexer/indexer.module"
import { UsersController } from "@root/users/users.controller"
import { UsersService } from "@root/users/users.service"

@Module({
	imports: [EnvModule, DatabaseModule, FileModule, IndexerModule],
	controllers: [UsersController],
	providers: [UsersService, AuthService, JwtService, S3Service],
	exports: [UsersService]
})
export class UsersModule {}
