import {
	Injectable,
	InternalServerErrorException,
	NotFoundException
} from "@nestjs/common"
import { Prisma } from "@prisma/client"
import { CommentRepository } from "@root/_database/repositories/comment.repository"
import { TokenRepository } from "@root/_database/repositories/token.repository"
import {
	ICreateComment,
	ICreateCommentResponse,
	IPaginateComments,
	IPaginateCommentsData,
	IPaginateReplies,
	IReplyComment
} from "@root/_shared/types/comment"
import { PaginatedResponse } from "@root/_shared/utils/parsers"
import { S3Service } from "@root/file/file.service"

@Injectable()
export class CommentService {
	constructor(
		private comment: CommentRepository,
		private token: TokenRepository,
		private s3Service: S3Service
	) {}

	// Create comment
	async createComment(
		payload: ICreateComment
	): Promise<ICreateCommentResponse> {
		const { content, tokenId, userId, isContainAttachment } = payload
		const token = await this.token.findById(payload.tokenId)

		if (!token) {
			throw new NotFoundException("Token not found")
		}

		let comment = await this.comment.create({
			author: { connect: { id: userId } },
			token: { connect: { id: tokenId } },
			content
		})

		// Comment has attachment (image)
		if (isContainAttachment) {
			const { attachmentUrl, fields, url } =
				await this.getAttachmentPresignedUrl({ commentId: comment.id, userId })
			comment = await this.comment.update(comment.id, {
				attachmentUrl: attachmentUrl
			})
			return {
				comment,
				attachment: { fields, url }
			}
		}
		return { comment }
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
		const { commentId, content, userId, isContainAttachment } = payload
		const parentComment = await this.comment.findById(commentId)
		if (!parentComment) {
			throw new NotFoundException("Comment not found")
		}

		let comment = await this.comment.reply({
			author: { connect: { id: userId } },
			parent: { connect: { id: commentId } },
			token: { connect: { id: parentComment.tokenId } },
			content
		})

		if (isContainAttachment) {
			const { attachmentUrl, fields, url } =
				await this.getAttachmentPresignedUrl({ commentId: comment.id, userId })
			comment = await this.comment.update(comment.id, {
				attachmentUrl: attachmentUrl
			})
			return {
				comment,
				attachment: { fields, url }
			}
		}

		return {
			comment
		}
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

	/** Get data to client upload file to aws3
	 * attachmentUrl: url image for comment
	 * url: url of aws3
	 * fields: data for client to upload file
	 */
	async getAttachmentPresignedUrl(payload: {
		userId: string
		commentId: string
	}) {
		const { commentId, userId } = payload
		const key = `comment-${commentId}-${userId}`
		const { fields, url } = await this.s3Service.postPresignedSignedUrl(key)
		if (!url || !fields)
			throw new InternalServerErrorException("Can not post presigned url")
		const attachmentUrl = `${url}${key}`
		return {
			attachmentUrl,
			url,
			fields
		}
	}
}
