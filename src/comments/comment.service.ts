import {
	ForbiddenException,
	Injectable,
	InternalServerErrorException,
	NotFoundException
} from "@nestjs/common"
import { Prisma } from "@prisma/client"
import { CommentRepository } from "@root/_database/repositories/comment.repository"
import { StickerOwnerRepository } from "@root/_database/repositories/sticker-owner.repository"
import { TokenRepository } from "@root/_database/repositories/token.repository"
import {
	ICreateComment,
	ICreateCommentResponse,
	IPaginateComments,
	IPaginateReplies,
	IReplyComment
} from "@root/_shared/types/comment"
import { S3Service } from "@root/file/file.service"

@Injectable()
export class CommentService {
	constructor(
		private comment: CommentRepository,
		private token: TokenRepository,
		private stickerOwner: StickerOwnerRepository,
		private s3Service: S3Service
	) {}

	// Create comment
	async createComment(
		payload: ICreateComment
	): Promise<ICreateCommentResponse> {
		const {
			content,
			tokenId,
			userId,
			contentType,
			isContainAttachment,
			stickerId
		} = payload
		const token = await this.token.findById(payload.tokenId)

		if (!token) {
			throw new NotFoundException("Token not found")
		}

		if (stickerId) {
			const isOwnedSticker = await this.stickerOwner.findOneByOwnerId({
				userId,
				stickerId
			})
			if (!isOwnedSticker) {
				throw new ForbiddenException("Sticker have not owned")
			}
		}

		let comment = await this.comment.create({
			author: { connect: { id: userId } },
			token: { connect: { id: tokenId } },
			content,
			...(stickerId ? { sticker: { connect: { id: stickerId } } } : {})
		})

		// Comment has attachment (image)
		if (isContainAttachment && contentType) {
			const { attachmentUrl, fields, url } =
				await this.getAttachmentPresignedUrl({
					commentId: comment.id,
					userId,
					contentType
				})
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
		const { commentId, content, userId, contentType, isContainAttachment } =
			payload
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

		if (isContainAttachment && contentType) {
			const { attachmentUrl, fields, url } =
				await this.getAttachmentPresignedUrl({
					commentId: comment.id,
					userId,
					contentType
				})
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

	// get comments.dtos.ts
	async getComments(payload: IPaginateComments) {
		const { tokenId, userId, page, take, sortCreatedAt } = payload

		// Get data & total
		// Only get comment level 1
		// Only get comment NOT pinned
		const whereConditions: Prisma.CommentWhereInput = {
			tokenId,
			parentId: { equals: null },
			isPinned: false
		}

		const getComments = this.comment.paginate({
			skip: (page - 1) * take,
			orderBy: { createdAt: sortCreatedAt },
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

	//   Get list pinned comment
	async getPinnedComment(payload: { userId: string; tokenId: string }) {
		const { tokenId, userId } = payload
		const whereConditions: Prisma.CommentWhereInput = {
			tokenId,
			parentId: { equals: null },
			isPinned: true
		}
		const listPinnedComment = await this.comment.findMany({
			where: whereConditions,
			orderBy: { createdAt: "desc" }
		})

		const data = await Promise.all(
			listPinnedComment.map(async comment => {
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
		return data
	}

	// Pin comment
	async togglePinComment(payload: { userId: string; commentId: string }) {
		const { commentId, userId } = payload
		const comment = await this.comment.findById(commentId)
		if (!comment) throw new NotFoundException("Comment not found")
		const token = await this.token.findById(comment.tokenId, { creator: true })
		if (!token) throw new NotFoundException("Token not found")

		// Only creator token have permission to pin comment
		if (token.creator.id !== userId)
			throw new ForbiddenException(
				"Only token creator just has permision to pin"
			)

		return this.comment.update(commentId, { isPinned: !comment.isPinned })
	}

	// Paginate replies
	async getReplies(payload: IPaginateReplies) {
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
		contentType: string
	}) {
		const { commentId, userId, contentType } = payload
		const key = `comment-${commentId}-${userId}`
		const { fields, url } = await this.s3Service.postPresignedSignedUrl(
			key,
			contentType
		)
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
