import { Controller, Get } from "@nestjs/common"
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger"
import { NotificationsService } from "./notifications.service"

@Controller("notifications")
@ApiTags("notifications")
export class NotificationsController {
	constructor(private readonly notificationsService: NotificationsService) {}

	@Get("latest")
	@ApiOperation({
		summary: "Get latest notifications for transactions and created tokens"
	})
	@ApiResponse({
		status: 200,
		description: "Latest notifications retrieved successfully"
	})
	@ApiResponse({ status: 500, description: "Internal server error" })
	getLatest() {
		return this.notificationsService.getLatest()
	}
}
