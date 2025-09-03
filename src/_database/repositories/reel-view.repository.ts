import { Injectable } from "@nestjs/common"
import { PrismaService } from "../prisma.service"

@Injectable()
export class ReelViewRepository {
	constructor(private prisma: PrismaService) {}

	checkViewed(reelId: string, viewerId: string) {
		return this.prisma.reelView.findFirst({
			where: {
				reelId,
				viewerId
			}
		})
	}

	create(reelId: string, viewerId: string) {
		return this.prisma.reelView.create({
			data: {
				reelId,
				viewerId
			}
		})
	}
}
