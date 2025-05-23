import { Injectable, NotFoundException } from "@nestjs/common"
import { BlockUserRepository } from "@root/_database/repositories/block-user.repository"
import { TokenRepository } from "@root/_database/repositories/token.repository"
import { UserRepository } from "@root/_database/repositories/user.repository"
import { DateTime } from "luxon"
import {
	BlockUserCreateReelType,
	ToggleBlockUserChatDto,
	ToggleBlockUserCreateReelDto,
	UpdateTokensDto
} from "./dtos/payload.dto"

type ToggleBlockUserChatPayload = ToggleBlockUserChatDto & {
	userId: string
}

type ToggleBlockUserCreateReelPayload = ToggleBlockUserCreateReelDto & {
	userId: string
}

@Injectable()
export class AdminService {
	constructor(
		private user: UserRepository,
		private blockUser: BlockUserRepository,
		private token: TokenRepository
	) {}

	// Toggle block user chat
	// - Block user chat in token comment
	// - Block user chat in reel comment
	async toggleBlockUserChat(payload: ToggleBlockUserChatPayload) {
		const { userId, listType } = payload
		const user = await this.user.findById(userId)
		if (!user) throw new NotFoundException("Not found user")

		const messages = await Promise.all(
			listType.map(async type => {
				const existBlock = await this.blockUser.findByType(userId, type)
				if (existBlock) {
					await this.blockUser.deleteById(existBlock.id)
					return `Unblock user ${type} successfully`
				}

				await this.blockUser.create({
					type,
					user: { connect: { id: userId } },
					isPermanent: true
				})
				return `Block user ${type} successfully`
			})
		)

		return { messages }
	}

	//   Toggle block user create reel with options Permanent or Temporary
	async toggleBlockUserCreateReel(payload: ToggleBlockUserCreateReelPayload) {
		const { userId, type } = payload
		const user = await this.user.findById(userId)
		if (!user) throw new NotFoundException("Not found user")
		const existBlock = await this.blockUser.findByType(
			userId,
			"CreateTokenReel"
		)
		if (existBlock) {
			await this.blockUser.deleteById(existBlock.id)
			return "Unlock user create reel successfully"
		}

		if (type === BlockUserCreateReelType.Permanent) {
			await this.blockUser.create({
				type: "CreateTokenReel",
				user: { connect: { id: userId } },
				isPermanent: type === "Permanent"
			})
			return "Block user create reel permanent successfully"
		}

		if (type === BlockUserCreateReelType.Temporary) {
			const now = DateTime.now()
			const BLOCK_DAYS = 3
			const endAt = now.plus({ days: BLOCK_DAYS }).toJSDate()
			await this.blockUser.create({
				type: "CreateTokenReel",
				user: { connect: { id: userId } },
				isPermanent: false,
				endAt
			})
			return `Block user create reel temporary in ${BLOCK_DAYS} days successfully`
		}
	}

	async updateTokens(payload: UpdateTokensDto) {
		const { tokens } = payload
		const tokenIds = tokens.map(item => item.id)
		const existTokens = await this.token.findByIds(tokenIds)
		if (existTokens.length !== tokenIds.length)
			throw new NotFoundException("Not found token")

		const updateTokens = tokens.map(item => {
			return this.token.updateByAdmin(item.id, {
				order: item.order,
				headline: item.headline
			})
		})

		return Promise.all(updateTokens)
	}

	async getListPopularTokens() {
		return this.token.findPopular()
	}
}
