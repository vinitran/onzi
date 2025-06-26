import { Injectable } from "@nestjs/common"
import { Env, InjectEnv } from "@root/_env/env.module"
import { TelegrafModuleOptions, TelegrafOptionsFactory } from "nestjs-telegraf"

@Injectable()
export class TelegramFeedbackConfigService implements TelegrafOptionsFactory {
	constructor(@InjectEnv() private env: Env) {}

	createTelegrafOptions(): TelegrafModuleOptions {
		try {
			return {
				token: this.env.TELEGRAM_FEEDBACK_BOT_ID,
				launchOptions: {
					webhook: {
						domain: this.env.BE_DOMAIN,
						hookPath: "/bot"
					}
				}
			}
		} catch (error) {
			// Handle the error as needed, for now throw to ensure a return value is always present
			console.log(error)
			return {
				token: "",
				launchOptions: {
					webhook: {
						domain: "",
						hookPath: "/bot"
					}
				}
			}
		}
	}
}
