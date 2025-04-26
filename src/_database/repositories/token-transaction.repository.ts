import { BN, web3 } from "@coral-xyz/anchor"
import { Injectable } from "@nestjs/common"
import { Network, Prisma, TransactionType } from "@prisma/client"
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
	constructor(private prisma: PrismaService) {}

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
		return this.prisma.tokenTransaction.findUnique({
			where: {
				signature
			}
		})
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
								query.type === "buy"
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
			...(query.amountSolTo
				? [{ lamports: { lte: query.amountTokenTo } }]
				: []),
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

	async getPriceChangePercentageByTime(params: {
		tokenAddress: string
		startTime: DateTime
		endTime: DateTime
	}) {
		const transactions = await this.prisma.tokenTransaction.findMany({
			where: {
				tokenAddress: params.tokenAddress,
				date: {
					gte: params.startTime.toJSDate(),
					lte: params.endTime.toJSDate()
				}
			},
			orderBy: {
				date: "asc"
			}
		})

		if (transactions.length === 0) {
			return 0
		}

		const firstPrice = Number(transactions[0].price)
		const lastPrice = Number(transactions[transactions.length - 1].newPrice)

		if (firstPrice === 0) {
			return 0
		}

		return ((lastPrice - firstPrice) / firstPrice) * 100
	}

	async getPriceChangePercentages(tokenAddress: string) {
		const now = DateTime.now()
		const ranges = [
			{ name: "1h", startTime: now.minus({ hours: 1 }) },
			{ name: "24h", startTime: now.minus({ hours: 24 }) },
			{ name: "7d", startTime: now.minus({ days: 7 }) }
		]

		const results = await Promise.all(
			ranges.map(async ({ name, startTime }) => {
				const percentage = await this.getPriceChangePercentageByTime({
					tokenAddress,
					startTime,
					endTime: now
				})
				return { [name]: percentage }
			})
		)

		return Object.assign({}, ...results)
	}
}
