import {
	Body,
	Controller,
	Get,
	Param,
	ParseUUIDPipe,
	Post,
	Query
} from "@nestjs/common"
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger"
import { Auth } from "@root/_shared/utils/decorators"
import { Claims } from "@root/auth/auth.service"
import {
	CreateCommentPayload,
	GetCommentsParams,
	RepliesParams
} from "@root/comments/dtos/payload.dto"
import {
	CreateCommentResponse,
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

@Auth()
@Controller("tokens/comments")
@ApiTags("comments")
@ApiResponse({ status: 401, description: "Unauthorized" })
@ApiResponse({ status: 404, description: "Token not found" })
@ApiResponse({ status: 400, description: "Invalid comment data" })
export class CommentController {
	constructor(private readonly commentService: CommentService) {}

	@Get(":tokenId")
	@ApiPaginatedResponse(CommentResponse)
	@ApiOperation({ summary: "Get paginated comments for a token" })
	@ApiResponse({
		status: 200,
		description: "Comments retrieved successfully"
	})
	async getComments(
		@Param("tokenId") tokenId: string,
		@Query() query: GetCommentsParams,
		@User() user: Claims
	) {
		const { total, maxPage, data } = await this.commentService.getComments({
			...query,
			tokenId,
			userId: user.id
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
	@ApiPaginatedResponse(CommentResponse)
	@ApiOperation({ summary: "Get paginated comments for a token" })
	@ApiResponse({
		status: 200,
		description: "Comments retrieved successfully"
	})
	async getPinnedComments(
		@Param("tokenId") tokenId: string,
		@User() user: Claims
	) {
		const result = await this.commentService.getPinnedComment({
			tokenId,
			userId: user.id
		})

		console.log("result: ", result)

		return plainToInstance(CommentResponse, result, {
			excludeExtraneousValues: true
		})
	}

	@Post(":tokenId")
	@ApiOperation({ summary: "Create a new comment on a token" })
	@ApiResponse({
		status: 201,
		description: "Comment created successfully",
		type: CreateCommentResponse
	})
	async createComment(
		@Body() body: CreateCommentPayload,
		@Param("tokenId") tokenId: string,
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

	@Post(":commentId/toggle-pin")
	@ApiOperation({ summary: "Pin message by dev" })
	@ApiResponse({
		status: 201,
		description: "Comment is pinned successfully"
	})
	async pinComment(
		@Param("commentId", new ParseUUIDPipe()) commentId: string,
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

	@Post(":commentId/toggle-like")
	@ApiOperation({ summary: "Toggle like on a comment" })
	@ApiResponse({
		status: 200,
		description: "Like toggled successfully",
		type: ToggleLikeResponse
	})
	async toggleLike(
		@Param("commentId") commentId: string,
		@User() user: Claims
	) {
		const result = await this.commentService.toggleLike(commentId, user.id)
		return plainToInstance(ToggleLikeResponse, result, {
			excludeExtraneousValues: true
		})
	}

	@Get(":commentId/reply")
	@ApiPaginatedResponse(CommentResponse)
	@ApiOperation({ summary: "Get paginated replies to a comment" })
	@ApiResponse({
		status: 200,
		description: "Replies retrieved successfully"
	})
	async paginateReplies(
		@Param("commentId") commentId: string,
		@User() user: Claims,
		@Query() query: RepliesParams
	) {
		const { total, maxPage, data } = await this.commentService.getReplies({
			...query,
			parentId: commentId,
			userId: user.id
		})

		return plainToInstance(
			PaginatedResponse<CommentResponse>,
			new PaginatedResponse(data, total, maxPage),
			{
				excludeExtraneousValues: true
			}
		)
	}

	@Post(":commentId/reply")
	@ApiOperation({ summary: "Create a reply to a comment" })
	@ApiResponse({
		status: 201,
		description: "Reply created successfully",
		type: CreateCommentResponse
	})
	async replyComment(
		@Body() body: CreateCommentPayload,
		@Param("commentId") commentId: string,
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
}
