import { NestFactory } from "@nestjs/core"
import { rabbitMQConfig } from "@root/_rabbitmq/rabbitmq.options"
import { JobsModule } from "./jobs/job.module"

async function bootstrap() {
	const app = await NestFactory.create(JobsModule)

	try {
		app.connectMicroservice({
			...rabbitMQConfig(),
			options: {
				...rabbitMQConfig().options,
				noAck: false
			}
		})
	} catch (error) {
		console.error("Failed to connect to RabbitMQ:", error)
		process.exit(1)
	}

	try {
		await app.startAllMicroservices()
		await app.listen(8001)
		console.log("Schedule service is running on port 8001")
	} catch (error) {
		console.error("Failed to start schedule service:", error)
		process.exit(1)
	}
}

bootstrap()
