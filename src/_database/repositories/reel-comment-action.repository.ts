import { Injectable } from "@nestjs/common"
import { Prisma, UserActionStatus } from "@prisma/client"
import { PrismaService } from "../prisma.service"

@Injectable()
export class ReelCommentActionRepository {
	constructor(private prisma: PrismaService) {}

	create(payload: Prisma.ReelCommentActionCreateInput) {
		return this.prisma.reelCommentAction.create({ data: payload })
	}

	findOne(where: Prisma.ReelCommentActionWhereInput) {
		return this.prisma.reelCommentAction.findFirst({
			where
		})
	}

	getTotalLikeByCommentId(reelCommentId: string) {
		return this.prisma.reelCommentAction.count({
			where: {
				reelCommentId,
				status: "Like"
			}
		})
	}

	getTotalDisLikeByCommentId(reelCommentId: string) {
		return this.prisma.reelCommentAction.count({
			where: {
				reelCommentId,
				status: "Dislike"
			}
		})
	}

	updateActionById(id: string, action: UserActionStatus) {
		return this.prisma.reelCommentAction.update({
			where: {
				id
			},
			data: {
				status: action
			}
		})
	}

	deleteById(id: string) {
		return this.prisma.reelCommentAction.delete({
			where: { id }
		})
	}
}
