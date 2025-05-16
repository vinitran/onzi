import {
	CreateReelCommentDto,
	CreateReelDto,
	PaginateListReelParams,
	PaginateReelCommenReplytDto,
	PaginateReelCommentDto,
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
