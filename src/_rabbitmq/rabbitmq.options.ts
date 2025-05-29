import { RmqOptions, Transport } from "@nestjs/microservices"

export const rabbitMQConfig = (): RmqOptions => ({
	transport: Transport.RMQ,
	options: {
		urls: [process.env.RABBITMQ_URL as string],
		queue: process.env.RABBITMQ_QUEUE as string,
		queueOptions: {
			durable: true,
			maxLength: 5000,
			arguments: {
				"x-dead-letter-exchange": "",
				"x-dead-letter-routing-key": `${process.env.RABBITMQ_QUEUE}_retry`
			}
		},
		prefetchCount: 1,
		persistent: true
	}
})
