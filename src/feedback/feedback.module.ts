import { Module } from "@nestjs/common"
import { TelegramFeedbackModule } from "@root/_telegram/feedback/telegram-feedback.module"
import { FeedbackController } from "./feedback.controller"
import { FeedbackService } from "./feedback.service"

@Module({
	imports: [TelegramFeedbackModule],
	controllers: [FeedbackController],
	providers: [FeedbackService]
})
export class FeedbackModule {}
