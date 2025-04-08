import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common"
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger"
import { Auth } from "@root/_shared/utils/decorators"
import { Claims } from "@root/auth/auth.service"
import { User } from "@root/users/user.decorator"
import { CommentService } from "./comment.service"
import { CreateCommentDto } from "./dtos/create-comment.dto"
import { PaginateCommentsDto } from "./dtos/paginate-comments.dto"
import { PaginateRepliesDto } from "./dtos/paginate-replies.dto"

@Auth()
@Controller("tokens/comments")
@ApiTags("comments")
export class CommentController {
	constructor(private readonly commentService: CommentService) {}

	@Get(":tokenId")
	@ApiOperation({ summary: "Get paginated comments for a token" })
	@ApiResponse({
		status: 200,
		description: "Comments retrieved successfully"
	})
	@ApiResponse({ status: 400, description: "Invalid pagination parameters" })
	@ApiResponse({ status: 404, description: "Token not found" })
	paginateComments(
		@Param("tokenId") tokenId: string,
		@Query() query: PaginateCommentsDto,
		@User() user: Claims
	) {
		return this.commentService.paginateComments({
			...query,
			tokenId,
			userId: user.id
		})
	}

	@Post(":tokenId")
	@ApiOperation({ summary: "Create a new comment on a token" })
	@ApiResponse({
		status: 201,
		description: "Comment created successfully",
		type: CreateCommentDto
	})
	@ApiResponse({ status: 400, description: "Invalid comment data" })
	@ApiResponse({ status: 401, description: "Unauthorized" })
	@ApiResponse({ status: 404, description: "Token not found" })
	createComment(
		@Body() body: CreateCommentDto,
		@Param("tokenId") tokenId: string,
		@User() user: Claims
	) {
		return this.commentService.createComment({
			content: body.content,
			isContainAttachment: body.isContainAttachment,
			userId: user.id,
			tokenId
		})
	}

	@Post(":commentId/toggle-like")
	@ApiOperation({ summary: "Toggle like on a comment" })
	@ApiResponse({
		status: 200,
		description: "Like toggled successfully"
	})
	@ApiResponse({ status: 401, description: "Unauthorized" })
	@ApiResponse({ status: 404, description: "Comment not found" })
	toggleLike(@Param("commentId") commentId: string, @User() user: Claims) {
		return this.commentService.toggleLike(commentId, user.id)
	}

	@Get(":commentId/reply")
	@ApiOperation({ summary: "Get paginated replies to a comment" })
	@ApiResponse({
		status: 200,
		description: "Replies retrieved successfully"
	})
	@ApiResponse({ status: 400, description: "Invalid pagination parameters" })
	@ApiResponse({ status: 404, description: "Comment not found" })
	paginateReplies(
		@Param("commentId") commentId: string,
		@User() user: Claims,
		@Query() query: PaginateRepliesDto
	) {
		return this.commentService.paginateReplies({
			...query,
			parentId: commentId,
			userId: user.id
		})
	}

	@Post(":commentId/reply")
	@ApiOperation({ summary: "Create a reply to a comment" })
	@ApiResponse({
		status: 201,
		description: "Reply created successfully",
		type: CreateCommentDto
	})
	@ApiResponse({ status: 400, description: "Invalid reply data" })
	@ApiResponse({ status: 401, description: "Unauthorized" })
	@ApiResponse({ status: 404, description: "Comment not found" })
	replyComment(
		@Body() body: CreateCommentDto,
		@Param("commentId") commentId: string,
		@User() user: Claims
	) {
		return this.commentService.replyComment({
			...body,
			commentId,
			userId: user.id
		})
	}
}
