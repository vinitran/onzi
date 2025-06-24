import { Controller, Get } from "@nestjs/common"
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger"
import { ApiPaginatedResponse, Paginate } from "@root/dtos/common.dto"
import { NotificationResponse } from "@root/notifications/dtos/response.dto"
import { plainToInstance } from "class-transformer"
import { NotificationsService } from "./notifications.service"

@Controller("notifications")
@ApiTags("notifications")
export class NotificationsController {
	constructor(private readonly notificationsService: NotificationsService) {}

	@Get("latest")
	@ApiPaginatedResponse(NotificationResponse)
	@ApiOperation({
		summary: "Get latest notifications for transactions and created tokens"
	})
	@ApiResponse({
		status: 200,
		description: "Latest notifications retrieved successfully",
		type: NotificationResponse
	})
	@ApiResponse({ status: 500, description: "Internal server error" })
	async getLatest() {
		const { data, total, maxPage } = await this.notificationsService.getLatest()

		return plainToInstance(
			Paginate<NotificationResponse>,
			new Paginate(data, total, maxPage),
			{
				excludeExtraneousValues: true
			}
		)
	}
}
