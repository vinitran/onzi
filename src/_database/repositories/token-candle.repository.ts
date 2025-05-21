import { Injectable } from "@nestjs/common"
import { Prisma } from "@prisma/client"
import { Decimal } from "@prisma/client/runtime/library"
import { RedisService } from "@root/_redis/redis.service"
import { PrismaService } from "../prisma.service"

@Injectable()
export class TokenChartRepository {
	constructor(
		private prisma: PrismaService,
		private redis: RedisService
	) {}

	async upsertWithManySteps(
		tokenId: string,
		timestamp: string,
		price: string,
		newPrice: string,
		amount: string,
		tx?: Prisma.TransactionClient
	) {
		const client = tx ?? this.prisma

		// array of steps in seconds
		const steps: number[] = [
			60, // 1 minute
			300, // 5 minutes
			1800, // 30 minutes
			3600, // 1 hour
			86400, // 24 hours
			604800, // 7 days
			2592000 // 30 days
		]

		// Convert BN amount to number
		const amountNumber = BigInt(amount)

		// Calculate all bucket starts first
		const bucketStarts = steps.map(step => ({
			step,
			date: Math.floor(Number(timestamp) / step) * step
		}))

		// Prepare all upsert operations
		const upsertOperations = bucketStarts.map(({ step, date }) => {
			return client.tokenChart.upsert({
				where: {
					tokenId_step_date: {
						tokenId,
						step,
						date
					}
				},
				create: {
					tokenId,
					step,
					date,
					open: price,
					high: Decimal.max(new Decimal(price), new Decimal(newPrice)),
					low: Decimal.min(new Decimal(price), new Decimal(newPrice)),
					close: newPrice,
					volume: amountNumber
				},
				update: {
					high: Decimal.max(new Decimal(price), new Decimal(newPrice)),
					low: Decimal.min(new Decimal(price), new Decimal(newPrice)),
					close: newPrice,
					volume: { increment: amountNumber }
				}
			})
		})

		// Execute all operations in parallel
		await Promise.all(upsertOperations)
	}

	async getChartData(id: string, step: number, from: number, to: number) {
		return this.redis.getOrSet(
			`chart-data:${id}:${step}:${from}:${to}`,
			async () => {
				return this.prisma.tokenChart.findMany({
					where: {
						tokenId: id,
						step,
						date: {
							gte: from,
							lte: to
						}
					},
					orderBy: {
						date: Prisma.SortOrder.asc
					},
					select: {
						date: true,
						open: true,
						high: true,
						low: true,
						close: true,
						volume: true
					}
				})
			},
			5
		)
	}

	async getLatestCandles(address: string, date: number) {
		const steps = [60, 300, 1800, 3600, 86400, 604800, 2592000]

		// Calculate bucket starts for each step
		const bucketStarts = steps.map(step => ({
			step,
			date: Math.floor(date / step) * step
		}))

		const latestCandles = await this.prisma.tokenChart.findMany({
			where: {
				token: { address },
				OR: bucketStarts.map(({ step, date }) => ({
					AND: [{ step }, { date }]
				}))
			},
			orderBy: [{ step: "asc" }],
			select: {
				step: true,
				date: true,
				open: true,
				high: true,
				low: true,
				close: true,
				volume: true,
				token: {
					select: {
						id: true
					}
				}
			}
		})

		return latestCandles
	}
}
