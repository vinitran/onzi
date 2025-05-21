import { RmqOptions, Transport } from "@nestjs/microservices"

export const rabbitMQConfig = (): RmqOptions => ({
	transport: Transport.RMQ,
	options: {
		urls: [process.env.RABBITMQ_URL as string],
		queue: process.env.RABBITMQ_QUEUE as string,
		queueOptions: {
			durable: true,
			maxLength: 5000
		},
		noAck: true,
		prefetchCount: 1
	}
})
