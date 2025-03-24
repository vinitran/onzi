import {
	BadRequestException,
	ForbiddenException,
	Injectable,
	InternalServerErrorException,
	NotFoundException
} from "@nestjs/common"
import { UserConnectionRepository } from "@root/_database/repositories/user-connection.repository"
import { UserRepository } from "@root/_database/repositories/user.repository"
import { Env, InjectEnv } from "@root/_env/env.module"

@Injectable()
export class UsersService {
	constructor(
		private userRepository: UserRepository,
		private userConnectionRepository: UserConnectionRepository,

		@InjectEnv() private env: Env
	) {}

	async getMe(id: string) {
		const user = await this.userRepository.findById(id)
		if (!user) throw new NotFoundException("not found user")

		return user
	}

	async setUsername(id: string, username: string) {
		const userWithUsername = await this.userRepository.findByUsername(username)
		if (userWithUsername)
			throw new BadRequestException(
				"Username is already taken. Please choose another one."
			)

		const user = await this.userRepository.update(id, { username })
		if (!user) throw new InternalServerErrorException("can not update")

		return user
	}

	async setAvatar(id: string, avatarUrl: string) {
		const user = await this.userRepository.update(id, { avatarUrl })
		if (!user) throw new InternalServerErrorException("can not update")

		return user
	}

	async following(id: string, followingId: string) {
		const followingUser = await this.userRepository.findById(followingId)
		if (!followingUser) throw new NotFoundException("not found following user")

		const existingConnection = await this.userConnectionRepository.find(
			id,
			followingId
		)
		if (existingConnection)
			throw new BadRequestException("You are already following this user")

		return this.userConnectionRepository.create({
			followerId: id,
			followingId: followingUser.id
		})
	}

	async unfollowing(id: string, followId: string) {
		const connection = await this.userConnectionRepository.findById(followId)
		if (!connection) throw new NotFoundException("Follow ID not found")

		if (connection.followerId !== id)
			throw new ForbiddenException(
				"You do not have permission to unfollow this user"
			)

		return this.userConnectionRepository.delete(followId)
	}
}
