import { Module } from "@nestjs/common"
import { S3Service } from "@root/file/file.service"
import { AuthWebSocketService } from "@root/socket/auth-ws.service"
import { TokeGateway } from "./token.gateway"
import { TokensController } from "./tokens.controller"
import { TokensService } from "./tokens.service"

@Module({
	controllers: [TokensController],
	providers: [TokensService, S3Service, TokeGateway, AuthWebSocketService]
})
export class TokensModule {}
