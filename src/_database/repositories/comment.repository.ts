import { Injectable } from "@nestjs/common"
import { Prisma } from "@prisma/client"
import { PaginatedParams } from "@root/_shared/utils/parsers"
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
				}
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
				}
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

	async findReplyByUserId(userId: string, query: PaginatedParams) {
		const { page, take } = query

		const getTotal = this.prisma.comment.count({
			where: {
				parentId: {
					not: null
				},
				authorId: userId
			}
		})

		const getReplies = this.prisma.comment.findMany({
			where: {
				parentId: {
					not: null
				},
				authorId: userId
			},
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
}
