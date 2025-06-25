import { Injectable } from "@nestjs/common"
import { Env, InjectEnv } from "@root/_env/env.module"
import { TelegrafModuleOptions, TelegrafOptionsFactory } from "nestjs-telegraf"

@Injectable()
export class TelegramFeedbackConfigService implements TelegrafOptionsFactory {
	constructor(@InjectEnv() private env: Env) {}

	createTelegrafOptions(): TelegrafModuleOptions {
		return {
			token: this.env.TELEGRAM_FEEDBACK_BOT_ID
		}
	}
}
