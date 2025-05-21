import { Global, Module } from "@nestjs/common"
import { ClientsModule } from "@nestjs/microservices"
import { rabbitMQConfig } from "./rabbitmq.options"
import { RabbitMQService } from "./rabbitmq.service"

@Global()
@Module({
	imports: [
		ClientsModule.registerAsync([
			{
				name: "RABBITMQ_SERVICE",
				useFactory: () => rabbitMQConfig()
			}
		])
	],
	providers: [RabbitMQService],
	exports: [RabbitMQService]
})
export class RabbitMQModule {}
