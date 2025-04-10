import { Logger } from "@nestjs/common"
import {
	ConnectedSocket,
	OnGatewayConnection,
	OnGatewayDisconnect,
	OnGatewayInit,
	WebSocketGateway
} from "@nestjs/websockets"
import { TX_GATEWAY_EMIT_EVENTS } from "@root/_shared/constants/transaction"
import {
	TokenCreationDto,
	TransactionDto
} from "@root/indexer/dtos/transaction.dto"
import { Server, Socket } from "socket.io"

@WebSocketGateway({
	cors: { origin: "*" },
	namespace: "/transaction"
})
export class IndexerGateway
	implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
	private readonly logger = new Logger("transaction")
	private serverInstance: Server

	afterInit(server: Server) {
		this.serverInstance = server
		console.log("Socket instance of indexer started", server.sockets)
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

	handleBuyTx(data: TransactionDto) {
		this.serverInstance.emit(TX_GATEWAY_EMIT_EVENTS.BUY, data)
	}

	handleSellTx(data: TransactionDto) {
		this.serverInstance.emit(TX_GATEWAY_EMIT_EVENTS.SELL, data)
	}

	handleTokenCreation(data: TokenCreationDto) {
		this.serverInstance.emit(TX_GATEWAY_EMIT_EVENTS.SELL, data)
	}
}
