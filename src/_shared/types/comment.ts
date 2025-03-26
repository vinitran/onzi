import { PresignedPost } from "@aws-sdk/s3-presigned-post"
import { Comment, User } from "@prisma/client"
import { CreateCommentDto } from "@root/comment/dtos/create-comment.dto"
import { PaginateCommentsDto } from "@root/comment/dtos/paginate-comments.dto"

/* Create comment */
export type ICreateComment = CreateCommentDto & {
	tokenId: string
	userId: string
}

export type ICreateCommentResponse = {
	comment: Comment
	attachment?: PresignedPost
}

export type IReplyComment = Omit<ICreateComment, "tokenId">

/* Paginate comment */
export type IPaginateComments = PaginateCommentsDto & {
	tokenId: string
	userId: string
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
export type IPaginateReplies = PaginateCommentsDto & {
	parentId: string
	userId: string
}

export type IPaginateRepliesData = IPaginateCommentsData
