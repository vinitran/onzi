import { Controller, Get } from "@nestjs/common"
import { ApiTags } from "@nestjs/swagger"
import { Auth } from "@root/_shared/utils/decorators"
import { Claims } from "@root/auth/auth.service"
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
}
