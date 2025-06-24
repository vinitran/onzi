// telegram.update.ts
import { Ctx, On, Start, Update } from "nestjs-telegraf"
import { Context } from "telegraf"

@Update()
export class TelegramUpdate {
	@Start()
	start(@Ctx() ctx: Context) {
		ctx.reply("🦁🦁Chào mừng bạn đến với bot của tôi!")
	}

	@On("text")
	onMessage(@Ctx() ctx: Context) {
		console.log("Sent: ", ctx.message)
	}
}
