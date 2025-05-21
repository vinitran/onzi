import { ValidationPipe } from "@nestjs/common"
import { NestFactory } from "@nestjs/core"
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger"
import { AppModule } from "@root/app.module"

async function bootstrap() {
	const app = await NestFactory.create(AppModule)

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
		await app.listen(8000)
		console.log("Server is running on port 8000")
	} catch (error) {
		console.error("Failed to start server:", error)
		process.exit(1)
	}
}

bootstrap()
