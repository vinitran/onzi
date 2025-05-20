import {
	Body,
	ClassSerializerInterceptor,
	Controller,
	Param,
	ParseUUIDPipe,
	Post,
	Put,
	SerializeOptions,
	UseInterceptors
} from "@nestjs/common"
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger"
import { Admin } from "@root/_shared/utils/decorators"
import { AdminService } from "./admin.service"
import {
	ToggleBlockUserChatDto,
	ToggleBlockUserCreateReelDto,
	UpdateTokensDto
} from "./dtos/payload.dto"
import {
	ToggleBlockUserChatResponse,
	ToggleBlockUserCreateReelResponse,
	UpdateTokensResponse
} from "./dtos/response.dto"

@Controller("admin")
@Admin()
@ApiTags("admin")
@ApiResponse({ status: 401, description: "Unauthorized" })
@ApiResponse({ status: 404, description: "User not found" })
@UseInterceptors(ClassSerializerInterceptor)
export class AdminController {
	constructor(private readonly adminService: AdminService) {}

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

	@Post(":userId/toggle-block-user-chat")
	@ApiOperation({
		summary: "Toggle block user create chat in all platform(token, reel)"
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
