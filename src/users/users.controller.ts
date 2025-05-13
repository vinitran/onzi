import {
	Body,
	Controller,
	Delete,
	Get,
	Param,
	ParseUUIDPipe,
	Post,
	Put,
	Query
} from "@nestjs/common"
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger"
import { Auth } from "@root/_shared/utils/decorators"
import { Claims } from "@root/auth/auth.service"
import { Comment as CommentResponse } from "@root/dtos/comment.dto"
import { ApiPaginatedResponse, PaginatedParams } from "@root/dtos/common.dto"
import { Paginate as PaginatedResponse } from "@root/dtos/common.dto"
import { Token as TokenResponse } from "@root/dtos/token.dto"
import { UserConnection as UserConnectionResponse } from "@root/dtos/user-connection.dto"
import { User as UserResponse } from "@root/dtos/user.dto"
import {
	FollowingPayload,
	GetCoinCreatedParams,
	SetInformationPayload,
	UnfollowingPayload
} from "@root/users/dtos/payload.dto"
import {
	CoinHeldsResponse,
	SetInformationUser
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
	@ApiPaginatedResponse(TokenResponse)
	@ApiOperation({
		summary: "Get paginated list of tokens created by the current user"
	})
	@ApiResponse({
		status: 200,
		description: "Successfully retrieved user's created tokens",
		type: PaginatedResponse
	})
	async getCoinCreated(
		@Param("id", new ParseUUIDPipe({ version: "4" })) id: string,
		@Query() query: GetCoinCreatedParams
	) {
		const { total, maxPage, data } = await this.userService.getCoinCreated(
			id,
			query
		)
		return plainToInstance(
			PaginatedResponse<TokenResponse>,
			new PaginatedResponse(data, total, maxPage),
			{
				excludeExtraneousValues: true
			}
		)
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

	@Post("following")
	@Auth()
	@ApiOperation({ summary: "Follow a user" })
	@ApiResponse({
		status: 201,
		description: "Successfully followed user",
		type: UserConnectionResponse
	})
	@ApiResponse({ status: 400, description: "Already following this user" })
	@ApiResponse({ status: 404, description: "User to follow not found" })
	async following(
		@User() { id }: Claims,
		@Query() { followingId }: FollowingPayload
	) {
		const following = await this.userService.following(id, followingId)
		return plainToInstance(UserConnectionResponse, following, {
			excludeExtraneousValues: true
		})
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

	@Delete("unfollowing")
	@Auth()
	@ApiOperation({ summary: "Unfollow a user" })
	@ApiResponse({
		status: 200,
		description: "Successfully unfollowed user",
		type: UserConnectionResponse
	})
	@ApiResponse({
		status: 403,
		description: "Not authorized to unfollow this user"
	})
	@ApiResponse({ status: 404, description: "Follow connection not found" })
	async unfollowing(
		@User() { id }: Claims,
		@Query() { followId }: UnfollowingPayload
	) {
		const unfollowing = await this.userService.unfollowing(id, followId)
		return plainToInstance(UserConnectionResponse, unfollowing, {
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
