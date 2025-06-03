import { Global, Module } from "@nestjs/common"
import { ClientsModule } from "@nestjs/microservices"
import {
	blockchainRabbitMQConfig,
	socketRabbitMQConfig
} from "./rabbitmq.options"
import { RabbitMQService } from "./rabbitmq.service"

@Global()
@Module({
	imports: [
		ClientsModule.registerAsync([
			{
				name: "BLOCKCHAIN_RABBITMQ_SERVICE",
				useFactory: () => blockchainRabbitMQConfig()
			},
			{
				name: "SOCKET_RABBITMQ_SERVICE",
				useFactory: () => socketRabbitMQConfig()
			}
		])
	],
	providers: [RabbitMQService],
	exports: [RabbitMQService]
})
export class RabbitMQModule {}
