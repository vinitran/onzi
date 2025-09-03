import { Injectable } from "@nestjs/common"
import { Prisma } from "@prisma/client"
import { PaginateReelReportsPayload } from "@root/_shared/types/reel"
import { PrismaService } from "../prisma.service"

@Injectable()
export class ReelReportRepository {
	constructor(private prisma: PrismaService) {}

	create(data: Prisma.ReelReportCreateInput) {
		return this.prisma.reelReport.create({ data })
	}

	findOne(where: Prisma.ReelReportWhereInput) {
		return this.prisma.reelReport.findFirst({
			where
		})
	}

	findLatestByUser(reelId: string, reporterId: string) {
		return this.prisma.reelReport.findFirst({
			where: { reelId, reporterId },
			orderBy: { createdAt: "desc" }
		})
	}

	async paginateByReelId(payload: Omit<PaginateReelReportsPayload, "userId">) {
		const { page, reelId, take } = payload
		const where: Prisma.ReelReportWhereInput = {
			reelId
		}

		const [data, total] = await Promise.all([
			this.prisma.reelReport.findMany({
				where,
				take,
				include: {
					reporter: {
						select: {
							id: true,
							avatarUrl: true,
							username: true
						}
					}
				},
				skip: (page - 1) * take,
				orderBy: {
					createdAt: "desc"
				}
			}),
			this.getTotalBy(where)
		])

		return {
			data,
			total,
			maxPage: Math.ceil(total / take)
		}
	}

	getTotalBy(where: Prisma.ReelReportWhereInput) {
		return this.prisma.reelReport.count({ where })
	}
}
