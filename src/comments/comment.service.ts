import {
	ForbiddenException,
	Injectable,
	InternalServerErrorException,
	NotFoundException
} from "@nestjs/common"
import { Prisma } from "@prisma/client"
import { BlockCommentRepository } from "@root/_database/repositories/block-comment.repository"
import { BlockUserRepository } from "@root/_database/repositories/block-user.repository"
import { CommentRepository } from "@root/_database/repositories/comment.repository"
import { StickerOwnerRepository } from "@root/_database/repositories/sticker-owner.repository"
import { TokenRepository } from "@root/_database/repositories/token.repository"
import { UserRepository } from "@root/_database/repositories/user.repository"
import {
	DeleteAllCommentFromUserByCreatorTokenPayload,
	DeleteCommentByCreatorTokenPayload,
	GetPinnedCommentPayload,
	ICreateComment,
	ICreateCommentResponse,
	IPaginateComments,
	IPaginateReplies,
	IReplyComment,
	ToggleBlockUserCommentPayload,
	TogglePinCommentPayload
} from "@root/_shared/types/comment"
import { S3Service } from "@root/file/file.service"
import { DateTime } from "luxon"

@Injectable()
export class CommentService {
	constructor(
		private comment: CommentRepository,
		private token: TokenRepository,
		private stickerOwner: StickerOwnerRepository,
		private blockComment: BlockCommentRepository,
		private user: UserRepository,
		private blockUser: BlockUserRepository,
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
			throw new NotFoundException("Not found token")
		}

		const user = await this.user.findById(userId)
		if (!user) throw new ForbiddenException("User is blocked global chat")

		// Validate status BLOCK global of user
		const isBlockedGlobal = await this.blockUser.isBlockedPermanentUserBy(
			userId,
			"CreateTokenComment"
		)
		if (isBlockedGlobal) {
			throw new ForbiddenException("User is blocked global chat")
		}

		// Validate block in specific token
		const isBlocked = !!(await this.blockComment.findOne({ tokenId, userId }))

		if (isBlocked)
			throw new ForbiddenException(
				"Blocked user is not allowed to create comment"
			)

		if (stickerId) {
			const isOwnedSticker = await this.stickerOwner.findOneByOwnerId({
				userId,
				stickerId
			})
			if (!isOwnedSticker) {
				throw new ForbiddenException("Sticker has not ever owned")
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
			throw new NotFoundException("Not found comment")
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
			throw new NotFoundException("Not found comment")
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
		const { tokenId, page, take, sortCreatedAt } = payload

		// Get data & total
		// Only get comment level 1
		const whereConditions: Prisma.CommentWhereInput = {
			tokenId,
			parentId: { equals: null }
		}

		const getComments = this.comment.paginate({
			skip: (page - 1) * take,
			orderBy: { createdAt: sortCreatedAt },
			where: whereConditions,
			take
		})
		const getTotal = this.comment.countByTokenId({ where: whereConditions })
		const [comments, total] = await Promise.all([getComments, getTotal])

		// Get list comment distinct by createdAt with unique start date
		const listDistinctCreatedAt = [
			...new Set(
				comments.map(comment =>
					DateTime.fromJSDate(comment.createdAt).startOf("day").toISO()
				)
			)
		].filter(date => date !== null)

		const minDistinctCreatedAt = DateTime.fromMillis(
			Math.min(...listDistinctCreatedAt.map(date => Date.parse(date)))
		).toISO()

		const maxDistinctCreatedAt = DateTime.fromMillis(
			Math.max(...listDistinctCreatedAt.map(date => Date.parse(date)))
		)
			.endOf("day")
			.toISO()

		//   List comment distinct by createdAt from MIN to MAX
		const listCommentDistinctByCreatedAt =
			await this.comment.findDistinctWithCreatedAt(
				tokenId,
				minDistinctCreatedAt,
				maxDistinctCreatedAt
			)

		// Format data
		const data = comments.map(comment => {
			return {
				...comment,
				isFirstOfDay: listCommentDistinctByCreatedAt.some(
					item => item.id === comment.id
				)
			}
		})

		return {
			total,
			maxPage: Math.ceil(total / take),
			data
		}
	}

	//   Get list pinned comment
	async getPinnedComment(payload: GetPinnedCommentPayload) {
		const { tokenId, userId } = payload
		const whereConditions: Prisma.CommentWhereInput = {
			tokenId,
			parentId: { equals: null },
			pinnedAt: { not: null }
		}
		const listPinnedComment = await this.comment.findMany({
			where: whereConditions,
			orderBy: { pinnedAt: "desc" }
		})

		const data = await Promise.all(
			listPinnedComment.map(async comment => {
				const [userLiked, totalLike, totalReply] = await Promise.all([
					userId
						? this.comment.isLiked(comment.id, userId)
						: Promise.resolve(null),
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
	async togglePinComment(payload: TogglePinCommentPayload) {
		const { commentId, userId } = payload
		const comment = await this.comment.findById(commentId)
		if (!comment) throw new NotFoundException("Not found comment")
		const token = await this.token.findById(comment.tokenId, { creator: true })
		if (!token) throw new NotFoundException("Not found token")

		// Only creator token have permission to pin comment
		if (token.creator.id !== userId)
			throw new ForbiddenException(
				"Only token creator just has permision to pin"
			)

		return this.comment.update(commentId, {
			pinnedAt: comment.pinnedAt ? null : DateTime.now().toJSDate()
		})
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
					userId
						? this.comment.isLiked(comment.id, userId)
						: Promise.resolve(null),
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

	// Delete comment by creator token
	async deleteComment(payload: DeleteCommentByCreatorTokenPayload) {
		const { commentId, creatorAddress } = payload
		const comment = await this.comment.getDetailWithTokenById(commentId)
		if (!comment) throw new NotFoundException("Not found comment")

		const user = await this.user.findByAddress(creatorAddress)
		if (!user) throw new NotFoundException("Not found user")

		if (
			comment.token.creatorAddress !== creatorAddress &&
			user.role !== "Admin"
		)
			throw new ForbiddenException(
				"Only creator token or admin just allow to delete"
			)

		await this.comment.deleteById(commentId)
	}

	//   Delete list comment from user by creator token
	async deleteAllCommentFromUser(
		payload: DeleteAllCommentFromUserByCreatorTokenPayload
	) {
		const { authorId, creatorAddress, tokenId } = payload

		const token = await this.token.findById(tokenId)
		if (!token) throw new NotFoundException("Not found token")

		const user = await this.user.findByAddress(creatorAddress)
		if (!user) throw new NotFoundException("Not found user")

		if (token.creatorAddress !== creatorAddress && user.role !== "Admin")
			throw new ForbiddenException(
				"Only creator token or admin just allow to delete"
			)

		await this.comment.deleteByAuthorId(authorId)
	}

	// Toggle Block user comment by creator token
	async toggleBlock(payload: ToggleBlockUserCommentPayload) {
		const { tokenId, userId, creatorAddress } = payload

		const token = await this.token.findById(tokenId)
		if (!token) throw new NotFoundException("Not found token")
		if (token.creatorAddress !== creatorAddress)
			throw new ForbiddenException(
				"Only creator token just allow to (un)block user"
			)

		const blockedUser = await this.blockComment.findOne({ tokenId, userId })

		if (blockedUser) {
			await this.blockComment.delete({ tokenId, userId })
		} else {
			await this.blockComment.create({
				token: { connect: { id: tokenId } },
				user: { connect: { id: userId } }
			})
		}
	}

	// Get all blocked user comment in token
	async getAllBlockedUserComment(tokenId: string) {
		return this.blockComment.getAllByTokenId(tokenId)
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
