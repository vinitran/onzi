import { Module } from "@nestjs/common"
import { AuthWebSocketService } from "./auth-ws.service"

@Module({
	providers: [AuthWebSocketService],
	exports: [AuthWebSocketService]
})
export class SocketModule {}
