import { Module } from "@nestjs/common"
import { JwtModule } from "@nestjs/jwt"
import { SocketService } from "@root/socket/socket.service"
import { AuthWebSocketService } from "./auth-ws.service"

@Module({
	imports: [JwtModule],
	providers: [AuthWebSocketService, SocketService],
	exports: [AuthWebSocketService, SocketService]
})
export class SocketModule {}
