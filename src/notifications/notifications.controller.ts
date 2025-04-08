import { Controller, Get } from "@nestjs/common"
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger"
import { NotificationDto } from "@root/notifications/dto/notification.dto"
import { plainToInstance } from "class-transformer"
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
		description: "Latest notifications retrieved successfully",
		type: NotificationDto
	})
	@ApiResponse({ status: 500, description: "Internal server error" })
	async getLatest() {
		const data = await this.notificationsService.getLatest()

		return plainToInstance(NotificationDto, data, {
			excludeExtraneousValues: true
		})
	}
}
