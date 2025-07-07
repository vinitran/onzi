import {
	Inject,
	Injectable,
	Logger,
	OnApplicationShutdown
} from "@nestjs/common"
import { ClientProxy } from "@nestjs/microservices"
import { firstValueFrom } from "rxjs"

export type RabbitMQServiceType =
	| "blockchain"
	| "raydium"
	| "socket"
	| "collect-fee-reward-distributor"
	| "swap-to-sol-reward-distributor"
	| "distribute-reward-distributor"

@Injectable()
export class RabbitMQService implements OnApplicationShutdown {
	constructor(
		@Inject("BLOCKCHAIN_RABBITMQ_SERVICE")
		private readonly blockchainClient: ClientProxy,

		@Inject("RAYDIUM_RABBITMQ_SERVICE")
		private readonly raydiumClient: ClientProxy,

		@Inject("SOCKET_RABBITMQ_SERVICE")
		private readonly socketClient: ClientProxy,

		@Inject("COLLECT_FEE_REWARD_DISTRIBUTOR_RABBITMQ_SERVICE")
		private readonly collectFeeRewardDistributorClient: ClientProxy,

		@Inject("SWAP_TO_SOL_REWARD_DISTRIBUTOR_RABBITMQ_SERVICE")
		private readonly swapToSolRewardDistributorClient: ClientProxy,

		@Inject("DISTRIBUTE_REWARD_DISTRIBUTOR_RABBITMQ_SERVICE")
		private readonly distributeRewardDistributorClient: ClientProxy
	) {}

	/**
	 * Get the appropriate client based on service type
	 * @param type - The service type
	 * @returns The corresponding RabbitMQ client
	 */
	private getClientByType(type: RabbitMQServiceType): ClientProxy {
		switch (type) {
			case "blockchain":
				return this.blockchainClient
			case "raydium":
				return this.raydiumClient
			case "socket":
				return this.socketClient
			case "collect-fee-reward-distributor":
				return this.collectFeeRewardDistributorClient
			case "swap-to-sol-reward-distributor":
				return this.swapToSolRewardDistributorClient
			case "distribute-reward-distributor":
				return this.distributeRewardDistributorClient
			default:
				throw new Error(`Unknown RabbitMQ service type: ${type}`)
		}
	}

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
		const client = this.getClientByType(type)
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
		const client = this.getClientByType(type)
		return await firstValueFrom(client.send<TResponse>(pattern, data))
	}

	async onApplicationShutdown(signal: string) {
		Logger.log(signal)
		const clients = [
			this.blockchainClient,
			this.raydiumClient,
			this.socketClient,
			this.collectFeeRewardDistributorClient,
			this.swapToSolRewardDistributorClient,
			this.distributeRewardDistributorClient
		]

		for (const client of clients) {
			await client.close() // Gracefully close each client
		}
	}
}
