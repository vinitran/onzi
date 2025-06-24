import { Global, Module } from "@nestjs/common"
import { ClientsModule } from "@nestjs/microservices"
import { RabbitMQConfig } from "./rabbitmq.options"
import { RabbitMQService } from "./rabbitmq.service"

@Global()
@Module({
	imports: [
		ClientsModule.registerAsync([
			{
				name: "BLOCKCHAIN_RABBITMQ_SERVICE",
				useFactory: () => RabbitMQConfig("blockchain")
			},
			{
				name: "SOCKET_RABBITMQ_SERVICE",
				useFactory: () => RabbitMQConfig("socket")
			},
			{
				name: "COLLECT_FEE_REWARD_DISTRIBUTOR_RABBITMQ_SERVICE",
				useFactory: () => RabbitMQConfig("collect-fee-reward-distributor")
			},
			{
				name: "SWAP_TO_SOL_REWARD_DISTRIBUTOR_RABBITMQ_SERVICE",
				useFactory: () => RabbitMQConfig("swap-to-sol-reward-distributor")
			},
			{
				name: "DISTRIBUTE_REWARD_DISTRIBUTOR_RABBITMQ_SERVICE",
				useFactory: () => RabbitMQConfig("distribute-reward-distributor")
			}
		])
	],
	providers: [RabbitMQService],
	exports: [RabbitMQService]
})
export class RabbitMQModule {}
