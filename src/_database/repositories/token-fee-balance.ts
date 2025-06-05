import { Injectable, InternalServerErrorException } from "@nestjs/common"
import { RedisService } from "@root/_redis/redis.service"
import { PrismaService } from "../prisma.service"

@Injectable()
export class TokenFeeBalanceRepository {
	constructor(
		private prisma: PrismaService,
		private redis: RedisService
	) {}

	async upsert(tokenId: string, amount: bigint) {
		try {
			const tokenFeeBalance = await this.prisma.tokenFeeBalance.upsert({
				where: {
					tokenId
				},
				create: {
					tokenId,
					amount
				},
				update: {
					amount: {
						increment: amount
					}
				}
			})

			return tokenFeeBalance
		} catch (_error) {
			throw new InternalServerErrorException(
				"Failed to upsert token fee balance"
			)
		}
	}
}
