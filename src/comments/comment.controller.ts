import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common"
import { ApiOperation, ApiTags } from "@nestjs/swagger"
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
	@ApiOperation({ summary: "Paginate comments and data related to user" })
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
	@ApiOperation({ summary: "Create comment" })
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
	@ApiOperation({ summary: "Toggle like" })
	toggleLike(@Param("commentId") commentId: string, @User() user: Claims) {
		return this.commentService.toggleLike(commentId, user.id)
	}

	@Get(":commentId/reply")
	@ApiOperation({ summary: "Get paginate replies" })
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
	@ApiOperation({ summary: "Reply comment" })
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
