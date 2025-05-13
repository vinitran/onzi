import { BN, web3 } from "@coral-xyz/anchor"
import { Injectable } from "@nestjs/common"
import { Network, Prisma, TransactionType } from "@prisma/client"
import { RedisService } from "@root/_redis/redis.service"
import { ListTransactionParams } from "@root/tokens/dtos/payload.dto"
import { DateTime } from "luxon"
import { PrismaService } from "../prisma.service"

type CreateTokenTransactionParams = {
	signer: web3.PublicKey
	address: web3.PublicKey
	date: DateTime
	amount: BN
	lamports: BN
	type: TransactionType
	signature: string
	price: number
	newPrice: number
	network: Network
}

@Injectable()
export class TokenTransactionRepository {
	constructor(
		private prisma: PrismaService,
		private redis: RedisService
	) {}

	create(params: CreateTokenTransactionParams) {
		return this.prisma.tokenTransaction.create({
			data: {
				amount: params.amount.toString(),
				date: params.date.toJSDate(),
				type: params.type,
				lamports: params.lamports.toString(),
				tokenAddress: params.address.toBase58(),
				signature: params.signature,
				signer: params.signer.toBase58(),
				price: params.price,
				newPrice: params.newPrice,
				network: params.network
			}
		})
	}

	findBySignature(signature: string) {
		return this.redis.getOrSet(
			`findBySignature:${signature}`,
			async () => {
				return this.prisma.tokenTransaction.findUnique({
					where: {
						signature
					}
				})
			},
			3
		)
	}

	getLatest() {
		return this.prisma.tokenTransaction.findFirst({
			orderBy: { createdAt: "desc" },
			select: {
				id: true,
				signature: true,
				tokenAddress: true,
				type: true,
				token: true,
				createdBy: true
			}
		})
	}

	async paginate(id: string, query: ListTransactionParams) {
		const skip = (query.page - 1) * query.take
		const where: Prisma.TokenTransactionWhereInput = {
			token: {
				id
			}
		}

		const include: Prisma.TokenTransactionInclude = {
			...(query.detail && {
				token: {
					select: {
						address: true,
						name: true,
						network: true,
						marketCapacity: true
					}
				},
				createdBy: {
					select: { username: true, address: true, avatarUrl: true }
				}
			})
		}

		const orderBy: Prisma.TokenTransactionOrderByWithRelationInput[] = [
			...(query.price ? [{ price: query.price }] : []),
			...(query.amount ? [{ amount: query.amount }] : []),
			...(query.lamports ? [{ lamports: query.lamports }] : []),
			...(query.createTime
				? [{ createdAt: query.createTime }]
				: [{ createdAt: Prisma.SortOrder.desc }])
		]

		where.AND = [
			...(query.type
				? [
						{
							type:
								query.type === "Buy"
									? TransactionType.Buy
									: TransactionType.Sell
						}
					]
				: []),
			...(query.amountTokenFrom
				? [{ amount: { gte: query.amountTokenFrom } }]
				: []),
			...(query.amountTokenTo
				? [{ amount: { lte: query.amountTokenTo } }]
				: []),
			...(query.amountSolFrom
				? [{ lamports: { gte: query.amountSolFrom } }]
				: []),
			...(query.amountSolTo ? [{ lamports: { lte: query.amountSolTo } }] : []),
			...(query.createAtFrom
				? [{ createdAt: { gte: query.createAtFrom } }]
				: []),
			...(query.createAtTo ? [{ createdAt: { lte: query.createAtTo } }] : [])
		]

		if (query.name) {
			where.OR = [
				{
					createdBy: {
						username: {
							contains: query.name,
							mode: "insensitive"
						}
					}
				},
				{
					createdBy: {
						address: {
							contains: query.name,
							mode: "insensitive"
						}
					}
				}
			]
		}

		const [transactions, total] = await Promise.all([
			this.prisma.tokenTransaction.findMany({
				where,
				orderBy,
				skip,
				take: query.take,
				include
			}),
			this.prisma.tokenTransaction.count({ where })
		])

		return {
			data: transactions,
			total,
			maxPage: Math.ceil(total / query.take)
		}
	}
}
