import {
	Body,
	ClassSerializerInterceptor,
	Controller,
	Delete,
	Get,
	HttpCode,
	HttpStatus,
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
import { Auth } from "@root/_shared/utils/decorators"
import { Claims } from "@root/auth/auth.service"
import {
	ReelCommentReportItem,
	ReelCommentReport as ReelCommentReportResponse
} from "@root/dtos/reel-comment-report.dto"
import { ReelComment as ReelCommentResponse } from "@root/dtos/reel-comment.dto"
import { Reel as ReelResponse } from "@root/dtos/reel.dto"
import { User } from "@root/users/user.decorator"
import {
	CreateReelCommentDto,
	CreateReelCommentReportDto,
	CreateReelDto,
	PaginateListReelParams,
	PaginateReelCommenReplytDto,
	PaginateReelCommentDto,
	UpdateReelCommentActionDto,
	UpdateReelUserActionDto
} from "./dtos/payload.dto"
import {
	CreateReelResponse,
	GetDetailReelResponse,
	PaginateReelCommentResponse,
	PaginateReelResponse,
	UpdateReelCommentActionResponse,
	UpdateReelUserActionResponse
} from "./dtos/response.dto"
import { ReelsService } from "./reels.service"

@Controller("reels")
@ApiTags("reels")
@ApiResponse({ status: 400, description: "Invalid token data" })
@ApiResponse({ status: 401, description: "Unauthorized" })
@ApiResponse({ status: 500, description: "Internal server error" })
@UseInterceptors(ClassSerializerInterceptor)
export class ReelsController {
	constructor(private readonly reelsService: ReelsService) {}

	@Auth()
	@Post("tokens/:tokenId")
	@ApiOperation({ summary: "Create a new reel by creator token" })
	@HttpCode(HttpStatus.CREATED)
	@ApiResponse({
		status: HttpStatus.CREATED,
		description: "Reel created successfully",
		type: CreateReelResponse
	})
	@SerializeOptions({
		type: CreateReelResponse,
		enableImplicitConversion: true,
		excludeExtraneousValues: true
	})
	create(
		@Param("tokenId", ParseUUIDPipe) tokenId: string,
		@User() user: Claims,
		@Body() body: CreateReelDto
	) {
		return this.reelsService.create({
			caption: body.caption,
			tokenId,
			userId: user.id
		})
	}

	@Get("tokens/:tokenId")
	@ApiOperation({ summary: "Paginate list reel in a token" })
	@ApiResponse({
		status: 200,
		description: "Paginate reels successfully",
		type: PaginateReelResponse
	})
	@SerializeOptions({
		type: PaginateReelResponse,
		enableImplicitConversion: true,
		excludeExtraneousValues: true
	})
	paginate(
		@Param("tokenId", ParseUUIDPipe) tokenId: string,
		@Query() query: PaginateListReelParams
	) {
		return this.reelsService.paginate({ ...query, tokenId })
	}

	@Auth()
	@Post(":id/express")
	@ApiOperation({ summary: "User expresses action a reel as like, dislike" })
	@ApiResponse({
		status: 200,
		description: "Update action for a reel successfully",
		type: UpdateReelUserActionResponse,
		example: { message: "Like reel successfully" }
	})
	async updateReelUserAction(
		@Param("id", ParseUUIDPipe) reelId: string,
		@User() user: Claims,
		@Body() body: UpdateReelUserActionDto
	) {
		const message = await this.reelsService.updateUserAction({
			reelId,
			action: body.action,
			userId: user.id
		})
		return { message }
	}

	@Get(":id/comments")
	@ApiOperation({ summary: "Paginate comments (exclude replies) in a reel" })
	@ApiResponse({
		status: 200,
		description: "Paginated comment in a reel successfully",
		type: PaginateReelCommentResponse
	})
	@ApiBearerAuth()
	@SerializeOptions({
		type: PaginateReelCommentResponse,
		excludeExtraneousValues: true
	})
	paginateComment(
		@Param("id", ParseUUIDPipe) reelId: string,
		@Query() query: PaginateReelCommentDto,
		@User() user: Claims | undefined
	) {
		return this.reelsService.paginateComment({
			...query,
			reelId,
			userId: user?.id
		})
	}

	@Auth()
	@Post(":id/comments")
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
		@Param("id", ParseUUIDPipe) reelId: string,
		@User() user: Claims,
		@Body() body: CreateReelCommentDto
	) {
		return this.reelsService.createComment({
			...body,
			reelId,
			userId: user.id
		})
	}

	@Auth()
	@Post("comments/:id/express")
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
		const message = await this.reelsService.updateReelCommentAction({
			action: body.action,
			commentId,
			userId: user.id
		})
		return { message }
	}

	@Get("comments/:id/replies")
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
		return this.reelsService.paginateCommentReply({
			...query,
			parentId,
			userId: user?.id
		})
	}

	@Auth()
	@Post("comment/:id/reports")
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
		return this.reelsService.reportComment({
			description: body.description,
			reelCommentId: commentId,
			userId: user.id
		})
	}

	@Auth()
	@Get("comment/:id/reports")
	@ApiOperation({
		summary: "Get list report in a reel comment"
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
	getCommentReport(@Param("id", ParseUUIDPipe) commentId: string) {
		return this.reelsService.getListCommentReport(commentId)
	}

	@Post(":id")
	@ApiOperation({ summary: "Create a new reel by creator token" })
	@ApiResponse({
		status: 200,
		description: "Viewed reel successfully",
		type: ReelResponse
	})
	@SerializeOptions({
		type: ReelResponse,
		enableImplicitConversion: true,
		excludeExtraneousValues: true
	})
	increaseView(@Param("id", ParseUUIDPipe) id: string) {
		return this.reelsService.updateView(id)
	}

	@Get(":id")
	@ApiBearerAuth()
	@ApiOperation({ summary: "Get detail new reel" })
	@ApiResponse({
		status: 200,
		description: "Get detail reel successfully",
		type: GetDetailReelResponse
	})
	@SerializeOptions({
		type: GetDetailReelResponse,
		enableImplicitConversion: true,
		excludeExtraneousValues: true
	})
	getDetail(
		@Param("id", ParseUUIDPipe) id: string,
		@User() user: Claims | undefined
	) {
		return this.reelsService.getDetail({
			reelId: id,
			userAddress: user?.address,
			userId: user?.id
		})
	}

	@Auth()
	@Delete(":id")
	@HttpCode(HttpStatus.NO_CONTENT)
	@ApiOperation({ summary: "Delete reel by admin or creator token" })
	destroy(@Param("id", ParseUUIDPipe) id: string, @User() user: Claims) {
		return this.reelsService.destroy(id, user.id)
	}
}
