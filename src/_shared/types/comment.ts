import { PresignedPost } from "@aws-sdk/s3-presigned-post"
import { Comment, User } from "@prisma/client"
import {
	CreateCommentPayload,
	GetCommentsParams
} from "@root/comments/dtos/payload.dto"

/* Create comment */
export type ICreateComment = CreateCommentPayload & {
	tokenId: string
	userId: string
	contentType?: string
	stickerId?: string
}

export type ICreateCommentResponse = {
	comment: Comment & {
		author: {
			id: string
			address: string
			username: string | null
			avatarUrl: string | null
		}
	}
	attachment?: PresignedPost
}

export type IReplyComment = Omit<ICreateComment, "tokenId">

/* Paginate comment */
export type IPaginateComments = GetCommentsParams & {
	tokenId: string
	userId?: string
}
export type Author = Pick<User, "id" | "address" | "avatarUrl" | "username">
export type IPaginateCommentsData = {
	id: string
	content: string
	authorId: string
	tokenId: string
	parentId: null | string
	isLiked: boolean
	totalLike: number
	totalReply: number
	createdAt: Date
	updatedAt: Date | null
	author: Author
}

/* Paginate replies */
export type IPaginateReplies = GetCommentsParams & {
	parentId: string
	userId?: string
}

export type IPaginateRepliesData = IPaginateCommentsData

export type GetPinnedCommentPayload = {
	userId?: string
	tokenId: string
}

export type TogglePinCommentPayload = {
	userId?: string
	commentId: string
}

export type DeleteCommentByCreatorTokenPayload = {
	creatorAddress: string
	commentId: string
}

export type DeleteAllCommentFromUserByCreatorTokenPayload = {
	creatorAddress: string
	authorId: string
	tokenId: string
}

export type ToggleBlockUserCommentPayload = {
	userId: string
	tokenId: string
	creatorAddress: string
}
