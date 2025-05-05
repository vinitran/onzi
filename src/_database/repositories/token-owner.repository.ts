import { BN } from "@coral-xyz/anchor"
import { Injectable } from "@nestjs/common"
import { Prisma } from "@prisma/client"
import { RedisService } from "@root/_redis/redis.service"
import { PaginatedParams } from "@root/dtos/common.dto"
import { PrismaService } from "../prisma.service"

@Injectable()
export class TokenOwnerRepository {
	constructor(
		private prisma: PrismaService,
		private redis: RedisService
	) {}

	findListHolder(data: { tokenAddress: string; take?: number }) {
		const { take = 20, tokenAddress } = data
		return this.prisma.tokenOwner.findMany({ where: { tokenAddress }, take })
	}

	async createTokenOwnerIfNotExist(
		userAddress: string,
		tokenAddress: string,
		amount: BN
	) {
		const tokenOwner = await this.prisma.tokenOwner.findUnique({
			where: {
				userAddress_tokenAddress: {
					userAddress,
					tokenAddress
				}
			}
		})

		if (tokenOwner) {
			return
		}

		return this.prisma.tokenOwner.create({
			data: {
				userAddress,
				tokenAddress,
				amount: amount.toString()
			}
		})
	}

	async findTokenOwner(userAddress: string, tokenAddress: string) {
		return this.prisma.tokenOwner.findUnique({
			where: {
				userAddress_tokenAddress: {
					userAddress,
					tokenAddress
				}
			}
		})
	}

	async getBalance(userAddress: string, query: PaginatedParams) {
		const where: Prisma.TokenOwnerWhereInput = {
			userAddress,
			amount: {
				gt: 0
			}
		}

		const orderBy: Prisma.TokenOwnerOrderByWithRelationInput = {
			amount: Prisma.SortOrder.desc
		}

		const include: Prisma.TokenOwnerInclude = {
			token: {
				select: {
					name: true,
					ticker: true,
					imageUri: true,
					price: true
				}
			}
		}

		const [data, total] = await this.redis.getOrSet(
			`getBalance:${userAddress}, query: ${query}`,
			async () => {
				return Promise.all([
					this.prisma.tokenOwner.findMany({
						where,
						orderBy,
						include
					}),
					this.prisma.tokenOwner.count({ where })
				])
			},
			3
		)

		return {
			data: data.map(item => ({
				...item,
				amount: item.amount.toString()
			})),
			total,
			maxPage: Math.ceil(total / query.take)
		}
	}

	async createTokenOwner(
		userAddress: string,
		tokenAddress: string,
		amount: BN
	) {
		return this.prisma.tokenOwner.create({
			data: {
				userAddress,
				tokenAddress,
				amount: amount.toString()
			}
		})
	}

	async updateTokenOwner(
		userAddress: string,
		tokenAddress: string,
		amount: BN
	) {
		if (amount.toNumber() > 0) {
			return this.prisma.tokenOwner.update({
				where: {
					userAddress_tokenAddress: {
						userAddress,
						tokenAddress
					}
				},
				data: {
					amount: amount.toString()
				}
			})
		}

		return this.prisma.tokenOwner.delete({
			where: {
				userAddress_tokenAddress: {
					userAddress,
					tokenAddress
				}
			}
		})
	}

	async saveTokenOwner(data: {
		userAddress: string
		tokenAddress: string
		amount: BN
		type: string
	}) {
		const { userAddress, tokenAddress, amount, type } = data

		const tokenOwner = await this.findTokenOwner(userAddress, tokenAddress)

		if (!tokenOwner) {
			return this.createTokenOwner(userAddress, tokenAddress, amount)
		}
		const dbAmountBN = new BN(tokenOwner.amount.toString())

		const newAmount =
			type === "Sell" ? dbAmountBN.sub(amount) : dbAmountBN.add(amount)

		return this.updateTokenOwner(userAddress, tokenAddress, newAmount)
	}
}
