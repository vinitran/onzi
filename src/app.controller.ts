import { Controller, Get } from "@nestjs/common"
import { ApiOperation, ApiResponse } from "@nestjs/swagger"
import { AppService } from "@root/app.service"

@Controller()
export class AppController {
	constructor(private readonly appService: AppService) {}

	@Get()
	@ApiOperation({ summary: "Get application health status" })
	@ApiResponse({
		status: 200,
		description: "Application is healthy",
		type: String
	})
	getHello(): string {
		return this.appService.getHello()
	}
}
