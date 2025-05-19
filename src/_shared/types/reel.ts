import {
	CreateReelCommentDto,
	CreateReelCommentReportDto,
	PaginateReelCommentDto
} from "@root/reel-comments/dtos/payload.dto"
import {
	CreateReelDto,
	CreateReelReportDto,
	PaginateListReelParams,
	PaginateReelCommenReplytDto,
	PaginateReelReportsDto,
	UpdateReelUserActionDto
} from "@root/reels/dtos/payload.dto"

export type CreateReelPayload = CreateReelDto & {
	userId: string
	tokenId: string
}

export type UpdateReelUserActionPayload = UpdateReelUserActionDto & {
	userId: string
	reelId: string
}

export type CreateCommentReelPayload = CreateReelCommentDto & {
	userId: string
	reelId: string
}

export type UpdateReelCommentActionPayload = UpdateReelUserActionDto & {
	userId: string
	commentId: string
}

export type PaginateReelCommentPayload = PaginateReelCommentDto & {
	reelId: string
	userId?: string
}

export type PaginateReelCommentReplyPayload = PaginateReelCommenReplytDto & {
	userId?: string
	parentId: string
}

export type PaginateListReelPayload = PaginateListReelParams & {
	tokenId: string
}

export type CreateReelCommentReportPayload = CreateReelCommentReportDto & {
	userId: string
	reelCommentId: string
}

export type GetDetailReelPayload = {
	reelId: string
	userId?: string
	userAddress?: string
}

export type CreateReelReportPayload = CreateReelReportDto & {
	userId: string
	reelId: string
}

export type PaginateReelReportsPayload = PaginateReelReportsDto & {
	reelId: string
	userId: string
}
