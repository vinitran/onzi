import { Injectable } from "@nestjs/common"
import { Env, InjectEnv } from "@root/_env/env.module"
import { TelegrafModuleOptions, TelegrafOptionsFactory } from "nestjs-telegraf"

@Injectable()
export class TelegramFeedbackConfigService implements TelegrafOptionsFactory {
	constructor(@InjectEnv() private env: Env) {}

	createTelegrafOptions(): TelegrafModuleOptions {
		if (!this.env.TELEGRAM_FEEDBACK_BOT_ID || !this.env.BE_DOMAIN) {
			throw new Error("Error telegram")
		}

		return {
			token: this.env.TELEGRAM_FEEDBACK_BOT_ID,
			launchOptions: {
				webhook: {
					domain: this.env.BE_DOMAIN,
					hookPath: "/bot"
				}
			}
		}
	}
}
