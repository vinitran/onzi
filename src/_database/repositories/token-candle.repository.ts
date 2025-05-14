import { BN } from "@coral-xyz/anchor"
import { Injectable } from "@nestjs/common"
import { Prisma } from "@prisma/client"
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
		timestamp: number,
		price: number,
		newPrice: number,
		amount: BN
	) {
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

		await this.prisma.$transaction(async tx => {
			// Convert timestamp from milliseconds to seconds
			const timestampSeconds = Math.floor(timestamp / 1000)
			// Convert BN amount to number
			const amountNumber = amount.toNumber()

			// Calculate all bucket starts first
			const bucketStarts = steps.map(step => ({
				step,
				date: Math.floor(timestampSeconds / step) * step
			}))

			// Fetch all existing records in one query
			const existingRecords = await tx.tokenChart.findMany({
				where: {
					AND: [
						{ tokenId },
						{
							OR: bucketStarts.map(({ step, date }) => ({
								AND: [{ step }, { date }]
							}))
						}
					]
				}
			})

			// Create a map for quick lookup
			const existingMap = new Map(
				existingRecords.map(record => [`${record.step}_${record.date}`, record])
			)

			// Prepare all upsert operations
			const upsertOperations = bucketStarts.map(({ step, date }) => {
				const key = `${step}_${date}`
				const existing = existingMap.get(key)

				return tx.tokenChart.upsert({
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
						high: Math.max(price, newPrice),
						low: Math.min(price, newPrice),
						close: newPrice,
						volume: amountNumber
					},
					update: {
						high: { set: Math.max(newPrice, existing?.high ?? price) },
						low: { set: Math.min(newPrice, existing?.low ?? price) },
						close: newPrice,
						volume: { increment: amountNumber }
					}
				})
			})

			// Execute all operations in parallel
			await Promise.all(upsertOperations)
		})
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

	async getLatestCandles(tokenId: string, date: number) {
		const steps = [60, 300, 1800, 3600, 86400, 604800, 2592000]

		// Convert date from milliseconds to seconds
		const timestampSeconds = Math.floor(date / 1000)

		// Calculate bucket starts for each step
		const bucketStarts = steps.map(step => ({
			step,
			date: Math.floor(timestampSeconds / step) * step
		}))

		const latestCandles = await this.prisma.tokenChart.findMany({
			where: {
				tokenId,
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
				volume: true
			}
		})

		return latestCandles
	}
}
