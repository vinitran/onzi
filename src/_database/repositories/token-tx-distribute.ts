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

	async last3WinnerJackpot(id: string) {
		return this.redis.getOrSet(
			`last-3-winner-jackpot: ${id}`,
			() => {
				return this.prisma.tokenTransactionDistribute.findMany({
					where: {
						tokenId: id,
						type: "Jackpot"
					},
					orderBy: {
						updatedAt: "desc"
					},
					take: 3
				})
			},
			5
		)
	}

	async getAggregateTotals(id: string) {
		const items = await this.prisma.tokenTransactionDistribute.groupBy({
			by: ['type'],
			where: { tokenId: id },
			_sum: {
				amountToken: true,
				lamport: true
			},
		});

		let burn = 0n;
		let jackpot = 0n;
		let distribute = 0n;

		for (const item of items) {
			const amountToken = item._sum.amountToken ?? 0n;
			const lamport = item._sum.lamport ?? 0n;
			switch (item.type) {
				case 'Burn':
					burn += amountToken;
					break;
				case 'Distribute':
					distribute += lamport;
					break;
				case 'Jackpot':
					jackpot += lamport;
					break;
				case 'SendToVault':
					distribute += lamport;
					break;
			}
		}

		return {
			Burned: burn.toString(),
			Distributed: distribute.toString(),
			Jackpot: jackpot.toString(),
		};
	}
}
