import { Logger, ValidationPipe } from "@nestjs/common"
import { NestFactory } from "@nestjs/core"
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger"
import { RabbitMQConfig } from "@root/_rabbitmq/rabbitmq.options"
import { AppModule } from "@root/app.module"

async function bootstrap() {
	const app = await NestFactory.create(AppModule)

	try {
		app.connectMicroservice(RabbitMQConfig("blockchain", false))
		app.connectMicroservice(RabbitMQConfig("socket"))
		app.connectMicroservice(
			RabbitMQConfig("collect-fee-reward-distributor", false, 20)
		)
		app.connectMicroservice(
			RabbitMQConfig("swap-to-sol-reward-distributor", false, 20)
		)
		app.connectMicroservice(
			RabbitMQConfig("distribute-reward-distributor", false, 20)
		)
	} catch (error) {
		console.error("Failed to connect to RabbitMQ:", error)
		process.exit(1)
	}

	app.enableCors({
		origin: true,
		methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
		credentials: true
	})

	app.useGlobalPipes(
		new ValidationPipe({
			whitelist: true,
			transform: true,
			transformOptions: { enableImplicitConversion: true }
		})
	)

	const config = new DocumentBuilder()
		.setTitle("Ponz open api")
		.setVersion("1.0")
		.addBearerAuth()
		.build()

	const documentFactory = () => SwaggerModule.createDocument(app, config)

	SwaggerModule.setup("api", app, documentFactory, {
		swaggerOptions: {
			persistAuthorization: true
		},
		jsonDocumentUrl: "api.json"
	})

	try {
		await app.startAllMicroservices()
		await app.listen(8000)
		Logger.log("Service is running on port 8000")
	} catch (error) {
		Logger.error("Failed to start schedule service:", error)
		process.exit(1)
	}
}

bootstrap()
