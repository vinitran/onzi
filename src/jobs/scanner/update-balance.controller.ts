import { randomUUID } from "node:crypto"
import { Controller } from "@nestjs/common"
import { Ctx, EventPattern, Payload, RmqContext } from "@nestjs/microservices"
import { PrismaService } from "@root/_database/prisma.service"
import { Env, InjectEnv } from "@root/_env/env.module"
import { HeliusService } from "@root/onchain/helius.service"

export type UpdateBalancePayload = {
	address: string
}

export const UPDATE_BALANCE_EVENTS = {
	UPDATE: "update-balance.update"
} as const

@Controller()
export class UpdateBalanceController {
	constructor(
		@InjectEnv() private env: Env,
		private readonly helius: HeliusService,
		private prisma: PrismaService
	) {}

	@EventPattern(UPDATE_BALANCE_EVENTS.UPDATE)
	async handlerUpdateBalance(
		@Payload() data: UpdateBalancePayload,
		@Ctx() context: RmqContext
	) {
		const channel = context.getChannelRef()
		channel.prefetch(10, false)

		const holders = await this.helius.getTokenHolders(data.address, true)

		const userValues = holders
			.map(
				h => `('${randomUUID()}', '${h.address}', '${h.address.slice(0, 8)}')`
			)
			.join(",\n")

		const tokenOwnerValues = holders
			.map(
				h =>
					`('${randomUUID()}', '${h.address}', '${data.address}', ${BigInt(h.amount)})`
			)
			.join(",\n")

		if (userValues.length > 0) {
			await this.prisma.$executeRawUnsafe(`
				INSERT INTO "user" (id, address, username)
				VALUES ${userValues}
				ON CONFLICT (address) DO NOTHING;
			`)
		}

		if (tokenOwnerValues.length > 0) {
			await this.prisma.$executeRawUnsafe(`
				INSERT INTO token_owner (id, user_address, token_address, amount)
				VALUES ${tokenOwnerValues}
				ON CONFLICT (user_address, token_address)
				DO UPDATE SET amount = EXCLUDED.amount;
			`)
		}
		await this.prisma.$executeRawUnsafe(`
			DELETE FROM token_owner
			WHERE amount = 0;
		`)
	}
}
