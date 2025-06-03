import { RmqOptions, Transport } from "@nestjs/microservices"

export const blockchainRabbitMQConfig = (): RmqOptions => ({
	transport: Transport.RMQ,
	options: {
		urls: [process.env.RABBITMQ_URL as string],
		queue: `${process.env.RABBITMQ_QUEUE as string}-blockchain`,
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

export const socketRabbitMQConfig = (): RmqOptions => ({
	transport: Transport.RMQ,
	options: {
		urls: [process.env.RABBITMQ_URL as string],
		queue: `${process.env.RABBITMQ_QUEUE as string}-socket`,
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
