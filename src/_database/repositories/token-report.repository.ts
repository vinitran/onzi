import { Injectable } from "@nestjs/common"
import { Prisma } from "@prisma/client"
import { PrismaService } from "../prisma.service"

@Injectable()
export class TokenReportRepository {
	constructor(private prisma: PrismaService) {}

	findById(id: string) {
		return this.prisma.tokenReport.findUnique({
			where: { id }
		})
	}

	findLatestByUser(tokenAddress: string, reporterId: string) {
		return this.prisma.tokenReport.findFirst({
			where: { tokenAddress, reporterId },
			orderBy: { createdAt: "desc" }
		})
	}

	create(data: Prisma.TokenReportCreateInput) {
		return this.prisma.tokenReport.create({
			data
		})
	}
}
