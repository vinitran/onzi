import { Controller, Logger } from "@nestjs/common"
import { Ctx, EventPattern, Payload, RmqContext } from "@nestjs/microservices"
import { SettingRepository } from "@root/_database/repositories/setting.repository"
import { Env, InjectEnv } from "@root/_env/env.module"
import { IndexerClientService } from "@root/indexer/client.service"
import { StorageIndexerService } from "@root/indexer/storage.service"
import {
	BuyTokensEvent,
	CompleteBondingCurveEvent,
	CreateTokenEvent,
	EVENTS,
	RemoveLiquidityEvent,
	SellTokensEvent
} from "@root/programs/ponz/events"

@Controller()
export class IndexerController {
	constructor(
		@InjectEnv() private env: Env,
		private readonly indexerService: StorageIndexerService,
		private readonly indexerClientService: IndexerClientService,
		private readonly settingRepository: SettingRepository
	) {}

	@EventPattern(EVENTS.CreateToken)
	async handleCreateToken(
		@Payload() data: CreateTokenEvent,
		@Ctx() context: RmqContext
	) {
		const channel = context.getChannelRef()
		const originalMsg = context.getMessage()
		channel.prefetch(20, false)

		try {
			await this.indexerService.handlerCreateToken(data)
			channel.ack(originalMsg, false)
		} catch (error) {
			Logger.error(error, "create token")
			throw error
		}
	}

	@EventPattern(EVENTS.BuyTokens)
	async handleBuyToken(
		@Payload() data: BuyTokensEvent,
		@Ctx() context: RmqContext
	) {
		const channel = context.getChannelRef()
		const originalMsg = context.getMessage()
		channel.prefetch(1, false)

		try {
			await this.indexerService.handlerBuyToken(data)
			channel.ack(originalMsg, false)
		} catch (error) {
			Logger.error(error, "buy token")
			throw error
		}
	}

	@EventPattern(EVENTS.SellTokens)
	async handleSellToken(
		@Payload() data: SellTokensEvent,
		@Ctx() context: RmqContext
	) {
		const channel = context.getChannelRef()
		const originalMsg = context.getMessage()
		channel.prefetch(1, false)

		try {
			await this.indexerService.handlerSellToken(data)
			channel.ack(originalMsg, false)
		} catch (error) {
			Logger.error(error, "sell token")
			throw error
		}
	}

	@EventPattern(EVENTS.CompleteBondingCurve)
	async handleCompleteBondingCurve(
		@Payload() data: CompleteBondingCurveEvent,
		@Ctx() context: RmqContext
	) {
		const channel = context.getChannelRef()
		const originalMsg = context.getMessage()
		channel.prefetch(1, false)

		try {
			Logger.log(
				"start handler complete bonding curve for token address: ",
				data.mint
			)
			await this.indexerClientService.handleCompleteBondingCurve(data)
			Logger.log(
				"end handler complete bonding curve for token address: ",
				data.mint
			)
			channel.ack(originalMsg, false)
		} catch (error) {
			Logger.error(error, "complete bonding curve")
			throw error
		}
	}

	@EventPattern(EVENTS.RemoveLiquidity)
	async handleRemoveLiquidity(
		@Payload() data: RemoveLiquidityEvent,
		@Ctx() context: RmqContext
	) {
		const channel = context.getChannelRef()
		const originalMsg = context.getMessage()
		channel.prefetch(1, false)

		try {
			Logger.log(
				"start handler remove liquidity for token address: ",
				data.mint
			)
			await this.indexerClientService.handleRemoveLiquidity(data)
			Logger.log("end handler remove liquidity for token address: ", data.mint)
			channel.ack(originalMsg, false)
		} catch (error) {
			Logger.error(error, "remove liquidity")
			throw error
		}
	}
}
