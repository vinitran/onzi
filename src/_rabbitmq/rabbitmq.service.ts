import { Inject, Injectable } from "@nestjs/common"
import { ClientProxy } from "@nestjs/microservices"
import { firstValueFrom } from "rxjs"

type RabbitMQServiceType = "blockchain" | "socket"

@Injectable()
export class RabbitMQService {
	constructor(
		@Inject("BLOCKCHAIN_RABBITMQ_SERVICE")
		private readonly blockchainClient: ClientProxy,
		@Inject("SOCKET_RABBITMQ_SERVICE")
		private readonly socketClient: ClientProxy
	) {}

	/**
	 * Emit an event to RabbitMQ
	 * @param type
	 * @param pattern - The event pattern to emit
	 * @param data - The data to send
	 */
	async emit<T>(
		type: RabbitMQServiceType,
		pattern: string,
		data: T
	): Promise<void> {
		const client =
			type === "blockchain" ? this.blockchainClient : this.socketClient
		await firstValueFrom(client.emit(pattern, data))
	}

	/**
	 * Send a message and wait for a response
	 * @param type - The service type to send the message to
	 * @param pattern - The message pattern
	 * @param data - The data to send
	 * @returns The response from the consumer
	 */
	async send<TRequest, TResponse>(
		type: RabbitMQServiceType,
		pattern: string,
		data: TRequest
	): Promise<TResponse> {
		const client =
			type === "blockchain" ? this.blockchainClient : this.socketClient
		return await firstValueFrom(client.send<TResponse>(pattern, data))
	}
}
