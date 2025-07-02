import {
	Body,
	ClassSerializerInterceptor,
	Controller,
	Get,
	Param,
	ParseUUIDPipe,
	Put,
	Query,
	SerializeOptions,
	UseInterceptors
} from "@nestjs/common"
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger"
import { Auth } from "@root/_shared/utils/decorators"
import { Claims } from "@root/auth/auth.service"
import { Comment as CommentResponse } from "@root/dtos/comment.dto"
import {
	ApiPaginatedResponse,
	PaginatedParams,
	Paginate as PaginatedResponse
} from "@root/dtos/common.dto"
import { UserConnection as UserConnectionResponse } from "@root/dtos/user-connection.dto"
import { User as UserResponse } from "@root/dtos/user.dto"
import { PaginateTokenResponse } from "@root/tokens/dtos/response.dto"
import {
	GetCoinCreatedParams,
	SetInformationPayload
} from "@root/users/dtos/payload.dto"
import {
	CoinHeldsResponse,
	SetInformationUser,
	UserBalanceResponse
} from "@root/users/dtos/response.dto"
import { User } from "@root/users/user.decorator"
import { plainToInstance } from "class-transformer"
import { UsersService } from "./users.service"

@Controller("users")
@ApiTags("users")
@ApiResponse({ status: 401, description: "Unauthorized" })
@ApiResponse({ status: 500, description: "Internal server error" })
export class UsersController {
	constructor(private userService: UsersService) {}

	@Get("me")
	@Auth()
	@ApiOperation({ summary: "Get current user's profile information" })
	@ApiResponse({
		status: 200,
		description: "Successfully retrieved user info",
		type: UserResponse
	})
	async me(@User() { id }: Claims) {
		const user = await this.userService.getMe(id)

		return plainToInstance(UserResponse, user, {
			excludeExtraneousValues: true
		})
	}

	@Get("balance/token/:tokenId")
	@Auth()
	@UseInterceptors(ClassSerializerInterceptor)
	@ApiOperation({ summary: "Get user's token balance" })
	@ApiResponse({
		status: 200,
		type: UserBalanceResponse,
		description: "Successfully retrieved user's token balance"
	})
	@SerializeOptions({
		type: UserBalanceResponse,
		enableImplicitConversion: true,
		excludeExtraneousValues: true
	})
	async getTokenBalance(
		@User() user: Claims,
		@Param("tokenId") tokenId: string
	) {
		return this.userService.getTokenBalance(user.address, tokenId)
	}

	@Get(":id/coin-helds")
	@ApiPaginatedResponse(CoinHeldsResponse)
	@ApiOperation({
		summary: "Get paginated list of tokens held by the current user"
	})
	@ApiResponse({
		status: 200,
		description: "Successfully retrieved user's token holdings",
		type: PaginatedResponse
	})
	async getCoinHelds(
		@Param("id", new ParseUUIDPipe({ version: "4" })) id: string,
		@Query() query: PaginatedParams
	) {
		const { data, total, maxPage } = await this.userService.getCoinHeld(
			id,
			query
		)

		return plainToInstance(
			PaginatedResponse<CoinHeldsResponse>,
			new PaginatedResponse(data, total, maxPage),
			{
				excludeExtraneousValues: true
			}
		)
	}

	@Get(":id/followers")
	@Auth()
	@ApiPaginatedResponse(UserConnectionResponse)
	@ApiOperation({ summary: "Get paginated list of user's followers" })
	@ApiResponse({
		status: 200,
		description: "Successfully retrieved user's followers",
		type: PaginatedResponse
	})
	@ApiResponse({ status: 404, description: "User not found" })
	async getFollower(
		@Param("id", new ParseUUIDPipe({ version: "4" })) id: string,
		@Query() query: PaginatedParams
	) {
		const { total, maxPage, data } = await this.userService.getFollower(
			id,
			query
		)
		return plainToInstance(
			PaginatedResponse<UserConnectionResponse>,
			new PaginatedResponse(data, total, maxPage),
			{
				excludeExtraneousValues: true
			}
		)
	}

	@Get(":id/following")
	@Auth()
	@ApiPaginatedResponse(UserConnectionResponse)
	@ApiOperation({
		summary: "Get paginated list of users that the current user is following"
	})
	@ApiResponse({
		status: 200,
		description: "Successfully retrieved following users",
		type: PaginatedResponse
	})
	@ApiResponse({ status: 404, description: "User not found" })
	async getFollowing(
		@Param("id", new ParseUUIDPipe({ version: "4" })) id: string,
		@Query() query: PaginatedParams
	) {
		const { total, maxPage, data } = await this.userService.getFollowing(
			id,
			query
		)
		return plainToInstance(
			PaginatedResponse<UserConnectionResponse>,
			new PaginatedResponse(data, total, maxPage),
			{
				excludeExtraneousValues: true
			}
		)
	}

	@Get(":id/coin-created")
	@ApiOperation({
		summary: "Get paginated list of tokens created by the current user"
	})
	@ApiResponse({
		status: 200,
		description: "Paginate tokens successfully",
		type: PaginateTokenResponse
	})
	@UseInterceptors(ClassSerializerInterceptor)
	@SerializeOptions({
		type: PaginateTokenResponse,
		enableImplicitConversion: true,
		excludeExtraneousValues: true
	})
	async getCoinCreated(
		@Param("id", new ParseUUIDPipe({ version: "4" })) id: string,
		@Query() query: GetCoinCreatedParams
	) {
		return this.userService.getCoinCreated(id, query)
	}

	@Get(":id/replies")
	@Auth()
	@ApiPaginatedResponse(CommentResponse)
	@ApiOperation({ summary: "Get paginated list of user's comment replies" })
	@ApiResponse({
		status: 200,
		description: "Successfully retrieved user's replies",
		type: PaginatedResponse
	})
	async getReplies(
		@Param("id", new ParseUUIDPipe({ version: "4" })) id: string,
		@Query() query: PaginatedParams
	) {
		const { replies, total, maxPage } = await this.userService.getReplies(
			id,
			query
		)
		return plainToInstance(
			PaginatedResponse<CommentResponse>,
			new PaginatedResponse(replies, total, maxPage),
			{
				excludeExtraneousValues: true
			}
		)
	}

	@Get(":id/balance/sol")
	@UseInterceptors(ClassSerializerInterceptor)
	@ApiOperation({ summary: "Get user's Solana balance" })
	@ApiResponse({
		status: 200,
		type: UserBalanceResponse,
		description: "Successfully retrieved user's Solana balance"
	})
	@SerializeOptions({
		type: UserBalanceResponse,
		enableImplicitConversion: true,
		excludeExtraneousValues: true
	})
	async getSolBalance(@Param("id") id: string) {
		return this.userService.getSolBalance(id)
	}

	@Put()
	@Auth()
	@ApiOperation({ summary: "Update user profile information" })
	@ApiResponse({
		status: 200,
		description: "Successfully updated user information",
		type: SetInformationUser
	})
	@ApiResponse({
		status: 400,
		description: "Username already taken or invalid data"
	})
	async setInformation(
		@User() { id }: Claims,
		@Body() payload: SetInformationPayload
	) {
		const user = await this.userService.setInformation(id, payload)
		return plainToInstance(SetInformationUser, user, {
			excludeExtraneousValues: true
		})
	}

	@Get(":id")
	@ApiOperation({ summary: "Get user's profile information" })
	@ApiResponse({
		status: 200,
		description: "Successfully retrieved user info",
		type: UserResponse
	})
	async getProfile(
		@Param("id", new ParseUUIDPipe({ version: "4" })) id: string
	) {
		const user = await this.userService.getProfile(id)
		return plainToInstance(UserResponse, user, {
			excludeExtraneousValues: true
		})
	}
}
