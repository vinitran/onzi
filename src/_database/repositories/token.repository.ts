import { Injectable } from "@nestjs/common"
import { GetCoinCreatedParams } from "@root/users/dto/user.dto"
import { PrismaService } from "../prisma.service"

@Injectable()
export class TokenRepository {
	constructor(private prisma: PrismaService) {}

	findById(tokenId: string) {
		return this.prisma.token.findFirst({
			where: {
				id: tokenId
			}
		})
	}

	async getCoinCreated(query: GetCoinCreatedParams) {
		const { page, take, creatorAddress } = query

		const getTotal = this.prisma.token.count({
			where: {
				creatorAddress
			}
		})

		const getCoins = this.prisma.token.findMany({
			where: {
				creatorAddress
			},
			orderBy: {
				updatedAt: "desc"
			},
			skip: (page - 1) * take,
			take
		})

		const [total, coinCreated] = await Promise.all([getTotal, getCoins])

		return {
			total,
			maxPage: Math.ceil(total / take),
			coinCreated
		}
	}
}
