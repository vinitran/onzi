import { Controller } from "@nestjs/common"
import { Ctx, EventPattern, Payload, RmqContext } from "@nestjs/microservices"
import { Env, InjectEnv } from "@root/_env/env.module"
import { TokenTransaction } from "@root/dtos/token-transaction.dto"
import { TransactionGateway } from "@root/tokens/token.gateway"
import { TokensService } from "@root/tokens/tokens.service"

interface CandleMessage {
	address: string
	date: number
}

@Controller()
export class TokenSocketController {
	constructor(
		@InjectEnv() private env: Env,
		private readonly tokenService: TokensService,
		private readonly txGateway: TransactionGateway
	) {}

	@EventPattern("new-candle")
	async socketNewCandle(
		@Payload() data: CandleMessage,
		@Ctx() context: RmqContext
	) {
		const channel = context.getChannelRef()
		channel.prefetch(1, false)

		await this.tokenService.socketNewCandle(data.address, data.date)
	}

	@EventPattern("new-transaction")
	async socketNewTransaction(
		@Payload() data: TokenTransaction,
		@Ctx() context: RmqContext
	) {
		const channel = context.getChannelRef()
		channel.prefetch(1, false)

		this.txGateway.handleTx(data)
	}
}
