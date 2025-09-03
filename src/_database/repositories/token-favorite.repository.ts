import { Injectable } from "@nestjs/common"
import { Prisma } from "@prisma/client"
import { FindListTokenFavoriteParams } from "@root/tokens/dtos/payload.dto"
import { PrismaService } from "../prisma.service"

@Injectable()
export class TokenFavoriteRepository {
	constructor(private prisma: PrismaService) {}

	async find({
		page,
		take,
		userAddress
	}: FindListTokenFavoriteParams & { userAddress: string }) {
		const skip = (page - 1) * take
		const where: Prisma.TokenFavoriteWhereInput = {
			userAddress
		}

		const include: Prisma.TokenFavoriteInclude = {
			token: {
				include: {
					creator: {
						select: {
							id: true,
							address: true,
							avatarUrl: true,
							username: true
						}
					}
				}
			}
		}

		const [data, total] = await Promise.all([
			this.prisma.tokenFavorite.findMany({
				where,
				take,
				skip,
				orderBy: { createdAt: Prisma.SortOrder.desc },
				include
			}),
			this.prisma.tokenFavorite.count({ where })
		])

		return {
			data,
			total,
			maxPage: Math.ceil(total / take)
		}
	}

	findOne(data: { userAddress: string; tokenAddress: string }) {
		return this.prisma.tokenFavorite.findUnique({
			where: { tokenAddress_userAddress: data }
		})
	}

	create(data: Prisma.TokenFavoriteCreateInput) {
		return this.prisma.tokenFavorite.create({ data })
	}

	delete(data: { userAddress: string; tokenAddress: string }) {
		return this.prisma.tokenFavorite.delete({
			where: {
				tokenAddress_userAddress: data
			}
		})
	}
}
