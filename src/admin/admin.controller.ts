import {
	Body,
	ClassSerializerInterceptor,
	Controller,
	Delete,
	Get,
	HttpCode,
	Param,
	ParseUUIDPipe,
	Post,
	Put,
	Query,
	SerializeOptions,
	UseInterceptors
} from "@nestjs/common"
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger"
import { Admin } from "@root/_shared/utils/decorators"
import { AdminService } from "./admin.service"
import {
	GetWithdrawalCodeDto,
	PaginateReportedTokensDto,
	ToggleBlockUserChatDto,
	ToggleBlockUserCreateReelDto,
	UpdateTokensDto
} from "./dtos/payload.dto"
import {
	AdminPopularTokenResponse,
	PaginateReportedTokensResponse,
	ToggleBlockUserChatResponse,
	ToggleBlockUserCreateReelResponse,
	UpdateTokensResponse,
	WithdrawalCodeResponse,
	WithdrawalSolAmountResponse
} from "./dtos/response.dto"

@Controller("admin")
@Admin()
@ApiTags("admin")
@ApiResponse({ status: 401, description: "Unauthorized" })
@ApiResponse({ status: 404, description: "User not found" })
@UseInterceptors(ClassSerializerInterceptor)
export class AdminController {
	constructor(private readonly adminService: AdminService) {}

	@Get("/withdrawal/amount")
	@ApiOperation({ summary: "Get amount sol to withdraw by admin" })
	@ApiResponse({
		type: WithdrawalSolAmountResponse,
		status: 200,
		description: "Amount sol to withdraw by admin"
	})
	@SerializeOptions({
		type: WithdrawalSolAmountResponse,
		enableImplicitConversion: true,
		excludeExtraneousValues: true
	})
	getSolToWithdraw() {
		return this.adminService.getAmountSolToWithdraw()
	}

	@Get("/withdrawal/generate-code")
	@ApiOperation({ summary: "Generate transaction code" })
	@ApiResponse({
		type: WithdrawalCodeResponse,
		status: 200,
		description: "Transaction code for admin to withdraw"
	})
	@SerializeOptions({
		type: WithdrawalCodeResponse,
		enableImplicitConversion: true,
		excludeExtraneousValues: true
	})
	generateCode(@Query() query: GetWithdrawalCodeDto) {
		return this.adminService.generateCodeToWithdraw(query)
	}

	@Put("tokens")
	@ApiOperation({
		summary: "Update tokens for popular with order & headline"
	})
	@ApiResponse({
		status: 200,
		type: UpdateTokensResponse,
		isArray: true,
		description: "Update tokens"
	})
	@SerializeOptions({
		type: UpdateTokensResponse,
		enableImplicitConversion: true,
		excludeExtraneousValues: true
	})
	updateTokens(@Body() body: UpdateTokensDto) {
		return this.adminService.updateTokens(body)
	}

	@Get("tokens")
	@ApiOperation({
		summary: "Get tokens for popular with order & headline"
	})
	@ApiResponse({
		status: 200,
		type: AdminPopularTokenResponse,
		isArray: true,
		description: "Get list popular tokens with order & headline"
	})
	@SerializeOptions({
		type: AdminPopularTokenResponse,
		enableImplicitConversion: true,
		excludeExtraneousValues: true
	})
	getPopularTokens() {
		return this.adminService.getListPopularTokens()
	}

	@Get("tokens/reported")
	@ApiOperation({
		summary: "Paginate reported tokens"
	})
	@ApiResponse({
		status: 200,
		type: PaginateReportedTokensResponse,
		description: "Paginate reported tokens"
	})
	@SerializeOptions({
		type: PaginateReportedTokensResponse,
		enableImplicitConversion: true,
		excludeExtraneousValues: true
	})
	paginateReportedTokens(@Query() query: PaginateReportedTokensDto) {
		return this.adminService.paginateReportedTokens(query)
	}

	@Delete("tokens/reported/:tokenId")
	@ApiOperation({ summary: "Soft delete reported token" })
	@HttpCode(204)
	deleteReportedToken(@Param("tokenId", ParseUUIDPipe) tokenId: string) {
		return this.adminService.softDeleteToken(tokenId)
	}

	@Post(":userId/toggle-block-user-chat")
	@ApiOperation({
		summary:
			"Toggle block user create chat in platforms(token, reel). And options Permanent or Temporary (3 days)"
	})
	@ApiResponse({
		status: 200,
		type: ToggleBlockUserChatResponse,
		description: "Toggle block user create chat in all platform(token, reel)"
	})
	@SerializeOptions({
		type: ToggleBlockUserChatResponse
	})
	toggleBlockUserChat(
		@Param("userId", ParseUUIDPipe) userId: string,
		@Body() body: ToggleBlockUserChatDto
	) {
		return this.adminService.toggleBlockUserChat({
			listType: body.listType,
			option: body.option,
			userId
		})
	}

	@Post(":userId/toggle-block-user-create-reel")
	@ApiOperation({
		summary:
			"Block user create reel with options Permanent or Temporary. Temporary is default 3 days"
	})
	@ApiResponse({
		status: 200,
		type: ToggleBlockUserCreateReelResponse,
		description: "Blocked user create reel"
	})
	@SerializeOptions({
		type: ToggleBlockUserCreateReelResponse
	})
	async blockUserCreateReel(
		@Param("userId", ParseUUIDPipe) userId: string,
		@Body() body: ToggleBlockUserCreateReelDto
	) {
		const message = await this.adminService.toggleBlockUserCreateReel({
			type: body.type,
			userId
		})
		return { message }
	}
}
