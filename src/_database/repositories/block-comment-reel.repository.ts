import { Injectable } from "@nestjs/common"
import { Prisma } from "@prisma/client"
import { PrismaService } from "../prisma.service"

@Injectable()
export class BlockReelCommentRepository {
	constructor(private prisma: PrismaService) {}

	create(data: Prisma.BlockReelCommentCreateInput) {
		return this.prisma.blockReelComment.create({ data })
	}

	findOne({ reelId, userId }: { reelId: string; userId: string }) {
		return this.prisma.blockReelComment.findUnique({
			where: {
				reelId_userId: {
					reelId,
					userId
				}
			}
		})
	}

	delete({ reelId, userId }: { reelId: string; userId: string }) {
		return this.prisma.blockReelComment.delete({
			where: {
				reelId_userId: {
					reelId,
					userId
				}
			}
		})
	}
}
