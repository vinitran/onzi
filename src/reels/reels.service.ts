import {
	ForbiddenException,
	Injectable,
	InternalServerErrorException,
	NotFoundException
} from "@nestjs/common"
import { Reel, UserActionStatus } from "@prisma/client"
import { BlockUserRepository } from "@root/_database/repositories/block-user.repository"
import { ReelCommentRepository } from "@root/_database/repositories/reel-comment.repository"
import { ReelUserActionRepository } from "@root/_database/repositories/reel-user-action.repository"
import { ReelRepository } from "@root/_database/repositories/reel.repository"
import { TokenFavoriteRepository } from "@root/_database/repositories/token-favorite.repository"
import { TokenRepository } from "@root/_database/repositories/token.repository"
import { UserRepository } from "@root/_database/repositories/user.repository"
import {
	CreateReelPayload,
	GetDetailReelPayload,
	GetLatestReelPayload,
	PaginateListReelPayload,
	UpdateReelUserActionPayload
} from "@root/_shared/types/reel"
import { Paginate } from "@root/dtos/common.dto"
import { S3Service } from "@root/file/file.service"
import { DateTime } from "luxon"
import { v4 as uuidv4 } from "uuid"
import {
	PaginateListReelParams,
	PaginateReportedReelDto
} from "./dtos/payload.dto"

@Injectable()
export class ReelsService {
	constructor(
		private s3Service: S3Service,
		private token: TokenRepository,
		private tokenFavorite: TokenFavoriteRepository,
		private reel: ReelRepository,
		private reelUserAction: ReelUserActionRepository,
		private reelComment: ReelCommentRepository,
		private user: UserRepository,
		private blockUser: BlockUserRepository
	) {}

	// Validate user is block create reel
	async validateUserCreateReel(userId: string) {
		const block = await this.blockUser.findByType(userId, "CreateTokenReel")
		if (!block) return
		if (block.isPermanent) {
			throw new ForbiddenException("You are blocked to create reel")
		}
		const now = DateTime.now()
		// Skip if block is not expired
		if (!block.endAt) {
			await this.blockUser.deleteById(block.id)
			return
		}
		const endAt = DateTime.fromJSDate(block.endAt)
		if (endAt.diff(now).toMillis() > 0) {
			throw new ForbiddenException(
				`You are blocked to create reel until ${endAt.toFormat("yyyy-MM-dd HH:mm:ss")}`
			)
		}
		await this.blockUser.deleteById(block.id)
	}

	//   Create reel
	async create(payload: CreateReelPayload) {
		const { caption, tokenId, userId } = payload

		// Validate user is block create reel in global
		await this.validateUserCreateReel(userId)

		// Validate token
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

	//   Get detail reel in list reel of token
	async getDetailByToken(payload: GetDetailReelPayload) {
		const { reelId, userAddress, userId } = payload

		const reel = await this.reel.getDetail(reelId)
		if (!reel) throw new NotFoundException("Not found reel")

		const [prevReel, nextReel, totalComment, userActions] = await Promise.all([
			this.reel.getPrevInToken(reel),
			this.reel.getNextInToken(reel),
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
			},
			prevReelId: prevReel?.id || null,
			nextReelId: nextReel?.id || null
		}
	}

	// Get detail reel
	async getDetail(payload: GetDetailReelPayload) {
		const { reelId, userAddress, userId } = payload

		const reel = await this.reel.getDetail(reelId)
		if (!reel) throw new NotFoundException("Not found reel")

		const [prevReel, nextReel, totalComment, userActions] = await Promise.all([
			this.reel.getPrevByTime(reel),
			this.reel.getNextByTime(reel),
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
			},
			prevReelId: prevReel?.id || null,
			nextReelId: nextReel?.id || null
		}
	}

	//   Get latest detail reel
	async getLatest({ userAddress, userId }: GetLatestReelPayload) {
		const reel = await this.reel.getLatestByTime()

		if (!reel) throw new NotFoundException("Not found reel")

		return this.getDetail({ reelId: reel.id, userAddress, userId })
	}

	//   Increase view for a reel
	async updateView(reelId: string) {
		const reel = await this.reel.findById(reelId)
		if (!reel) throw new NotFoundException("Not found reel")
		return this.reel.increaseView(reelId)
	}

	//   Paginate all
	async paginate(payload: PaginateListReelParams) {
		return this.reel.paginate(payload)
	}

	//   Paginate reel in a token
	async paginateByToken(
		payload: PaginateListReelPayload
	): Promise<Paginate<Reel>> {
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
		await this.removeVideoS3(reel.videoUri)
	}

	async removeVideoS3(videoUri: string) {
		try {
			await this.s3Service.deleteFile(this.s3Service.getKeyS3(videoUri))
		} catch {}
	}

	async paginateReportedReels(payload: PaginateReportedReelDto) {
		const { take, text } = payload

		const [data, total] = await Promise.all([
			this.reel.paginateByReport(payload),
			this.reel.getTotal({
				caption: { contains: text },
				reelReports: { some: {} }
			})
		])

		return {
			data,
			total,
			maxPage: Math.ceil(total / take)
		}
	}

	//   Toggle pin reel by creator
	async togglePinReelByCreator(reelId: string, userId: string) {
		const reel = await this.reel.findById(reelId)
		if (!reel) throw new NotFoundException("Not found reel")

		if (reel.creatorId !== userId)
			throw new ForbiddenException("Not allow to pin reel")

		// Unpin reel
		if (reel.pinnedAt) {
			await this.reel.unpin(reelId)
			return "Unpin reel successfully"
		}

		// Pin reel
		const LIMIT_AMOUNT = 3
		const listPinnedReel = await this.reel.getListPin(reel.tokenId)
		if (listPinnedReel.length >= LIMIT_AMOUNT)
			throw new ForbiddenException(
				`You can only pin up to ${LIMIT_AMOUNT} reels`
			)

		const pinnedAt = DateTime.now().toJSDate()
		await this.reel.pin(reelId, pinnedAt)
		return "Pin reel successfully"
	}

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
