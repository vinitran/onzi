import { Module } from "@nestjs/common"
import { S3Service } from "@root/file/file.service"
import { Ponz } from "@root/programs/ponz/program"
import { ProgramsModule } from "@root/programs/programs.module"
import { AuthWebSocketService } from "@root/socket/auth-ws.service"
import { TokeGateway } from "./token.gateway"
import { TokensController } from "./tokens.controller"
import { TokensService } from "./tokens.service"

@Module({
	imports: [ProgramsModule.register(Ponz)],
	controllers: [TokensController],
	providers: [TokensService, S3Service, TokeGateway, AuthWebSocketService]
})
export class TokensModule {}
