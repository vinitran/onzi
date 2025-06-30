// telegram.update.ts
import { Ctx, Start, Update } from "nestjs-telegraf"
import { Context } from "telegraf"

@Update()
export class TelegramUpdate {
	@Start()
	start(@Ctx() ctx: Context) {
		ctx.reply("Welcome to Ponz")
	}
}
