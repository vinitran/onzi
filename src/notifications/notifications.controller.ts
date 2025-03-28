import { Controller, Get } from "@nestjs/common"
import { ApiOperation, ApiTags } from "@nestjs/swagger"
import { NotificationsService } from "./notifications.service"

@Controller("notifications")
@ApiTags("notifications")
export class NotificationsController {
	constructor(private readonly notificationsService: NotificationsService) {}

	@Get("latest")
	@ApiOperation({ summary: "Get latest transaction & created on-chain token" })
	getLatest() {
		return this.notificationsService.getLatest()
	}
}
