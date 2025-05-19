import {
	ForbiddenException,
	Injectable,
	NotFoundException
} from "@nestjs/common"
import { Prisma } from "@prisma/client"
import { ReelCommentActionRepository } from "@root/_database/repositories/reel-comment-action.repository"
import { ReelCommentReportRepository } from "@root/_database/repositories/reel-comment-report.repository"
import { ReelCommentRepository } from "@root/_database/repositories/reel-comment.repository"
import { ReelRepository } from "@root/_database/repositories/reel.repository"
import { UserRepository } from "@root/_database/repositories/user.repository"
import {
	CreateCommentReelPayload,
	CreateReelCommentReportPayload,
	PaginateReelCommentPayload,
	PaginateReelCommentReplyPayload,
	UpdateReelCommentActionPayload
} from "@root/_shared/types/reel"
import { PaginateReportedReelCommentDto } from "./dtos/payload.dto"

export type PaginateReportedReelCommentPayload =
	PaginateReportedReelCommentDto & {
		reelId: string
		userId: string
	}

@Injectable()
export class ReelCommentsService {
	constructor(
		private reelComment: ReelCommentRepository,
		private reel: ReelRepository,
		private reelCommentAction: ReelCommentActionRepository,
		private reelCommentReport: ReelCommentReportRepository,
		private user: UserRepository
	) {}

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

	async getListCommentReport(commentId: string, userId: string) {
		const reelComment = await this.reelComment.findById(commentId)
		if (!reelComment) throw new NotFoundException("Not found reel comment")

		const [reel, user] = await Promise.all([
			this.reel.findById(reelComment.reelId),
			this.user.findById(userId)
		])
		if (!user) throw new NotFoundException("Not found user")

		if (reel?.creatorId !== user.id && user.role !== "Admin")
			throw new ForbiddenException("Only author or admin just allow to view")

		return this.reelCommentReport.findByReelCommentId(commentId)
	}

	//   Delete reel comment
	async deleteReelComment(reelCommentId: string, userId: string) {
		const reelComment = await this.reelComment.findById(reelCommentId)

		if (!reelComment) throw new NotFoundException("Not found reel comment")

		const user = await this.user.findById(userId)
		if (!user) throw new NotFoundException("Not found user")

		if (reelComment.authorId !== user.id && user.role !== "Admin")
			throw new ForbiddenException(
				"Only author or admin just allow to delete comment"
			)

		await this.reelComment.delete(reelCommentId)
	}

	// Paginate reported comments
	async paginateReportedComments(payload: PaginateReportedReelCommentPayload) {
		const { reelId, userId } = payload
		const reel = await this.reel.findById(reelId)

		if (!reel) throw new NotFoundException("Not found reel")

		const user = await this.user.findById(userId)

		if (!user) throw new NotFoundException("Not found user")

		if (reel.creatorId !== userId && user.role !== "Admin")
			throw new ForbiddenException("Only admin or creator just allow to view")

		return this.reelComment.paginateReported(payload)
	}
}
