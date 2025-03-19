import { Injectable, InternalServerErrorException } from "@nestjs/common"
import { UserRepository } from "@root/_database/repositories/user.repository"
import { Env, InjectEnv } from "@root/_env/env.module"

@Injectable()
export class UsersService {
	constructor(
		private userRepository: UserRepository,
		@InjectEnv() private env: Env
	) {}

	async getMe(id: string) {
		const user = await this.userRepository.findById(id)
		if (!user) throw new InternalServerErrorException("not found user")

		return user
	}
}
