import { Injectable } from "@nestjs/common"
import { Prisma } from "@prisma/client"
import {
	PaginateReelCommentPayload,
	PaginateReelCommentReplyPayload
} from "@root/_shared/types/reel"
import { PrismaService } from "../prisma.service"

@Injectable()
export class ReelCommentRepository {
	constructor(private prisma: PrismaService) {}

	create(
		data: Prisma.ReelCommentCreateInput,
		include?: Prisma.ReelCommentInclude
	) {
		return this.prisma.reelComment.create({ data, include })
	}

	findById(id: string) {
		return this.prisma.reelComment.findUnique({ where: { id } })
	}

	paginateByReelId(payload: PaginateReelCommentPayload) {
		const { page, take, reelId } = payload
		const skip = take * (page - 1)

		return this.prisma.reelComment.findMany({
			where: {
				reelId,
				parentId: null
			},
			include: {
				author: {
					select: {
						id: true,
						username: true,
						avatarUrl: true
					}
				},
				_count: true
			},
			orderBy: { createdAt: "desc" },
			skip,
			take
		})
	}

	paginateByParentId(payload: PaginateReelCommentReplyPayload) {
		const { page, take, parentId } = payload
		const skip = take * (page - 1)

		return this.prisma.reelComment.findMany({
			where: {
				parentId
			},
			include: {
				author: {
					select: {
						id: true,
						username: true,
						avatarUrl: true
					}
				},
				_count: true
			},
			orderBy: { createdAt: "desc" },
			skip,
			take
		})
	}

	getTotalByReelId(reelId: string) {
		return this.prisma.reelComment.count({ where: { reelId } })
	}

	getTotalByParentId(parentId: string) {
		return this.prisma.reelComment.count({ where: { parentId } })
	}
}
