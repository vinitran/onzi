import { NestFactory } from "@nestjs/core"
import { JobsModule } from "./jobs/job.module"

async function bootstrap() {
	await NestFactory.createApplicationContext(JobsModule)
}

bootstrap()
