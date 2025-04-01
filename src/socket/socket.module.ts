import { Module } from "@nestjs/common"
import { SocketService } from "@root/socket/socket.service"
import { AuthWebSocketService } from "./auth-ws.service"

@Module({
	providers: [AuthWebSocketService, SocketService],
	exports: [AuthWebSocketService, SocketService]
})
export class SocketModule {}
