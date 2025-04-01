import { BN } from "@coral-xyz/anchor"
import { Injectable } from "@nestjs/common"
import { Network } from "@prisma/client"
import { Server } from "socket.io"

export type NewTransactionPayload = {
	low: number
	high: number
	open: number
	close: number
	volume: string
	date: number | string
	address: string
	network: Network
}

@Injectable()
export class SocketService {
	// @WebSocketServer()
	private serverInstance: Server

	setSocket(server: Server) {
		this.serverInstance = server
		console.log("Socket server instance set!")
	}

	getServer() {
		return this.serverInstance
	}

	emitNewTransaction(data: NewTransactionPayload) {
		if (this.serverInstance) {
			this.serverInstance.emit(`new-transaction-${data.address}`, data)
		}
	}

	// biome-ignore lint/suspicious/noExplicitAny: <it's ok>
	emitNewTokenDetail(mint: string, data: any) {
		if (this.serverInstance) {
			this.serverInstance.emit(`token-update-${mint}`, data)
		}
	}

	emitNewTransactionCause({
		address,
		mint,
		lamports,
		network,
		tokenName
	}: {
		address: string
		mint: string
		lamports: BN | bigint
		network: Network
		tokenName?: string
	}) {
		if (this.serverInstance) {
			this.serverInstance.emit("new-transaction", {
				address,
				mint,
				lamports: lamports.toString(),
				network,
				tokenName
			})
		}
	}

	// biome-ignore lint/suspicious/noExplicitAny: <it's ok>
	emitNewTokenCreation(data: any) {
		if (this.serverInstance) {
			this.serverInstance.emit("new-token", data)
		}
	}
}
