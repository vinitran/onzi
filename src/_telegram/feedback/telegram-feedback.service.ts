import { Injectable, Logger } from "@nestjs/common"
import { Env, InjectEnv } from "@root/_env/env.module"
import { InjectBot } from "nestjs-telegraf"
import { Telegraf } from "telegraf"

@Injectable()
export class TelegramFeedbackService {
	private readonly logger = new Logger(TelegramFeedbackService.name)

	constructor(
		@InjectBot() private readonly bot: Telegraf,
		@InjectEnv() private env: Env
	) {}

	async sendMessage(content: string): Promise<any> {
		try {
			const groupId = this.env.TELEGRAM_FEEDBACK_GROUP_ID

			return this.bot.telegram.sendMessage(groupId, content, {
				parse_mode: "Markdown"
			})
		} catch (error) {
			this.logger.error(error)
		}
	}
}
