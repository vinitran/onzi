import { Module } from "@nestjs/common"
import { JwtModule } from "@nestjs/jwt"
import { AuthWebSocketService } from "./auth-ws.service"

@Module({
	imports: [JwtModule],
	providers: [AuthWebSocketService],
	exports: [AuthWebSocketService]
})
export class SocketModule {}
