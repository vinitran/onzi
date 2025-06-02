import { Injectable } from "@nestjs/common"
import { Comment, Prisma } from "@prisma/client"
import { PaginatedParams } from "@root/dtos/common.dto"
import { PrismaService } from "../prisma.service"

@Injectable()
export class CommentRepository {
	constructor(private prisma: PrismaService) {}

	// Create
	create(data: Prisma.CommentCreateInput) {
		return this.prisma.comment.create({
			data,
			include: {
				author: {
					select: { id: true, address: true, avatarUrl: true, username: true }
				},
				sticker: { select: { id: true, uri: true } }
			}
		})
	}

	// Update
	update(commentId: string, data: Prisma.CommentUpdateInput) {
		return this.prisma.comment.update({
			data,
			where: { id: commentId },
			include: {
				author: {
					select: { id: true, address: true, avatarUrl: true, username: true }
				},
				sticker: { select: { id: true, uri: true } }
			}
		})
	}

	// Find by id
	findById(id: string) {
		return this.prisma.comment.findUnique({
			where: { id },
			include: { likes: true }
		})
	}

	getDetailWithTokenById(id: string) {
		return this.prisma.comment.findUnique({
			where: { id },
			include: { token: true }
		})
	}

	// Like
	like(commentId: string, userId: string) {
		return this.prisma.comment.update({
			where: { id: commentId },
			data: {
				likes: {
					create: { userId }
				}
			}
		})
	}

	// Unlike
	unlike(commentId: string, userId: string) {
		return this.prisma.comment.update({
			where: { id: commentId },
			data: {
				likes: {
					delete: { userId_commentId: { userId, commentId } }
				}
			}
		})
	}

	// Reply comment
	reply(data: Prisma.CommentCreateInput) {
		return this.prisma.comment.create({
			data,
			include: {
				author: {
					select: { id: true, address: true, avatarUrl: true, username: true }
				}
			}
		})
	}

	// Paginate
	paginate(query: Prisma.CommentFindManyArgs) {
		return this.prisma.comment.findMany({
			...query,
			include: {
				author: {
					select: { id: true, address: true, avatarUrl: true, username: true }
				},
				sticker: {
					select: { id: true, uri: true }
				}
			}
		})
	}

	// Count total like
	countLike(commentId: string) {
		return this.prisma.commentLike.count({ where: { commentId } })
	}

	// Count total reply
	countReply(commentId: string) {
		return this.prisma.comment.count({ where: { parentId: commentId } })
	}

	// Count
	countByTokenId(query?: Prisma.CommentCountArgs) {
		return this.prisma.comment.count({ ...query })
	}

	// Check like
	isLiked(commentId: string, userId: string) {
		return this.prisma.commentLike.findUnique({
			where: { userId_commentId: { userId, commentId } }
		})
	}

	getTotalByTokenId(tokenId: string) {
		return this.prisma.comment.count({
			where: { tokenId }
		})
	}

	async findReplyByUserId(userId: string, query: PaginatedParams) {
		const { page, take } = query

		const where: Prisma.CommentWhereInput = {
			parentId: {
				not: null
			},
			authorId: userId
		}

		const getTotal = this.prisma.comment.count({
			where
		})

		const getReplies = this.prisma.comment.findMany({
			where,
			skip: (page - 1) * take,
			take
		})

		const [total, replies] = await Promise.all([getTotal, getReplies])

		return {
			total,
			maxPage: Math.ceil(total / take),
			replies
		}
	}

	findMany(query: Prisma.CommentFindManyArgs) {
		return this.prisma.comment.findMany({
			...query,
			include: {
				author: {
					select: { id: true, address: true, avatarUrl: true, username: true }
				},
				sticker: {
					select: { id: true, uri: true }
				}
			}
		})
	}

	//   Find distinct comments with created_at with range time
	findDistinctWithCreatedAt(
		tokenId: string,
		startDate: string | null,
		endEnDate: string | null
	): Promise<Comment[]> {
		return this.prisma.$queryRaw<Comment[]>`
		SELECT DISTINCT ON (Date(created_at)) *
		FROM "comment"
		WHERE "token_id" = ${tokenId}::uuid 
		AND "parent_id" IS NULL
		AND "created_at" BETWEEN ${startDate}::timestamptz AND ${endEnDate}::timestamptz
		ORDER BY Date(created_at) DESC, "created_at" ASC
	`
	}

	deleteById(id: string) {
		return this.prisma.comment.delete({ where: { id } })
	}

	deleteByAuthorId(authorId: string) {
		return this.prisma.comment.deleteMany({ where: { authorId } })
	}
}
