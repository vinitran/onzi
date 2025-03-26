import { Injectable, NotFoundException } from "@nestjs/common"
import { Prisma } from "@prisma/client"
import { CommentRepository } from "@root/_database/repositories/comment.repository"
import { TokenRepository } from "@root/_database/repositories/token.repository"
import {
	ICreateComment,
	IPaginateComments,
	IPaginateCommentsData,
	IPaginateReplies,
	IReplyComment
} from "@root/_shared/types/comment"
import { PaginatedResponse } from "@root/_shared/utils/parsers"

@Injectable()
export class CommentService {
	constructor(
		private comment: CommentRepository,
		private token: TokenRepository
	) {}

	// Create comment
	async createComment(payload: ICreateComment) {
		const { content, tokenId, userId } = payload
		const token = await this.token.findById(payload.tokenId)

		if (!token) {
			throw new NotFoundException("Token not found")
		}

		return this.comment.create({
			author: { connect: { id: userId } },
			token: { connect: { id: tokenId } },
			content
		})
	}

	// Toggle like
	async toggleLike(commentId: string, userId: string) {
		const comment = await this.comment.findById(commentId)

		if (!comment) {
			throw new NotFoundException("Comment not found")
		}

		const isLiked = comment.likes.some(like => like.userId === userId)

		if (isLiked) {
			return this.comment.unlike(commentId, userId)
		}

		return this.comment.like(commentId, userId)
	}

	// Reply comment
	async replyComment(payload: IReplyComment & { commentId: string }) {
		const { commentId, content, userId } = payload
		const comment = await this.comment.findById(commentId)
		if (!comment) {
			throw new NotFoundException("Comment not found")
		}

		return this.comment.reply({
			author: { connect: { id: userId } },
			parent: { connect: { id: commentId } },
			token: { connect: { id: comment.tokenId } },
			content
		})
	}

	// Paginate comments
	async paginateComments(
		payload: IPaginateComments
	): Promise<PaginatedResponse<IPaginateCommentsData>> {
		const { tokenId, userId, page, take } = payload

		// Get data & total
		// Only get comment level 1
		const whereConditions: Prisma.CommentWhereInput = {
			tokenId,
			parentId: { equals: null }
		}

		const getComments = this.comment.paginate({
			skip: (page - 1) * take,
			orderBy: { createdAt: "desc" },
			where: whereConditions,
			take
		})
		const getTotal = this.comment.countByTokenId({ where: whereConditions })
		const [comments, total] = await Promise.all([getComments, getTotal])

		// Format data
		const data = await Promise.all(
			comments.map(async comment => {
				const [userLiked, totalLike, totalReply] = await Promise.all([
					this.comment.isLiked(comment.id, userId),
					this.comment.countLike(comment.id),
					this.comment.countReply(comment.id)
				])
				return {
					...comment,
					totalLike,
					totalReply,
					isLiked: !!userLiked
				}
			})
		)

		return {
			total,
			maxPage: Math.ceil(total / take),
			data
		}
	}

	// Paginate replies
	async paginateReplies(payload: IPaginateReplies) {
		const { page, take, parentId, userId } = payload
		// Get data & total
		// Get comment by its parent
		const whereConditions: Prisma.CommentWhereInput = {
			parentId
		}

		const getComments = this.comment.paginate({
			skip: (page - 1) * take,
			orderBy: { createdAt: "desc" },
			where: whereConditions,
			take
		})
		const getTotal = this.comment.countByTokenId({ where: whereConditions })
		const [comments, total] = await Promise.all([getComments, getTotal])
		// Format data
		const data = await Promise.all(
			comments.map(async comment => {
				const [userLiked, totalLike, totalReply] = await Promise.all([
					this.comment.isLiked(comment.id, userId),
					this.comment.countLike(comment.id),
					this.comment.countReply(comment.id)
				])
				return {
					...comment,
					totalLike,
					totalReply,
					isLiked: !!userLiked
				}
			})
		)

		return {
			total,
			maxPage: Math.ceil(total / take),
			data
		}
	}
}
