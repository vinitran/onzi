import { User } from "@prisma/client"
import { PaginateCommentsDto } from "@root/comment/dtos/paginate-comments.dto"

export type ICreateComment = {
	tokenId: string
	userId: string
	content: string
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
