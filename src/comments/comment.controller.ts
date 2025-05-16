import {
	Body,
	Controller,
	Delete,
	Get,
	HttpCode,
	Param,
	ParseUUIDPipe,
	Post,
	Put,
	Query
} from "@nestjs/common"
import {
	ApiBearerAuth,
	ApiOperation,
	ApiResponse,
	ApiTags
} from "@nestjs/swagger"
import { Auth } from "@root/_shared/utils/decorators"
import { Claims } from "@root/auth/auth.service"
import {
	CreateCommentPayload,
	GetCommentsParams,
	RepliesParams
} from "@root/comments/dtos/payload.dto"
import {
	CreateCommentResponse,
	GetBlockedUserCommentResponse,
	ToggleLikeResponse
} from "@root/comments/dtos/response.dto"
import { Comment as CommentResponse } from "@root/dtos/comment.dto"
import {
	ApiPaginatedResponse,
	Paginate as PaginatedResponse
} from "@root/dtos/common.dto"
import { User } from "@root/users/user.decorator"
import { plainToInstance } from "class-transformer"
import { CommentService } from "./comment.service"

@Controller("tokens/comments")
@ApiTags("comments")
@ApiResponse({ status: 401, description: "Unauthorized" })
@ApiResponse({ status: 404, description: "Token not found" })
@ApiResponse({ status: 400, description: "Invalid comment data" })
export class CommentController {
	constructor(private readonly commentService: CommentService) {}

	@Get(":tokenId")
	@ApiBearerAuth()
	@ApiPaginatedResponse(CommentResponse)
	@ApiOperation({ summary: "Get paginated comments for a token" })
	@ApiResponse({
		status: 200,
		description: "Comments retrieved successfully"
	})
	async getComments(
		@Param("tokenId", new ParseUUIDPipe({ version: "4" })) tokenId: string,
		@Query() query: GetCommentsParams,
		@User() user: Claims | undefined
	) {
		const { total, maxPage, data } = await this.commentService.getComments({
			...query,
			tokenId,
			userId: user?.id
		})

		return plainToInstance(
			PaginatedResponse<CommentResponse>,
			new PaginatedResponse(data, total, maxPage),
			{
				excludeExtraneousValues: true
			}
		)
	}

	@Get(":tokenId/pin")
	@ApiBearerAuth()
	@ApiOperation({ summary: "Get pinned comments for a token" })
	@ApiResponse({
		status: 200,
		description: "Pinned comments retrieved successfully",
		type: [CommentResponse]
	})
	async getPinnedComments(
		@Param("tokenId", new ParseUUIDPipe({ version: "4" })) tokenId: string,
		@User() user: Claims | undefined
	) {
		const result = await this.commentService.getPinnedComment({
			tokenId,
			userId: user?.id
		})

		return plainToInstance(CommentResponse, result, {
			excludeExtraneousValues: true
		})
	}

	@Auth()
	@Post(":tokenId")
	@ApiOperation({ summary: "Create a new comment on a token" })
	@ApiResponse({
		status: 201,
		description: "Comment created successfully",
		type: CreateCommentResponse
	})
	async createComment(
		@Body() body: CreateCommentPayload,
		@Param("tokenId", new ParseUUIDPipe({ version: "4" })) tokenId: string,
		@User() user: Claims
	) {
		const result = await this.commentService.createComment({
			content: body.content,
			isContainAttachment: body.isContainAttachment,
			stickerId: body.stickerId,
			userId: user.id,
			tokenId
		})

		return plainToInstance(CreateCommentResponse, result, {
			excludeExtraneousValues: true
		})
	}

	@Auth()
	@Post("/:tokenId/user/:userId/block")
	@ApiOperation({
		summary: "Toggle blocking user comment by dev (token creator)"
	})
	@ApiResponse({
		description: "Toggled blocking user comment successfully"
	})
	async blockUserComment(
		@Param("userId", new ParseUUIDPipe({ version: "4" })) userId: string,
		@Param("tokenId", new ParseUUIDPipe({ version: "4" })) tokenId: string,
		@User() user: Claims
	) {
		await this.commentService.toggleBlock({
			creatorAddress: user.address,
			tokenId,
			userId
		})
		return {
			message: "Toggle blocking user succesfully"
		}
	}

	@Auth()
	@Get("/:tokenId/user/block")
	@ApiResponse({
		status: 200,
		description: "Get blocked users successfully",
		type: [GetBlockedUserCommentResponse]
	})
	@ApiOperation({ summary: "Get blocked users" })
	async getListBlockedUserComment(
		@Param("tokenId", new ParseUUIDPipe({ version: "4" })) tokenId: string
	) {
		const result = await this.commentService.getAllBlockedUserComment(tokenId)
		return plainToInstance(GetBlockedUserCommentResponse, result, {
			excludeExtraneousValues: true
		})
	}

	@Auth()
	@Delete("/:tokenId/user/:userId")
	@HttpCode(204)
	@ApiOperation({ summary: "Delete comment from user by dev (token creator)" })
	@ApiResponse({
		status: 204,
		description: "Delete comment from user successfully"
	})
	async deleteCommentsOfUser(
		@Param("userId", new ParseUUIDPipe({ version: "4" })) userId: string,
		@Param("tokenId", new ParseUUIDPipe({ version: "4" })) tokenId: string,
		@User() user: Claims
	) {
		await this.commentService.deleteAllCommentFromUser({
			authorId: userId,
			creatorAddress: user.address,
			tokenId
		})
		return {
			message: "Delete comments succesfully"
		}
	}

	@Auth()
	@Put(":commentId/toggle-pin")
	@ApiOperation({ summary: "Pin message by dev" })
	@ApiResponse({
		status: 201,
		description: "Comment is pinned successfully"
	})
	async pinComment(
		@Param("commentId", new ParseUUIDPipe({ version: "4" })) commentId: string,
		@User() user: Claims
	) {
		const result = this.commentService.togglePinComment({
			commentId,
			userId: user.id
		})
		return plainToInstance(CommentResponse, result, {
			excludeExtraneousValues: true
		})
	}

	@Auth()
	@Post(":commentId/toggle-like")
	@ApiOperation({ summary: "Toggle like on a comment" })
	@ApiResponse({
		status: 200,
		description: "Like toggled successfully",
		type: ToggleLikeResponse
	})
	async toggleLike(
		@Param("commentId", new ParseUUIDPipe({ version: "4" })) commentId: string,
		@User() user: Claims
	) {
		const result = await this.commentService.toggleLike(commentId, user.id)
		return plainToInstance(ToggleLikeResponse, result, {
			excludeExtraneousValues: true
		})
	}

	@Get(":commentId/reply")
	@ApiBearerAuth()
	@ApiPaginatedResponse(CommentResponse)
	@ApiOperation({ summary: "Get paginated replies to a comment" })
	@ApiResponse({
		status: 200,
		description: "Replies retrieved successfully"
	})
	async paginateReplies(
		@Param("commentId", new ParseUUIDPipe({ version: "4" })) commentId: string,
		@User() user: Claims | undefined,
		@Query() query: RepliesParams
	) {
		const { total, maxPage, data } = await this.commentService.getReplies({
			...query,
			parentId: commentId,
			userId: user?.id
		})

		return plainToInstance(
			PaginatedResponse<CommentResponse>,
			new PaginatedResponse(data, total, maxPage),
			{
				excludeExtraneousValues: true
			}
		)
	}

	@Auth()
	@Post(":commentId/reply")
	@ApiOperation({ summary: "Create a reply to a comment" })
	@ApiResponse({
		status: 201,
		description: "Reply created successfully",
		type: CreateCommentResponse
	})
	async replyComment(
		@Body() body: CreateCommentPayload,
		@Param("commentId", new ParseUUIDPipe({ version: "4" })) commentId: string,
		@User() user: Claims
	) {
		const result = await this.commentService.replyComment({
			...body,
			commentId,
			userId: user.id
		})

		return plainToInstance(CreateCommentResponse, result, {
			excludeExtraneousValues: true
		})
	}

	@Auth()
	@Delete(":commentId")
	@HttpCode(204)
	@ApiOperation({ summary: "Delete comment by dev (token creator) or admin" })
	@ApiResponse({
		status: 204,
		description: "Delete comment successfully"
	})
	async deleteComment(
		@Param("commentId", new ParseUUIDPipe({ version: "4" })) commentId: string,
		@User() user: Claims
	) {
		return this.commentService.deleteComment({
			commentId,
			creatorAddress: user.address
		})
	}
}
