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

export type ChartQuery = {
	date: number // timestamp mili-s
	open: number | null
	high: number | null
	low: number | null
	close: number | null
	volume: number | null
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

	async getChart({
		pubkey,
		from,
		to,
		step
	}: {
		pubkey: string
		from: number
		to: number
		step: number
	}) {
		// Validate input
		if (!pubkey) {
			throw new Error("Invalid pubkey")
		}
		if (step <= 0) {
			throw new Error("Invalid step")
		}

		return this.prisma.$queryRaw<ChartQuery[]>`
			WITH time_buckets AS (
				SELECT
					token_address,
					FLOOR(EXTRACT(EPOCH FROM date) * 1000 / ${step}) * ${step} AS bucket_start,
					price,
					new_price,
					date,
					amount
				FROM token_transaction
				WHERE token_address = ${pubkey}
					AND date BETWEEN TO_TIMESTAMP(${from} / 1000) AND TO_TIMESTAMP(${to} / 1000)
			),
			bucket_data AS (
				SELECT
					bucket_start,
				token_address,
					MIN(date) AS first_date,
					MAX(date) AS last_date,
					MAX(price) AS high_price,
					MIN(price) AS low_price,
					SUM(amount) AS total_volume
				FROM time_buckets
				GROUP BY bucket_start, token_address
			),
			open_close_prices AS (
				SELECT
					b.bucket_start,
					b.token_address,
					b.high_price,
					b.low_price,
					b.total_volume,
					(
						SELECT price 
						FROM time_buckets t 
						WHERE t.bucket_start = b.bucket_start 
						AND t.date = b.first_date 
						LIMIT 1
					) AS open_price,
					(
						SELECT new_price 
						FROM time_buckets t 
						WHERE t.bucket_start = b.bucket_start 
						AND t.date = b.last_date 
						LIMIT 1
					) AS close_price
				FROM bucket_data b
			)
			SELECT
				bucket_start AS date,
				open_price AS open,
				high_price AS high,
				low_price AS low,
				close_price AS close,
				total_volume AS volume
			FROM open_close_prices
			ORDER BY date ASC;
		`
	}
}
