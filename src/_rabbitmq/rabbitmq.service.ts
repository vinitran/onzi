import { Inject, Injectable } from "@nestjs/common"
import { ClientProxy } from "@nestjs/microservices"
import { firstValueFrom } from "rxjs"

@Injectable()
export class RabbitMQService {
	constructor(
		@Inject("RABBITMQ_SERVICE") private readonly rabbitMQClient: ClientProxy
	) {}

	/**
	 * Emit an event to RabbitMQ
	 * @param pattern - The event pattern to emit
	 * @param data - The data to send
	 */
	async emit<T>(pattern: string, data: T): Promise<void> {
		await firstValueFrom(this.rabbitMQClient.emit(pattern, data))
	}

	/**
	 * Send a message and wait for a response
	 * @param pattern - The message pattern
	 * @param data - The data to send
	 * @returns The response from the consumer
	 */
	async send<TRequest, TResponse>(
		pattern: string,
		data: TRequest
	): Promise<TResponse> {
		return await firstValueFrom(
			this.rabbitMQClient.send<TResponse>(pattern, data)
		)
	}
}
