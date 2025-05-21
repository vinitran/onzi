import { Logger } from "@nestjs/common"
import {
	ConnectedSocket,
	MessageBody,
	OnGatewayConnection,
	OnGatewayDisconnect,
	OnGatewayInit,
	SubscribeMessage,
	WebSocketGateway
} from "@nestjs/websockets"
import {
	TOKEN_GATEWAY_EMIT_EVENTS,
	TOKEN_GATEWAY_LISTEN_EVENTS
} from "@root/_shared/constants/token"
import { ICreateTokenResponse } from "@root/_shared/types/token"
import { AuthWebSocketService } from "@root/socket/auth-ws.service"
import { Server, Socket } from "socket.io"
@WebSocketGateway({
	cors: { origin: "*" },
	namespace: "token"
})
export class TokeGateway
	implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
	private readonly logger = new Logger("token")
	constructor(private readonly authWsService: AuthWebSocketService) {}
	afterInit(_server: Server) {}

	async handleConnection(@ConnectedSocket() client: Socket) {
		try {
			const user = await this.authWsService.authenticate(client)
			client.data.user = user // Attach user data to the socket

			this.logger.log(
				`Client connected: ${client.nsp.name} - ID: ${client.id}, User: ${user.id}`
			)
		} catch {
			client.disconnect()
		}
	}

	handleDisconnect(client: Socket) {
		this.logger.log(
			`Client disconnected: ${client.nsp.name} - ID: ${client.id}`
		)
	}

	@SubscribeMessage(TOKEN_GATEWAY_LISTEN_EVENTS.CREATE)
	handleCreateToken(
		@ConnectedSocket() client: Socket,
		@MessageBody() data: ICreateTokenResponse["token"]
	) {
		client.broadcast.emit(TOKEN_GATEWAY_EMIT_EVENTS.RECEIVE, data)
	}
}
