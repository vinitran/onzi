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
	SICKO_MODE_TOKEN_EMIT_EVENTS,
	TOKEN_GATEWAY_EMIT_EVENTS,
	TOKEN_GATEWAY_LISTEN_EVENTS
} from "@root/_shared/constants/token"
import { TX_GATEWAY_EMIT_EVENTS } from "@root/_shared/constants/transaction"
import { ICreateTokenResponse } from "@root/_shared/types/token"
import { TokenTransaction } from "@root/dtos/token-transaction.dto"
import { CandleDto } from "@root/indexer/dtos/chart.dto"
import { AuthWebSocketService } from "@root/socket/auth-ws.service"
import { Server, Socket } from "socket.io"
import { SickoModeResponse } from "./dtos/response.dto"
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

@WebSocketGateway({
	cors: { origin: "*" },
	namespace: "/chart"
})
export class ChartGateway
	implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
	private readonly logger = new Logger("chart")
	private serverInstance: Server

	afterInit(server: Server) {
		this.serverInstance = server
	}

	async handleConnection(@ConnectedSocket() client: Socket) {
		this.logger.log(`Client connected to chart: ${client.id}`)

		client.on("subscribe", ({ tokenId, step }) => {
			const room = `chart:${tokenId}:${step}`
			client.join(room)
			this.logger.log(`Client ${client.id} subscribed to ${room}`)
		})
	}

	handleDisconnect(client: Socket) {
		this.logger.log(`Client disconnected from chart: ${client.id}`)
	}

	public emitNewCandle(candle: CandleDto) {
		const room = `chart:${candle.tokenId}:${candle.step}`
		this.serverInstance.to(room).emit("candle:update", candle)
	}
}

@WebSocketGateway({
	cors: { origin: "*" },
	namespace: "/transaction"
})
export class TransactionGateway
	implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
	private readonly logger = new Logger("transaction")
	private serverInstance: Server

	afterInit(server: Server) {
		this.serverInstance = server
	}

	async handleConnection(@ConnectedSocket() client: Socket) {
		try {
			client.on("subscribe", tokenId => {
				const room = `transaction:${tokenId}`
				client.join(room)
				this.logger.log(`Client ${client.id} subscribed to ${room}`)
			})
		} catch {
			client.disconnect()
		}
	}

	handleDisconnect(client: Socket) {
		this.logger.log(
			`Client disconnected: ${client.nsp.name} - ID: ${client.id}`
		)
	}

	handleTx(data: TokenTransaction) {
		const room = `transaction:${data.token?.id}`
		this.serverInstance.to(room).emit(TX_GATEWAY_EMIT_EVENTS.NEW_TX, data)
	}
}

@WebSocketGateway({
	cors: { origin: "*" },
	namespace: "/sicko-mode-token"
})
export class TokenSickoModeGateway
	implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
	private readonly logger = new Logger("token-sicko-mode")
	private serverInstance: Server

	afterInit(server: Server) {
		this.serverInstance = server
	}

	async handleConnection(@ConnectedSocket() client: Socket) {
		try {
			this.logger.log(`Client connected: ${client.nsp.name} - ID: ${client.id}`)
		} catch {
			client.disconnect()
		}
	}

	handleDisconnect(client: Socket) {
		this.logger.log(
			`Client disconnected: ${client.nsp.name} - ID: ${client.id}`
		)
	}

	emitNewSickoModeToken(data: SickoModeResponse) {
		this.serverInstance.emit(SICKO_MODE_TOKEN_EMIT_EVENTS.NEW_TOKEN, data)
	}

	emitUpdateSickoModeToken(data: SickoModeResponse) {
		this.serverInstance.emit(SICKO_MODE_TOKEN_EMIT_EVENTS.UPDATE_TOKEN, data)
	}
}
