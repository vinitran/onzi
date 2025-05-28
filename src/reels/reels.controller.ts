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
	Put,
	Query,
	SerializeOptions,
	UseInterceptors
} from "@nestjs/common"
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger"
import { Auth, Public, Roles } from "@root/_shared/utils/decorators"
import { Claims } from "@root/auth/auth.service"
import { ReelReport as ReelReportResponse } from "@root/dtos/reel-report.dto"
import { Reel as ReelResponse } from "@root/dtos/reel.dto"
import { User } from "@root/users/user.decorator"
import {
	CreateReelDto,
	CreateReelReportDto,
	PaginateListReelParams,
	PaginateReelReportsDto,
	PaginateReportedReelDto,
	UpdateReelUserActionDto
} from "./dtos/payload.dto"
import {
	CreateReelResponse,
	GetDetailReelResponse,
	PaginateReelReportsResponse,
	PaginateReelResponse,
	PaginateReportedReelResponse,
	TogglePinReelResponse,
	UpdateReelUserActionResponse
} from "./dtos/response.dto"
import { ReelReportsService } from "./reel-reports.service"
import { ReelsService } from "./reels.service"

@Controller("reels")
@Auth()
@ApiTags("reels")
@ApiResponse({ status: 400, description: "Invalid token or reel data" })
@ApiResponse({ status: 401, description: "Unauthorized" })
@ApiResponse({ status: 500, description: "Internal server error" })
@UseInterceptors(ClassSerializerInterceptor)
export class ReelsController {
	constructor(
		private readonly reelsService: ReelsService,
		private readonly reelReportsService: ReelReportsService
	) {}

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
	@Public()
	@ApiOperation({ summary: "Paginate list reel in a token" })
	@ApiResponse({
		status: 200,
		description: "Paginate reels in a token successfully",
		type: PaginateReelResponse
	})
	@SerializeOptions({
		type: PaginateReelResponse,
		enableImplicitConversion: true,
		excludeExtraneousValues: true
	})
	paginateByToken(
		@Param("tokenId", ParseUUIDPipe) tokenId: string,
		@Query() query: PaginateListReelParams
	) {
		return this.reelsService.paginateByToken({ ...query, tokenId })
	}

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

	@Roles("Admin")
	@Get("reported")
	@ApiOperation({ summary: "List paginated reported reel by admin or creator" })
	@ApiResponse({
		status: 200,
		description: "Paginated reported reel by admin or creator successfully",
		type: PaginateReportedReelResponse
	})
	@SerializeOptions({
		type: PaginateReportedReelResponse,
		excludeExtraneousValues: true,
		enableImplicitConversion: true
	})
	paginateReportedReels(@Query() query: PaginateReportedReelDto) {
		return this.reelsService.paginateReportedReels(query)
	}

	@Get(":id/reports")
	@ApiOperation({
		summary: "List reel reports in a reel by creator or admin"
	})
	@ApiResponse({
		status: 200,
		description: "Get list reel reports in a reel successfully",
		type: PaginateReelReportsResponse
	})
	@SerializeOptions({
		type: PaginateReelReportsResponse,
		excludeExtraneousValues: true,
		enableImplicitConversion: true
	})
	getListReelReport(
		@Param("id", ParseUUIDPipe) id: string,
		@User() user: Claims,
		@Query() query: PaginateReelReportsDto
	) {
		return this.reelReportsService.paginateReelReportsByReelId({
			...query,
			reelId: id,
			userId: user.id
		})
	}

	@Post(":id/reports")
	@ApiOperation({ summary: "User report a reel" })
	@ApiResponse({
		status: 200,
		description: "Reported a reel successfully",
		type: ReelReportResponse
	})
	@SerializeOptions({
		type: ReelReportResponse,
		excludeExtraneousValues: true
	})
	async reportReel(
		@Param("id", ParseUUIDPipe) reelId: string,
		@User() user: Claims,
		@Body() body: CreateReelReportDto
	) {
		return this.reelReportsService.createReport({
			description: body.description,
			reelId,
			userId: user.id
		})
	}

	@Post(":id")
	@Public()
	@ApiOperation({ summary: "Increase view for a reel" })
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

	@Put(":id/pin")
	@ApiOperation({ summary: "Pin a reel by creator" })
	@ApiResponse({
		status: 200,
		description: "Pinned reel successfully",
		type: TogglePinReelResponse
	})
	@SerializeOptions({
		type: TogglePinReelResponse,
		enableImplicitConversion: true,
		excludeExtraneousValues: true
	})
	async togglePinReel(
		@Param("id", ParseUUIDPipe) id: string,
		@User() user: Claims
	) {
		const message = await this.reelsService.togglePinReelByCreator(id, user.id)
		return { message }
	}

	@Get(":id")
	@Public()
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

	@Delete(":id")
	@HttpCode(HttpStatus.NO_CONTENT)
	@ApiOperation({ summary: "Delete reel by admin or creator token" })
	destroy(@Param("id", ParseUUIDPipe) id: string, @User() user: Claims) {
		return this.reelsService.destroy(id, user.id)
	}
}
