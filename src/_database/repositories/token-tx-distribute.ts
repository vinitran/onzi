import { Injectable } from "@nestjs/common"
import { Prisma } from "@prisma/client"
import { RedisService } from "@root/_redis/redis.service"
import { PaginateDistributionPayload } from "@root/tokens/dtos/payload.dto"
import { PrismaService } from "../prisma.service"

@Injectable()
export class TokenTransactionDistributeRepository {
	constructor(
		private prisma: PrismaService,
		private redis: RedisService
	) {}

	async insert(data: Prisma.TokenTransactionDistributeCreateInput) {
		return this.prisma.tokenTransactionDistribute.create({ data })
	}

	async insertManyWithSign(
		data: Prisma.TokenTransactionDistributeCreateInput[]
	) {
		return this.prisma.tokenTransactionDistribute.createMany({ data })
	}

	async paginateByToken(tokenId: string, payload: PaginateDistributionPayload) {
		const { page, take } = payload
		const where: Prisma.TokenTransactionDistributeWhereInput = {
			tokenId
		}

		const [data, total] = await Promise.all([
			this.prisma.tokenTransactionDistribute.findMany({
				where,
				orderBy: { updatedAt: "desc" },
				skip: (page - 1) * take,
				take
			}),

			this.prisma.tokenTransactionDistribute.count({
				where
			})
		])

		const formatData = await Promise.all(
			data.map(async item => {
				const [userFrom, userTo] = await Promise.all([
					item.from
						? this.prisma.user.findUnique({
								where: { address: item.from },
								select: {
									address: true,
									id: true,
									username: true,
									avatarUrl: true
								}
							})
						: null,
					item.to
						? this.prisma.user.findUnique({
								where: { address: item.to },
								select: {
									address: true,
									id: true,
									username: true,
									avatarUrl: true
								}
							})
						: null
				])

				return {
					...item,
					userFrom,
					userTo
				}
			})
		)

		return {
			data: formatData,
			total,
			maxPage: Math.ceil(total / take)
		}
	}
}
