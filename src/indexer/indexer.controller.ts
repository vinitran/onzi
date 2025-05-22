import { Controller } from "@nestjs/common"
import { Ctx, EventPattern, Payload, RmqContext } from "@nestjs/microservices"
import { SettingRepository } from "@root/_database/repositories/setting.repository"
import { Env, InjectEnv } from "@root/_env/env.module"
import { StorageIndexerService } from "@root/indexer/storage.service"
import {
	BuyTokensEvent,
	CreateTokenEvent,
	SellTokensEvent
} from "@root/programs/ponz/events"

interface EventMessage<T> {
	event: T
	signature: string
	type: "scan" | "socket"
}

@Controller()
export class IndexerController {
	constructor(
		@InjectEnv() private env: Env,
		private readonly indexerService: StorageIndexerService,
		private readonly settingRepository: SettingRepository
	) {}

	@EventPattern("createTokenEvent")
	async handleCreateToken(
		@Payload() data: EventMessage<CreateTokenEvent>,
		@Ctx() context: RmqContext
	) {
		const channel = context.getChannelRef()
		const originalMsg = context.getMessage()
		channel.prefetch(1, false)

		try {
			await this.indexerService.handlerCreateToken(data)
			channel.ack(originalMsg, false)
		} catch (error) {
			channel.nack(originalMsg, false, false)
			throw error
		}
	}

	@EventPattern("buyEvent")
	async handleBuyToken(
		@Payload() data: EventMessage<BuyTokensEvent>,
		@Ctx() context: RmqContext
	) {
		const channel = context.getChannelRef()
		const originalMsg = context.getMessage()
		channel.prefetch(1, false)

		try {
			await this.indexerService.handlerBuyToken(data)
			channel.ack(originalMsg, false)
		} catch (_error) {
			channel.nack(originalMsg, false, false)
		}
	}

	@EventPattern("sellEvent")
	async handleSellToken(
		@Payload() data: EventMessage<SellTokensEvent>,
		@Ctx() context: RmqContext
	) {
		const channel = context.getChannelRef()
		const originalMsg = context.getMessage()
		channel.prefetch(1, false)

		try {
			await this.indexerService.handlerSellToken(data)
			channel.ack(originalMsg, false)
		} catch (error) {
			channel.nack(originalMsg, false, false)
			throw error
		}
	}
}
