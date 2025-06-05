import { RmqOptions, Transport } from "@nestjs/microservices"
import { RabbitMQServiceType } from "@root/_rabbitmq/rabbitmq.service"

export const RabbitMQConfig = (
	queue: RabbitMQServiceType,
	noAck?: boolean,
	prefetchCount = 1
): RmqOptions => ({
	transport: Transport.RMQ,
	options: {
		urls: [process.env.RABBITMQ_URL as string],
		queue: `${process.env.RABBITMQ_QUEUE as string}-${queue}`,
		queueOptions: {
			durable: true,
			maxLength: 5000,
			arguments: {
				"x-dead-letter-exchange": "",
				"x-dead-letter-routing-key": `${process.env.RABBITMQ_QUEUE}_retry`
			}
		},
		prefetchCount,
		persistent: true,
		...(noAck !== undefined && { noAck })
	}
})
