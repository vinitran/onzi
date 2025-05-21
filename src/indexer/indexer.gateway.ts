import { Logger } from "@nestjs/common"
import {
	ConnectedSocket,
	OnGatewayConnection,
	OnGatewayDisconnect,
	OnGatewayInit,
	WebSocketGateway
} from "@nestjs/websockets"
import { TX_GATEWAY_EMIT_EVENTS } from "@root/_shared/constants/transaction"
import { TokenTransaction } from "@root/dtos/token-transaction.dto"
import { CandleDto } from "@root/indexer/dtos/chart.dto"
import { TokenCreationDto } from "@root/indexer/dtos/transaction.dto"
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
		this.logger.log("Socket instance of indexer started")
	}

	async handleConnection(@ConnectedSocket() client: Socket) {
		try {
			client.on("subscribe", tokenId => {
				const room = `transaction:${tokenId}`
				client.join(room)
				this.logger.log(`Client ${client.id} subscribed to ${room}`)
			})
		} catch (error) {
			this.logger.error(`Error in handleConnection: ${error}`)
			client.disconnect()
		}
	}

	handleDisconnect(client: Socket) {
		this.logger.log(
			`Client disconnected: ${client.nsp.name} - ID: ${client.id}`
		)
	}

	handleTx(data: TokenTransaction) {
		try {
			if (!this.serverInstance) {
				this.logger.error("Server instance not initialized")
				return
			}
			if (!data.token) {
				this.logger.warn("Transaction data missing token information")
				return
			}
			const room = `transaction:${data.token.id}`
			this.serverInstance.to(room).emit(TX_GATEWAY_EMIT_EVENTS.NEW_TX, data)
		} catch (error) {
			this.logger.error(`Error in handleTx: ${error}`)
		}
	}

	handleTokenCreation(data: TokenCreationDto) {
		try {
			if (!this.serverInstance) {
				this.logger.error("Server instance not initialized")
				return
			}
			const room = `transaction:${data.address}`
			this.serverInstance
				.to(room)
				.emit(TX_GATEWAY_EMIT_EVENTS.CREATE_TOKEN, data)
		} catch (error) {
			this.logger.error(`Error in handleTokenCreation: ${error}`)
		}
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
