import {
	Body,
	ClassSerializerInterceptor,
	Controller,
	Get,
	Param,
	ParseUUIDPipe,
	Post,
	Put,
	Query,
	SerializeOptions,
	UseInterceptors
} from "@nestjs/common"
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger"
import { Auth } from "@root/_shared/utils/decorators"
import { Claims } from "@root/auth/auth.service"
import { Reel as ReelResponse } from "@root/dtos/reel.dto"
import { User } from "@root/users/user.decorator"
import { CreateReelPayload, PaginateListReelParams } from "./dtos/payload.dto"
import { CreateReelResponse, PaginateReelResponse } from "./dtos/response.dto"
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
	@ApiResponse({
		status: 201,
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
		@Body() body: CreateReelPayload
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
		description: "Paginate reels successfully",
		type: PaginateReelResponse
	})
	@SerializeOptions({
		type: PaginateReelResponse,
		enableImplicitConversion: true,
		excludeExtraneousValues: true
	})
	async paginate(
		@Param("tokenId", ParseUUIDPipe) tokenId: string,
		@Query() query: PaginateListReelParams
	) {
		return this.reelsService.paginate({ ...query, tokenId })
	}

	@Put(":id")
	@ApiOperation({ summary: "Create a new reel by creator token" })
	@ApiResponse({
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
}
