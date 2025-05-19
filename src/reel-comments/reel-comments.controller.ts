import {
	Body,
	ClassSerializerInterceptor,
	Controller,
	Delete,
	Get,
	Param,
	ParseUUIDPipe,
	Post,
	Query,
	SerializeOptions,
	UseInterceptors
} from "@nestjs/common"
import {
	ApiBearerAuth,
	ApiOperation,
	ApiResponse,
	ApiTags
} from "@nestjs/swagger"
import { Auth, Public } from "@root/_shared/utils/decorators"
import { Claims } from "@root/auth/auth.service"
import {
	ReelCommentReportItem,
	ReelCommentReport as ReelCommentReportResponse
} from "@root/dtos/reel-comment-report.dto"
import { ReelComment as ReelCommentResponse } from "@root/dtos/reel-comment.dto"
import { User } from "@root/users/user.decorator"
import {
	CreateReelCommentDto,
	CreateReelCommentReportDto,
	PaginateReelCommenReplytDto,
	PaginateReelCommentDto,
	PaginateReportedReelCommentDto,
	UpdateReelCommentActionDto
} from "./dtos/payload.dto"
import {
	PaginateReelCommentResponse,
	PaginateReportedReelCommentResponse,
	UpdateReelCommentActionResponse
} from "./dtos/response.dto"
import { ReelCommentsService } from "./reel-comments.service"

@Controller("reel-comments")
@Auth()
@ApiTags("reel-comments")
@ApiResponse({ status: 400, description: "Invalid reel comment data" })
@ApiResponse({ status: 401, description: "Unauthorized" })
@ApiResponse({ status: 500, description: "Internal server error" })
@UseInterceptors(ClassSerializerInterceptor)
export class ReelCommentsController {
	constructor(private readonly reelCommentsService: ReelCommentsService) {}

	@Public()
	@Get("/reels/:reelId")
	@ApiOperation({ summary: "Paginate comments (exclude replies) in a reel" })
	@ApiResponse({
		status: 200,
		description: "Paginated comments in a reel successfully",
		type: PaginateReelCommentResponse
	})
	@ApiBearerAuth()
	@SerializeOptions({
		type: PaginateReelCommentResponse,
		excludeExtraneousValues: true
	})
	paginateComments(
		@Param("reelId", ParseUUIDPipe) reelId: string,
		@Query() query: PaginateReelCommentDto,
		@User() user: Claims | undefined
	) {
		return this.reelCommentsService.paginateComment({
			...query,
			reelId,
			userId: user?.id
		})
	}

	@Get("/reels/:reelId/reported")
	@ApiOperation({
		summary: "Paginate reported comments (include list detail report) in a reel"
	})
	@ApiResponse({
		status: 200,
		description: "Paginated reported comments in a reel successfully",
		type: PaginateReportedReelCommentResponse
	})
	@SerializeOptions({
		type: PaginateReportedReelCommentResponse,
		excludeExtraneousValues: true
	})
	paginateReportedComments(
		@Param("reelId", ParseUUIDPipe) reelId: string,
		@Query() query: PaginateReportedReelCommentDto,
		@User() user: Claims
	) {
		return this.reelCommentsService.paginateReportedComments({
			...query,
			reelId,
			userId: user.id
		})
	}

	@Post("/reels/:reelId")
	@ApiOperation({ summary: "Create comment in a reel" })
	@ApiResponse({
		status: 200,
		description: "Created comment in a reel successfully",
		type: ReelCommentResponse
	})
	@SerializeOptions({
		type: ReelCommentResponse,
		excludeExtraneousValues: true
	})
	createComment(
		@Param("reelId", ParseUUIDPipe) reelId: string,
		@User() user: Claims,
		@Body() body: CreateReelCommentDto
	) {
		return this.reelCommentsService.createComment({
			...body,
			reelId,
			userId: user.id
		})
	}

	@Post(":id/express")
	@ApiOperation({
		summary: "User expresses action with a comment in reel as like, dislike"
	})
	@ApiResponse({
		status: 200,
		description: "User expressed action with a comment in reel successfully",
		type: UpdateReelCommentActionResponse,
		example: { message: "Like reel successfully" }
	})
	@SerializeOptions({
		type: UpdateReelCommentActionResponse,
		excludeExtraneousValues: true
	})
	async updateReelCommentAction(
		@Param("id", ParseUUIDPipe) commentId: string,
		@User() user: Claims,
		@Body() body: UpdateReelCommentActionDto
	) {
		const message = await this.reelCommentsService.updateReelCommentAction({
			action: body.action,
			commentId,
			userId: user.id
		})
		return { message }
	}

	@Public()
	@Get(":id/replies")
	@ApiOperation({
		summary: "Paginate comment to reply other comment"
	})
	@ApiResponse({
		status: 200,
		description: "Paginated comment in a reel successfully",
		type: PaginateReelCommentResponse
	})
	@SerializeOptions({
		type: PaginateReelCommentResponse,
		excludeExtraneousValues: true
	})
	@ApiBearerAuth()
	paginateCommentReply(
		@Query() query: PaginateReelCommenReplytDto,
		@Param("id", ParseUUIDPipe) parentId: string,
		@User() user: Claims | undefined
	) {
		return this.reelCommentsService.paginateCommentReply({
			...query,
			parentId,
			userId: user?.id
		})
	}

	@Post(":id/reports")
	@ApiOperation({
		summary: "Report comment in a reel"
	})
	@ApiResponse({ status: 200, type: ReelCommentReportResponse })
	@SerializeOptions({
		type: ReelCommentReportResponse,
		excludeExtraneousValues: true
	})
	reportComment(
		@Body() body: CreateReelCommentReportDto,
		@User() user: Claims,
		@Param("id", ParseUUIDPipe) commentId: string
	) {
		return this.reelCommentsService.reportComment({
			description: body.description,
			reelCommentId: commentId,
			userId: user.id
		})
	}

	@Get(":id/reports")
	@ApiOperation({
		summary: "Get list report in a reel comment by creator reel or admin"
	})
	@ApiResponse({
		status: 200,
		type: ReelCommentReportItem,
		isArray: true
	})
	@SerializeOptions({
		type: ReelCommentReportItem,
		excludeExtraneousValues: true
	})
	getCommentReport(
		@Param("id", ParseUUIDPipe) commentId: string,
		@User() user: Claims
	) {
		return this.reelCommentsService.getListCommentReport(commentId, user.id)
	}

	@Delete(":id")
	@ApiOperation({
		summary: "Delete a reel comment by creator & admin"
	})
	@ApiResponse({
		status: 204
	})
	deleteCommentReel(
		@Param("id", ParseUUIDPipe) id: string,
		@User() user: Claims
	) {
		return this.reelCommentsService.deleteReelComment(id, user.id)
	}
}
