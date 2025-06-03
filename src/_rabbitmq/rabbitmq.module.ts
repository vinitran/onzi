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
			}
		])
	],
	providers: [RabbitMQService],
	exports: [RabbitMQService]
})
export class RabbitMQModule {}
