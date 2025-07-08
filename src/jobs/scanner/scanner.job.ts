import { randomUUID } from "node:crypto"
import { Injectable, OnModuleInit } from "@nestjs/common"
import { Cron, CronExpression } from "@nestjs/schedule"
import { PrismaService } from "@root/_database/prisma.service"
import { TokenRepository } from "@root/_database/repositories/token.repository"
import { IndexerService } from "@root/indexer/indexer.service"
import { HeliusService } from "@root/onchain/helius.service"

@Injectable()
export class ScannerJobs implements OnModuleInit {
	constructor(
		private readonly indexer: IndexerService,
		private readonly tokenRepository: TokenRepository,
		private readonly helius: HeliusService,
		private prisma: PrismaService
	) {}

	async onModuleInit() {
		this.indexer.connectToWebSocketSolana()
	}

	@Cron(CronExpression.EVERY_MINUTE)
	async run() {
		await this.indexer.scannerSolana()
	}

	@Cron(CronExpression.EVERY_MINUTE)
	async updateTokenOwner() {
		const tokens = await this.tokenRepository.getAllTokenAddress()
		for (const token of tokens) {
			const holders = await this.helius.getTokenHolders(token.address, true)
			const userValues = holders
				.filter(h => BigInt(h.amount) !== 0n)
				.map(
					h => `('${randomUUID()}', '${h.address}', '${h.address.slice(0, 8)}')`
				)
				.join(",\n")

			const tokenOwnerValues = holders
				.map(
					h =>
						`('${randomUUID()}', '${h.address}', '${token.address}', ${BigInt(h.amount)})`
				)
				.join(",\n")

			await this.prisma.$transaction([
				this.prisma.$executeRawUnsafe(`
					INSERT INTO "user" (id, address, username)
					VALUES ${userValues}
					ON CONFLICT (address) DO NOTHING;
				`),
				this.prisma.$executeRawUnsafe(`
						INSERT INTO token_owner (id, user_address, token_address, amount)
						VALUES ${tokenOwnerValues}
						ON CONFLICT (user_address, token_address)
						DO UPDATE SET amount = EXCLUDED.amount
				`),
				this.prisma.$executeRawUnsafe(`
					DELETE FROM token_owner
					WHERE amount = 0
				`)
			])
		}
	}
}
