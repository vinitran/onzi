import { Injectable, NotFoundException } from "@nestjs/common"
import { BlockCommentRepository } from "@root/_database/repositories/block-comment.repository"
import { BlockUserRepository } from "@root/_database/repositories/block-user.repository"
import { TokenRepository } from "@root/_database/repositories/token.repository"
import { UserRepository } from "@root/_database/repositories/user.repository"
import { Env, InjectEnv } from "@root/_env/env.module"
import { WITHDRAW_CODE_OPTION } from "@root/_shared/constants/admin"
import { Ponz } from "@root/programs/ponz/program"
import { PonzVault } from "@root/programs/vault/program"
import { PublicKey } from "@solana/web3.js"
import bs58 from "bs58"
import { DateTime } from "luxon"
import {
	BlockUserType,
	GetWithdrawalCodeDto,
	PaginateReportedTokensDto,
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
	private ponzMultiSigWallet: string
	constructor(
		private user: UserRepository,
		private blockUser: BlockUserRepository,
		private blockComment: BlockCommentRepository,
		private token: TokenRepository,
		private ponz: Ponz,
		private ponzVault: PonzVault,
		@InjectEnv() private env: Env
	) {
		this.ponzMultiSigWallet = this.env.MULTI_SIG_PUBKEY
	}

	// Toggle block user chat
	// - Block user chat in token comment
	// - Block user chat in reel comment
	async toggleBlockUserChat(payload: ToggleBlockUserChatPayload) {
		const { userId, listType, option } = payload
		const user = await this.user.findById(userId)
		if (!user) throw new NotFoundException("Not found user")

		const messages = await Promise.all(
			listType.map(async type => {
				const existBlock = await this.blockUser.findByType(userId, type)
				if (existBlock) {
					await this.blockUser.deleteById(existBlock.id)
					return `Unblock user ${type} successfully`
				}

				if (option === BlockUserType.Permanent) {
					await this.blockUser.create({
						type: type,
						user: { connect: { id: userId } },
						isPermanent: true
					})

					return `Block user ${option} successfully`
				}

				if (option === BlockUserType.Temporary) {
					const now = DateTime.now()
					const BLOCK_DAYS = 3
					const endAt = now.plus({ days: BLOCK_DAYS }).toJSDate()
					await this.blockUser.create({
						type: type,
						user: { connect: { id: userId } },
						isPermanent: false,
						endAt
					})
					return `Block user ${option} in ${BLOCK_DAYS} days successfully`
				}

				// await this.blockUser.create({
				//   type,
				//   user: { connect: { id: userId } },
				//   isPermanent: true,
				// });
				// return `Block user ${type} successfully`;
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

		if (type === BlockUserType.Permanent) {
			await this.blockUser.create({
				type: "CreateTokenReel",
				user: { connect: { id: userId } },
				isPermanent: type === "Permanent"
			})
			return "Block user create reel permanent successfully"
		}

		if (type === BlockUserType.Temporary) {
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

	async paginateReportedTokens(payload: PaginateReportedTokensDto) {
		const { page, take } = payload

		return this.token.paginateReportedTokens({
			page,
			take
		})
	}

	async softDeleteToken(tokenId: string) {
		const token = await this.token.findById(tokenId)
		if (!token) throw new NotFoundException("Not found token")

		// Soft delete token
		await this.token.softDelete(tokenId)
	}

	// Generate code to withdraw sol
	async generateCodeToWithdraw(payload: GetWithdrawalCodeDto) {
		const { option } = payload
		const ponzMultiSigWallet = new PublicKey(this.ponzMultiSigWallet)

		let code: string | null = null

		if (option === WITHDRAW_CODE_OPTION.PONZ_PLATFORM) {
			const ponzTx = await this.ponz.withdrawFeePool(ponzMultiSigWallet)
			code = bs58.encode(ponzTx.serialize({ requireAllSignatures: false }))
		}

		if (option === WITHDRAW_CODE_OPTION.REWARD_VAULT) {
			const vaultTx = await this.ponzVault.withdrawSol(ponzMultiSigWallet)
			code = bs58.encode(vaultTx.serialize({ requireAllSignatures: false }))
		}

		return {
			code
		}
	}

	//   Get total sol to withdraw
	async getAmountSolToWithdraw() {
		// Get balances in parallel
		const [ponzSolAmount, rewardVaultSolAmount] = await Promise.all([
			this.ponz.connection.getBalance(this.ponz.feePoolPDA),
			this.ponzVault.connection.getBalance(this.ponzVault.solPoolPDA)
		])

		return {
			ponzSolAmount: ponzSolAmount.toString(),
			rewardVaultSolAmount: rewardVaultSolAmount.toString()
		}
	}
}
