import {
	BadRequestException,
	ForbiddenException,
	Injectable,
	InternalServerErrorException,
	NotFoundException
} from "@nestjs/common"

import { Prisma } from "@prisma/client"
import { CommentRepository } from "@root/_database/repositories/comment.repository"
import { TokenOwnerRepository } from "@root/_database/repositories/token-owner.repository"
import { TokenRepository } from "@root/_database/repositories/token.repository"
import { UserConnectionRepository } from "@root/_database/repositories/user-connection.repository"
import { UserRepository } from "@root/_database/repositories/user.repository"
import { Env, InjectEnv } from "@root/_env/env.module"
import { PaginatedParams } from "@root/dtos/common.dto"
import { S3Service } from "@root/file/file.service"
import {
	GetCoinCreatedParams,
	SetInformationPayload
} from "@root/users/dtos/payload.dto"

@Injectable()
export class UsersService {
	constructor(
		private userRepository: UserRepository,
		private userConnectionRepository: UserConnectionRepository,
		private tokenOwnerRepository: TokenOwnerRepository,
		private token: TokenRepository,
		private comment: CommentRepository,
		private s3Service: S3Service,

		@InjectEnv() private env: Env
	) {}

	async getMe(id: string) {
		const user = await this.userRepository.findById(id)
		if (!user) throw new NotFoundException("not found user")

		return user
	}

	async getCoinHeld(id: string, query: PaginatedParams) {
		const user = await this.userRepository.findById(id)

		if (!user) throw new NotFoundException("can not find user")

		return this.tokenOwnerRepository.getBalance(user.address, query)
	}

	async getFollower(id: string, query: PaginatedParams) {
		const connections = await this.userConnectionRepository.getConnection(
			id,
			"follower",
			query
		)
		if (!connections) throw new NotFoundException("can not find connections")

		return connections
	}

	async getFollowing(id: string, query: PaginatedParams) {
		const connections = await this.userConnectionRepository.getConnection(
			id,
			"following",
			query
		)
		if (!connections) throw new NotFoundException("can not find connections")

		return connections
	}

	async getCoinCreated(id: string, params: GetCoinCreatedParams) {
		const coinCreatedList = await this.token.getCoinCreated(id, {
			take: params.take,
			page: params.page
		})
		if (!coinCreatedList)
			throw new NotFoundException("can not find connections")

		return coinCreatedList
	}

	async getReplies(id: string, query: PaginatedParams) {
		const replies = await this.comment.findReplyByUserId(id, query)
		if (!replies) throw new NotFoundException("can not find replies")

		return replies
	}

	async setInformation(id: string, payload: SetInformationPayload) {
		const social = {
			telegramLink: payload.telegramLink,
			twitterLink: payload.twitterLink,
			instagramLink: payload.instagramLink,
			tiktokLink: payload.tiktokLink,
			onlyFansLink: payload.onlyFansLink
		}

		const updateUser: Prisma.UserUpdateInput = {
			bio: payload.bio,
			social: {
				upsert: {
					update: social,
					create: social
				}
			}
		}

		if (payload.username) {
			const [user, userWithUsername] = await Promise.all([
				this.userRepository.findById(id),
				await this.userRepository.findByUsername(payload.username)
			])

			if (!user) throw new NotFoundException("not found user")

			if (user.usernameChangeCount > 3)
				throw new InternalServerErrorException(
					"can not change username more than 2 times"
				)

			if (userWithUsername)
				throw new BadRequestException(
					"Username is already taken. Please choose another one."
				)

			updateUser.username = payload.username
			updateUser.usernameChangeCount = user.usernameChangeCount + 1
		}

		let avatarAttachment:
			| { url: string; fields: Record<string, string> }
			| undefined
		let backgroundAttachment:
			| { url: string; fields: Record<string, string> }
			| undefined

		if (payload.updateAvatar) {
			const { avatarUrl, url, fields } = await this.setAvatarPresignedUrl(
				id,
				"image/*"
			)
			updateUser.avatarUrl = avatarUrl
			avatarAttachment = { url, fields }
		}

		if (payload.updateBackground) {
			const { backgroundUrl, url, fields } =
				await this.setBackgroundPresignedUrl(id, "image/*")
			updateUser.backgroundUrl = backgroundUrl
			backgroundAttachment = { url, fields }
		}

		const user = await this.userRepository.update(id, updateUser)

		if (!user) throw new InternalServerErrorException("can not update")

		return { user, avatarAttachment, backgroundAttachment }
	}

	async setAvatarPresignedUrl(id: string, contentType: string) {
		const key = `avatar-${id}`
		const { url, fields } = await this.s3Service.postPresignedSignedUrl(
			key,
			contentType
		)
		if (!url || !fields)
			throw new InternalServerErrorException("can not get presigned url")

		return { avatarUrl: `${url}${key}`, url, fields }
	}

	async setBackgroundPresignedUrl(id: string, contentType: string) {
		const key = `background-${id}`
		const { url, fields } = await this.s3Service.postPresignedSignedUrl(
			key,
			contentType
		)
		if (!url || !fields)
			throw new InternalServerErrorException("can not get presigned url")

		return { backgroundUrl: `${url}${key}`, url, fields }
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

	async getProfile(id: string) {
		const user = await this.userRepository.findById(id)
		if (!user) throw new NotFoundException("not found user")

		return user
	}
}
