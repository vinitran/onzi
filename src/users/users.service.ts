import {
	BadRequestException,
	ForbiddenException,
	Injectable,
	InternalServerErrorException,
	NotFoundException
} from "@nestjs/common"

import { CommentRepository } from "@root/_database/repositories/comment.repository"
import { TokenRepository } from "@root/_database/repositories/token.repository"
import { UserConnectionRepository } from "@root/_database/repositories/user-connection.repository"
import { UserRepository } from "@root/_database/repositories/user.repository"
import { Env, InjectEnv } from "@root/_env/env.module"
import { PaginatedParams } from "@root/dtos/common.dto"
import { S3Service } from "@root/file/file.service"
import { TokenAccount } from "@root/indexer/dtos/tokenAccount.dto"
import { IndexerService } from "@root/indexer/indexer.service"
import {
	GetCoinCreatedParams,
	SetInformationPayload
} from "@root/users/dtos/payload.dto"

@Injectable()
export class UsersService {
	constructor(
		private userRepository: UserRepository,
		private userConnectionRepository: UserConnectionRepository,
		private token: TokenRepository,
		private comment: CommentRepository,
		private s3Service: S3Service,
		private indexer: IndexerService,

		@InjectEnv() private env: Env
	) {}

	async getMe(id: string) {
		const user = await this.userRepository.findById(id)
		if (!user) throw new NotFoundException("not found user")

		return user
	}

	async getCoinHeld(address: string, query: PaginatedParams) {
		const items = await this.indexer.getUserTokenAccounts(address)
		const itemsFilted = items.token_accounts.filter((account: TokenAccount) =>
			account.mint.endsWith("ponz")
		)

		const total = itemsFilted.length
		const maxPage = Math.ceil(total / query.take)
		const start = (query.page - 1) * query.take
		const end = start + query.take
		const data = itemsFilted.slice(start, end)
		return { data, maxPage, total }
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

	async getCoinCreated(address: string, params: GetCoinCreatedParams) {
		const coinCreatedList = await this.token.getCoinCreated(address, {
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

	private extractStringFields(payload: SetInformationPayload): {
		username?: string
		bio?: string
		avatarUrl?: string
		backgroundUrl?: string
	} {
		const result: {
			username?: string
			bio?: string
			avatarUrl?: string
			backgrounfUrl?: string
		} = {}

		if (payload.username) {
			result.username = payload.username
		}

		if (payload.bio) {
			result.bio = payload.bio
		}

		return result
	}

	async setInformation(id: string, payload: SetInformationPayload) {
		if (payload.username) {
			const userWithUsername = await this.userRepository.findByUsername(
				payload.username
			)

			if (userWithUsername)
				throw new BadRequestException(
					"Username is already taken. Please choose another one."
				)
		}

		const updatedPayload = this.extractStringFields(payload)

		if (
			Object.keys(updatedPayload).length === 0 &&
			!payload.updateAvatar &&
			!payload.updateBackground
		) {
			throw new BadRequestException("No valid fields to update.")
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
			updatedPayload.avatarUrl = avatarUrl
			avatarAttachment = { url, fields }
		}

		if (payload.updateBackground) {
			const { backgroundUrl, url, fields } =
				await this.setBackgroundPresignedUrl(id, "image/*")
			updatedPayload.backgroundUrl = backgroundUrl
			backgroundAttachment = { url, fields }
		}

		const user = await this.userRepository.update(id, updatedPayload)

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
}
