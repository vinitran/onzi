import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common"
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger"
import { Auth } from "@root/_shared/utils/decorators"
import {
	ApiPaginatedResponse,
	PaginatedResponse
} from "@root/_shared/utils/parsers"
import { Claims } from "@root/auth/auth.service"
import { ToggleLikeResponse } from "@root/comments/dtos/like.dto"
import { User } from "@root/users/user.decorator"
import { plainToInstance } from "class-transformer"
import { CommentService } from "./comment.service"
import { CommentResponse, CreateCommentResponse } from "./dtos/comments.dto"
import { CreateCommentDto } from "./dtos/create-comment.dto"
import { PaginateCommentsDto } from "./dtos/paginate-comments.dto"
import { PaginateRepliesDto } from "./dtos/paginate-replies.dto"

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
		@Query() query: PaginateCommentsDto,
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

	@Post(":tokenId")
	@ApiOperation({ summary: "Create a new comment on a token" })
	@ApiResponse({
		status: 201,
		description: "Comment created successfully",
		type: CreateCommentResponse
	})
	async createComment(
		@Body() body: CreateCommentDto,
		@Param("tokenId") tokenId: string,
		@User() user: Claims
	) {
		const result = await this.commentService.createComment({
			content: body.content,
			isContainAttachment: body.isContainAttachment,
			userId: user.id,
			tokenId
		})

		return plainToInstance(CreateCommentResponse, result, {
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
		@Query() query: PaginateRepliesDto
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
		@Body() body: CreateCommentDto,
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
