import { Injectable } from "@nestjs/common"
import { Network, Prisma, TransactionType } from "@prisma/client"
import { RedisService } from "@root/_redis/redis.service"
import { ListTransactionParams } from "@root/tokens/dtos/payload.dto"
import { DateTime } from "luxon"
import { PrismaService } from "../prisma.service"

type CreateTokenTransactionParams = {
	signer: string
	address: string
	date: DateTime
	amount: string
	lamports: string
	type: TransactionType
	signature: string
	price: string
	newPrice: string
	network: Network
}

@Injectable()
export class TokenTransactionRepository {
	constructor(
		private prisma: PrismaService,
		private redis: RedisService
	) {}

	create(params: CreateTokenTransactionParams, tx?: Prisma.TransactionClient) {
		const client = tx ?? this.prisma

		return client.tokenTransaction.create({
			data: {
				amount: BigInt(params.amount),
				date: params.date.toJSDate(),
				type: params.type,
				lamports: BigInt(params.lamports),
				tokenAddress: params.address,
				signature: params.signature,
				signer: params.signer,
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

	async findNonExistentSignatures(signatures: string[]): Promise<string[]> {
		try {
			if (!Array.isArray(signatures) || signatures.length === 0) {
				return []
			}

			const existingTransactions = await this.prisma.tokenTransaction.findMany({
				where: {
					signature: {
						in: signatures
					}
				},
				select: {
					signature: true
				}
			})

			const existingSignatures = new Set(
				existingTransactions.map(tx => tx.signature)
			)
			return signatures.filter(signature => !existingSignatures.has(signature))
		} catch (error) {
			console.error("Error in findNonExistentSignatures:", error)
			throw new Error("Failed to check existing signatures")
		}
	}
}
