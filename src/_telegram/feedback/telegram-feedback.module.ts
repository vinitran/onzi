import { Module } from "@nestjs/common"
import { ConfigModule } from "@nestjs/config"
import { TelegrafModule } from "nestjs-telegraf"
import { TelegramFeedbackConfigService } from "./telegram-feedback.config"
import { TelegramFeedbackService } from "./telegram-feedback.service"
import { TelegramUpdate } from "./telegram-feedback.update"

@Module({
	imports: [
		ConfigModule.forRoot(),
		TelegrafModule.forRootAsync({
			useClass: TelegramFeedbackConfigService
		})
	],
	providers: [TelegramUpdate, TelegramFeedbackService],
	exports: [TelegramFeedbackService]
})
export class TelegramFeedbackModule {}
