import { Module } from "@nestjs/common"
import { S3Service } from "@root/file/file.service"
import { TokensController } from "./tokens.controller"
import { TokensService } from "./tokens.service"

@Module({
	controllers: [TokensController],
	providers: [TokensService, S3Service]
})
export class TokensModule {}
