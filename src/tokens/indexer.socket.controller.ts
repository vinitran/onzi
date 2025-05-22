import { Controller } from "@nestjs/common"
import { Ctx, EventPattern, Payload, RmqContext } from "@nestjs/microservices"
import { Env, InjectEnv } from "@root/_env/env.module"
import { TokensService } from "@root/tokens/tokens.service"

interface CandleMessage {
	address: string
	date: number
}

@Controller()
export class TokenSocketController {
	constructor(
		@InjectEnv() private env: Env,
		private readonly tokenService: TokensService
	) {}

	@EventPattern("new-candle")
	async socketNewCandle(
		@Payload() data: CandleMessage,
		@Ctx() context: RmqContext
	) {
		const channel = context.getChannelRef()
		const originalMsg = context.getMessage()
		channel.prefetch(1, false)

		try {
			await this.tokenService.socketNewCandle(data.address, data.date)
			channel.ack(originalMsg, false)
		} catch (error) {
			channel.ack(originalMsg, false)
			throw error
		}
	}
}
