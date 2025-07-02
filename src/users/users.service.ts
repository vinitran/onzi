import {
	BadRequestException,
	ForbiddenException,
	Injectable,
	InternalServerErrorException,
	Logger,
	NotFoundException
} from "@nestjs/common"
import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js"

import { Prisma } from "@prisma/client"
import { CommentRepository } from "@root/_database/repositories/comment.repository"
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
import { CoinHeldsResponse } from "@root/users/dtos/response.dto"
import { AccountLayout } from "@solana/spl-token"
import { plainToInstance } from "class-transformer"

@Injectable()
export class UsersService {
	private readonly logger = new Logger(UsersService.name)
	constructor(
		private userRepository: UserRepository,
		private userConnectionRepository: UserConnectionRepository,
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
		const tokenOwnerWhere = {
			amount: {
				gt: 0
			}
		}

		const tokenOwnerInclude = {
			select: {
				amount: true,
				token: {
					select: {
						id: true,
						name: true,
						address: true,
						raydiumStatus: true,
						ticker: true,
						imageUri: true,
						price: true
					}
				}
			},
			where: tokenOwnerWhere,
			orderBy: {
				amount: Prisma.SortOrder.desc
			},
			skip: (query.page - 1) * query.take,
			take: query.take
		}

		const include: Prisma.UserInclude = {
			tokenOwners: tokenOwnerInclude,
			_count: {
				select: {
					tokenOwners: { where: tokenOwnerWhere }
				}
			}
		}

		const user = await this.userRepository.findById(id, include)

		if (!user) throw new NotFoundException("can not find user")

		const data = plainToInstance(CoinHeldsResponse, user.tokenOwners, {
			excludeExtraneousValues: true,
			enableImplicitConversion: true
		})
		const total = user._count.tokenOwners

		return {
			data,
			total,
			maxPage: Math.ceil(total / query.take)
		}
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

	async getCoinCreated(id: string, query: GetCoinCreatedParams) {
		return this.token.getCoinCreated(id, query)
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

			if (userWithUsername)
				throw new BadRequestException(
					"Username is already taken. Please choose another one."
				)

			updateUser.username = payload.username
		}

		let avatarAttachment:
			| { url: string; fields: Record<string, string> }
			| undefined
		let backgroundAttachment:
			| { url: string; fields: Record<string, string> }
			| undefined

		if (payload.contentTypeAvatar) {
			const { avatarUrl, url, fields } = await this.setAvatarPresignedUrl(
				id,
				payload.contentTypeAvatar
			)
			updateUser.avatarUrl = avatarUrl
			avatarAttachment = { url, fields }
		}

		if (payload.contentTypeBackground) {
			const { backgroundUrl, url, fields } =
				await this.setBackgroundPresignedUrl(id, payload.contentTypeBackground)
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

		return { avatarUrl: `${url}${fields.key}`, url, fields }
	}

	async setBackgroundPresignedUrl(id: string, contentType: string) {
		const key = `background-${id}`
		const { url, fields } = await this.s3Service.postPresignedSignedUrl(
			key,
			contentType
		)
		if (!url || !fields)
			throw new InternalServerErrorException("can not get presigned url")

		return { backgroundUrl: `${url}${fields.key}`, url, fields }
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

	async getSolBalance(userId: string) {
		const user = await this.userRepository.findById(userId)
		if (!user) throw new NotFoundException("Not found user")

		const HELIUS_RPC = `https://mainnet.helius-rpc.com/?api-key=${this.env.HELIUS_API_KEY}`
		const isDev = this.env.IS_TEST

		try {
			const publicKey = new PublicKey(user.address)
			const connection = new Connection(
				isDev ? clusterApiUrl("devnet") : HELIUS_RPC,
				"confirmed"
			)
			const wallet = new PublicKey(publicKey)
			const balance = await connection.getBalance(wallet)
			return { balance }
		} catch (error) {
			throw new InternalServerErrorException(error)
		}
	}

	async getTokenBalance(userAddress: string, tokenId: string) {
		const token = await this.token.findById(tokenId)
		if (!token) throw new NotFoundException("Not found token")
		if (!token.bump) throw new BadRequestException("Token is not bumped")

		const HELIUS_RPC = `https://mainnet.helius-rpc.com/?api-key=${this.env.HELIUS_API_KEY}`
		const isDev = this.env.IS_TEST

		try {
			const mintAddress = new PublicKey(token.address)
			const owner = new PublicKey(userAddress)
			const connection = new Connection(
				isDev ? clusterApiUrl("devnet") : HELIUS_RPC,
				"confirmed"
			)

			const tokenAccounts = await connection.getTokenAccountsByOwner(owner, {
				mint: mintAddress
			})

			let totalAmount = 0

			for (const { account } of tokenAccounts.value) {
				const data = AccountLayout.decode(account.data)
				const amount = Number(data.amount)
				totalAmount += amount
			}

			return { balance: totalAmount }
		} catch (_error) {
			throw new InternalServerErrorException("Failed to fetch token balance")
		}
	}
}
