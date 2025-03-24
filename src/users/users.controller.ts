import { Controller, Delete, Get, Post, Query } from "@nestjs/common"
import { ApiTags } from "@nestjs/swagger"
import { Auth } from "@root/_shared/utils/decorators"
import { Claims } from "@root/auth/auth.service"
import {
	FollowingPayload,
	UnfollowingPayload,
	UserConnection
} from "@root/users/dto/user-connection.dto"
import { UserResponse } from "@root/users/dto/user.dto"
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

	@Post("following")
	@Auth()
	async following(
		@User() { id }: Claims,
		@Query() { followingId }: FollowingPayload
	) {
		const following = await this.userService.following(id, followingId)
		return plainToInstance(UserConnection, following, {
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
		return plainToInstance(UserConnection, unfollowing, {
			excludeExtraneousValues: true
		})
	}
}
