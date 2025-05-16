import {
	ForbiddenException,
	Injectable,
	InternalServerErrorException,
	NotFoundException
} from "@nestjs/common"
import { Prisma, Reel, UserActionStatus } from "@prisma/client"
import { ReelCommentActionRepository } from "@root/_database/repositories/reel-comment-action.repository"
import { ReelCommentReportRepository } from "@root/_database/repositories/reel-comment-report.repository"
import { ReelCommentRepository } from "@root/_database/repositories/reel-comment.repository"
import { ReelUserActionRepository } from "@root/_database/repositories/reel-user-action.repository"
import { ReelRepository } from "@root/_database/repositories/reel.repository"
import { TokenFavoriteRepository } from "@root/_database/repositories/token-favorite.repository"
import { TokenRepository } from "@root/_database/repositories/token.repository"
import { UserRepository } from "@root/_database/repositories/user.repository"
import {
	CreateCommentReelPayload,
	CreateReelPayload,
	PaginateListReelPayload,
	PaginateReelCommentPayload,
	PaginateReelCommentReplyPayload,
	UpdateReelCommentActionPayload,
	UpdateReelUserActionPayload
} from "@root/_shared/types/reel"
import { Paginate } from "@root/dtos/common.dto"
import { S3Service } from "@root/file/file.service"
import { v4 as uuidv4 } from "uuid"
import { CreateReelCommentReportDto } from "./dtos/payload.dto"

export type CreateReelCommentReportPayload = CreateReelCommentReportDto & {
	userId: string
	reelCommentId: string
}

export type GetDetailReelPayload = {
	reelId: string
	userId?: string
	userAddress?: string
}

@Injectable()
export class ReelsService {
	constructor(
		private s3Service: S3Service,
		private token: TokenRepository,
		private tokenFavorite: TokenFavoriteRepository,
		private reel: ReelRepository,
		private reelUserAction: ReelUserActionRepository,
		private reelComment: ReelCommentRepository,
		private reelCommentAction: ReelCommentActionRepository,
		private reelCommentReport: ReelCommentReportRepository,
		private user: UserRepository
	) {}

	//   Create reel
	async create(payload: CreateReelPayload) {
		const { caption, tokenId, userId } = payload

		const token = await this.token.findById(tokenId)

		if (!token) throw new NotFoundException("Not found token")
		if (token.creator.id !== userId)
			throw new ForbiddenException(
				"Only creator token just allow to create reel"
			)

		const reelId = uuidv4()
		const { fields, url, videoUri } = await this.getVideoPresignedUrl(reelId)
		const reel = await this.reel.create({
			caption,
			videoUri,
			creator: { connect: { id: userId } },
			token: { connect: { id: tokenId } }
		})

		return { reel, attachment: { fields, url } }
	}

	//   Get detail reel
	async getDetail(payload: GetDetailReelPayload) {
		const { reelId, userAddress, userId } = payload

		const reel = await this.reel.getDetail(reelId)
		if (!reel) throw new NotFoundException("Not found reel")

		const [totalComment, userActions] = await Promise.all([
			this.reelComment.getTotalByReelId(reelId),
			this.reelUserAction.getActionsByReelId(reelId)
		])

		const totalByAction = Object.values(UserActionStatus).reduce(
			(acc, action) => {
				const found = userActions.find(item => item.status === action)
				acc[action as UserActionStatus] = found?._count._all ?? 0
				return acc
			},
			{} as Record<UserActionStatus, number>
		)

		// User status with reel
		let isUserFavouriteToken = false
		let isUserLikeReel = false
		let isUserDislikeReel = false
		if (userId && userAddress) {
			const [favorite, userActionsOfUser] = await Promise.all([
				this.tokenFavorite.findOne({
					tokenAddress: reel.token.address,
					userAddress
				}),
				this.reelUserAction.getActionsOfUserByReelId(reelId, userId)
			])

			isUserFavouriteToken = !!favorite

			const userActionMap = userActionsOfUser.reduce(
				(acc, item) => {
					acc[item.status] = (item._count?._all ?? 0) > 0
					return acc
				},
				{} as Record<UserActionStatus, boolean>
			)

			isUserLikeReel = !!userActionMap.Like
			isUserDislikeReel = !!userActionMap.Dislike
		}

		return {
			...reel,
			totalComment,
			totalLike: totalByAction.Like,
			totalDislike: totalByAction.Dislike,
			userStatus: {
				isLikeReel: isUserLikeReel,
				isDislikeReel: isUserDislikeReel,
				isFavoriteToken: isUserFavouriteToken
			}
		}
	}

	//   Increase view for a reel
	async updateView(reelId: string) {
		const reel = await this.reel.findById(reelId)
		if (!reel) throw new NotFoundException("Not found reel")
		return this.reel.increaseView(reelId)
	}

	//   Paginate reel
	async paginate(payload: PaginateListReelPayload): Promise<Paginate<Reel>> {
		const { tokenId, take } = payload
		const [data, total] = await Promise.all([
			this.reel.paginateByTokenId(payload),
			this.reel.getTotalByTokenId(tokenId)
		])

		return {
			data,
			total,
			maxPage: Math.ceil(total / take)
		}
	}

	//   Toggle user's action with reel
	async updateUserAction(payload: UpdateReelUserActionPayload) {
		const { action, reelId, userId } = payload

		const reel = await this.reel.findById(reelId)
		if (!reel) throw new NotFoundException("Not found reel")

		const userAction = await this.reelUserAction.findOne({
			creatorId: userId,
			reelId
		})

		if (!userAction) {
			await this.reelUserAction.create({
				creator: { connect: { id: userId } },
				reel: { connect: reel },
				status: action
			})
			return `${action} reel successfully`
		}

		if (userAction.status === action) {
			await this.reelUserAction.deleteById(userAction.id)
			return `Remove ${action.toLowerCase()} reel successfully`
		}

		await this.reelUserAction.updateActionById(userAction.id, action)
		return `${action} reel successfully`
	}

	async destroy(reelId: string, userId: string) {
		const user = await this.user.findById(userId)
		if (!user) throw new NotFoundException("Not found user")
		const reel = await this.reel.findById(reelId)
		if (!reel) throw new NotFoundException("Not found reel")

		if (reel.creatorId !== userId && user.role !== "Admin")
			throw new ForbiddenException("Not allow to delete reel")

		await this.reel.delete(reelId)
	}

	// ===========================

	/* Reel comment */
	//   Create comment
	async createComment(payload: CreateCommentReelPayload) {
		const { content, reelId, userId, parentId } = payload

		const reel = await this.reel.findById(reelId)
		if (!reel) throw new NotFoundException("Not found reel")

		const commentData: Prisma.ReelCommentCreateInput = {
			content,
			reel: { connect: reel },
			author: { connect: { id: userId } }
		}

		// Case reply comment
		if (parentId) {
			const parentComment = await this.reelComment.findById(parentId)
			if (!parentComment)
				throw new NotFoundException("Not found comment to reply")
			commentData.parent = { connect: parentComment }
		}

		const data = this.reelComment.create(commentData, {
			author: { select: { id: true, username: true, avatarUrl: true } }
		})
		return data
	}

	//   Toggle user's action with comment in reel
	async updateReelCommentAction(payload: UpdateReelCommentActionPayload) {
		const { action, commentId, userId } = payload

		const comment = await this.reelComment.findById(commentId)
		if (!comment) throw new NotFoundException("Not found comment")

		const userAction = await this.reelCommentAction.findOne({
			creatorId: userId,
			reelCommentId: commentId
		})

		if (!userAction) {
			await this.reelCommentAction.create({
				creator: { connect: { id: userId } },
				reelComment: { connect: comment },
				status: action
			})
			return `${action} reel successfully`
		}

		if (userAction.status === action) {
			await this.reelCommentAction.deleteById(userAction.id)
			return `Remove ${action.toLowerCase()} reel successfully`
		}

		await this.reelCommentAction.updateActionById(userAction.id, action)
		return `${action} reel successfully`
	}

	// Paginate comment in  reel (exlucde replies)
	async paginateComment(payload: PaginateReelCommentPayload) {
		const { reelId, take, userId } = payload
		const [listComment, total] = await Promise.all([
			this.reelComment.paginateByReelId(payload),
			this.reelComment.getTotalByReelId(reelId)
		])

		const data = await Promise.all(
			listComment.map(async comment => {
				const {
					id,
					_count: { replies: totalReply }
				} = comment
				let isUserLiked = false
				let isUserDisLiked = false

				const [totalLike, totalDislike] = await Promise.all([
					this.reelCommentAction.getTotalLikeByCommentId(id),
					this.reelCommentAction.getTotalDisLikeByCommentId(id)
				])

				if (userId) {
					const [userDislike, userLike] = await Promise.all([
						this.reelCommentAction.findOne({
							creatorId: userId,
							reelCommentId: id,
							status: "Dislike"
						}),
						this.reelCommentAction.findOne({
							creatorId: userId,
							reelCommentId: id,
							status: "Like"
						})
					])

					isUserDisLiked = !!userDislike
					isUserLiked = !!userLike
				}

				return {
					...comment,
					totalLike,
					totalDislike,
					totalReply,
					isUserLiked,
					isUserDisLiked
				}
			})
		)

		return {
			data,
			total,
			maxPage: Math.ceil(total / take)
		}
	}

	// Paginate comment reply in a parent comment
	async paginateCommentReply(payload: PaginateReelCommentReplyPayload) {
		const { parentId, take, userId } = payload

		const [listComment, total] = await Promise.all([
			this.reelComment.paginateByParentId(payload),
			this.reelComment.getTotalByParentId(parentId)
		])

		const data = await Promise.all(
			listComment.map(async comment => {
				const {
					id,
					_count: { replies: totalReply }
				} = comment
				let isUserLiked = false
				let isUserDisLiked = false

				const [totalLike, totalDislike] = await Promise.all([
					this.reelCommentAction.getTotalLikeByCommentId(id),
					this.reelCommentAction.getTotalDisLikeByCommentId(id)
				])

				if (userId) {
					const [userDislike, userLike] = await Promise.all([
						this.reelCommentAction.findOne({
							creatorId: userId,
							reelCommentId: id,
							status: "Dislike"
						}),
						this.reelCommentAction.findOne({
							creatorId: userId,
							reelCommentId: id,
							status: "Like"
						})
					])

					isUserDisLiked = !!userDislike
					isUserLiked = !!userLike
				}

				return {
					...comment,
					totalLike,
					totalDislike,
					totalReply,
					isUserLiked,
					isUserDisLiked
				}
			})
		)

		return {
			data,
			total,
			maxPage: Math.ceil(total / take)
		}
	}

	// Report comment
	async reportComment(payload: CreateReelCommentReportPayload) {
		const { reelCommentId, description, userId } = payload

		const reelComment = await this.reelComment.findById(reelCommentId)
		if (!reelComment) throw new NotFoundException("Not found comment in reel")

		return this.reelCommentReport.create({
			reelComment: { connect: reelComment },
			reporter: { connect: { id: userId } },
			description
		})
	}

	//   Get list report in a comment
	async getListCommentReport(commentId: string) {
		return this.reelCommentReport.findByReelCommentId(commentId)
	}

	//   Get video url & authorize data to push video Aws3
	async getVideoPresignedUrl(reelId: string) {
		const key = `token-reel-${reelId}`
		const { fields, url } = await this.s3Service.postPresignedSignedUrl(
			key,
			"video/mp4"
		)
		if (!url || !fields)
			throw new InternalServerErrorException("Can not post presigned url")
		const videoUri = `${url}${fields.key}`
		return {
			videoUri,
			url,
			fields
		}
	}
}
