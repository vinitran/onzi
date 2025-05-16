import { Injectable } from "@nestjs/common"
import { Prisma } from "@prisma/client"
import { PrismaService } from "../prisma.service"

@Injectable()
export class ReelCommentReportRepository {
	constructor(private prisma: PrismaService) {}

	create(data: Prisma.ReelCommentReportCreateInput) {
		return this.prisma.reelCommentReport.create({ data })
	}

	findByReelCommentId(reelCommentId: string) {
		return this.prisma.reelCommentReport.findMany({
			where: {
				reelCommentId
			},
			include: {
				reporter: {
					select: {
						id: true,
						username: true,
						avatarUrl: true
					}
				}
			}
		})
	}
}
