import { Controller, Delete, Get, Post, Query } from "@nestjs/common"
import { ApiTags } from "@nestjs/swagger"
import { Auth } from "@root/_shared/utils/decorators"
import { PaginatedParams, PaginatedResponse } from "@root/_shared/utils/parsers"
import { Claims } from "@root/auth/auth.service"
import {
	FollowingPayload,
	UnfollowingPayload,
	UserConnectionResponse
} from "@root/users/dto/user-connection.dto"
import {
	AvatarPresignedUrlResponse,
	SetInformationPayload,
	TokenResponse,
	UserResponse
} from "@root/users/dto/user.dto"
import { User } from "@root/users/user.decorator"
import { plainToInstance } from "class-transformer"
import { UsersService } from "./users.service"

@Controller("users")
@ApiTags("users")
export class UsersController {
	constructor(private userService: UsersService) {}

	@Get("me")
	@Auth()
	async me(@User() { id }: Claims) {
		const user = await this.userService.getMe(id)
		return plainToInstance(UserResponse, user, {
			excludeExtraneousValues: true
		})
	}

	@Get("followers")
	@Auth()
	async getFollower(@User() { id }: Claims, @Query() query: PaginatedParams) {
		const { total, maxPage, connections } = await this.userService.getFollower(
			id,
			query
		)
		return plainToInstance(
			PaginatedResponse<UserConnectionResponse>,
			new PaginatedResponse(connections, total, maxPage),
			{
				excludeExtraneousValues: true
			}
		)
	}

	@Get("following")
	@Auth()
	async getFollowing(@User() { id }: Claims, @Query() query: PaginatedParams) {
		const { total, maxPage, connections } = await this.userService.getFollowing(
			id,
			query
		)
		return plainToInstance(
			PaginatedResponse<UserConnectionResponse>,
			new PaginatedResponse(connections, total, maxPage),
			{
				excludeExtraneousValues: true
			}
		)
	}

	@Get("coinCreated")
	@Auth()
	async getCoinCreated(
		@User() { address }: Claims,
		@Query() query: PaginatedParams
	) {
		const { total, maxPage, coinCreated } =
			await this.userService.getCoinCreated(address, query)
		return plainToInstance(
			PaginatedResponse<TokenResponse>,
			new PaginatedResponse(coinCreated, total, maxPage),
			{
				excludeExtraneousValues: true
			}
		)
	}

	@Get("avatar/presignedUrl")
	@Auth()
	async setAvatarPresignedUrl(@User() { id }: Claims) {
		const presignedUrl = await this.userService.setAvatarPresignedUrl(id)
		return plainToInstance(AvatarPresignedUrlResponse, presignedUrl, {
			excludeExtraneousValues: true
		})
	}

	@Post("following")
	@Auth()
	async following(
		@User() { id }: Claims,
		@Query() { followingId }: FollowingPayload
	) {
		const following = await this.userService.following(id, followingId)
		return plainToInstance(UserConnectionResponse, following, {
			excludeExtraneousValues: true
		})
	}

	@Post("/infor")
	@Auth()
	async setUsername(
		@User() { id }: Claims,
		@Query() payload: SetInformationPayload
	) {
		const user = await this.userService.setInformation(id, payload)
		return plainToInstance(UserResponse, user, {
			excludeExtraneousValues: true
		})
	}

	@Delete("unfollowing")
	@Auth()
	async unfollowing(
		@User() { id }: Claims,
		@Query() { followId }: UnfollowingPayload
	) {
		const unfollowing = await this.userService.unfollowing(id, followId)
		return plainToInstance(UserConnectionResponse, unfollowing, {
			excludeExtraneousValues: true
		})
	}
}
