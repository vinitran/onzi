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
	REPLY_COMMENT_GATEWAY_EMIT_EVENTS,
	REPLY_COMMENT_GATEWAY_LISTEN_EVENTS
} from "@root/_shared/constants/comment"
import { ICreateCommentResponse } from "@root/_shared/types/comment"
import { AuthWebSocketService } from "@root/socket/auth-ws.service"
import { Server, Socket } from "socket.io"

@WebSocketGateway({
	cors: { origin: "*" },
	namespace: /\/comment-reply-.+/
})
export class ReplyCommentGateway
	implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
	private readonly logger = new Logger("comment-reply")

	constructor(private readonly authWsService: AuthWebSocketService) {}

	afterInit(_server: Server) {
		console.log("Socket instance of comment-reply started")
	}

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

	//   User send comment in detail token screen
	@SubscribeMessage(REPLY_COMMENT_GATEWAY_LISTEN_EVENTS.SEND)
	handleSendComment(
		@MessageBody() data: ICreateCommentResponse["comment"],
		@ConnectedSocket() client: Socket
	) {
		// Emit comment to all users in the same namespace (post)
		client.broadcast.emit(REPLY_COMMENT_GATEWAY_EMIT_EVENTS.RECEIVE, {
			...data,
			totalLike: 0,
			totalReply: 0,
			isLiked: false
		})
	}
}
