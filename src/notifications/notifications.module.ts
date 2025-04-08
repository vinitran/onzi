import { Module } from "@nestjs/common"
import { DatabaseModule } from "@root/_database/database.module"
import { NotificationsController } from "./notifications.controller"
import { NotificationsService } from "./notifications.service"

@Module({
	imports: [DatabaseModule],
	controllers: [NotificationsController],
	providers: [NotificationsService]
})
export class NotificationsModule {}
