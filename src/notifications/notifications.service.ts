import { Injectable } from "@nestjs/common"
import { TokenTransactionRepository } from "@root/_database/repositories/token-transaction.repository"
import { TokenRepository } from "@root/_database/repositories/token.repository"
import { NotificationDto } from "./dto/notification.dto"

@Injectable()
export class NotificationsService {
	constructor(
		private readonly tokenTransactionRepository: TokenTransactionRepository,
		private readonly tokenRepository: TokenRepository
	) {}

	/* Get latest transaction & created on-chain coin */
	async getLatest() {
		// Get latest transaction and token
		const [transaction, token] = await Promise.all([
			this.tokenTransactionRepository.getLatest(),
			this.tokenRepository.getLatestOnChain()
		])

		// Transform the data to match the DTO structure
		const data = []

		if (token) {
			const tokenDto = new NotificationDto()
			tokenDto.token = {
				id: token.id,
				address: token.address,
				uri: token.uri,
				creator: {
					id: token.creator.id,
					address: token.creator.address,
					avatarUrl: token.creator.avatarUrl
				}
			}
			tokenDto.transaction = null
			data.push(tokenDto)
		}

		if (transaction) {
			const transactionDto = new NotificationDto()
			transactionDto.token = null
			transactionDto.transaction = {
				id: transaction.id,
				signature: transaction.signature,
				tokenAddress: transaction.tokenAddress,
				type: transaction.type,
				createdBy: transaction.createdBy,
				token: transaction.token
			}
			data.push(transactionDto)
		}

		// For simplicity, we're just returning the latest items
		// In a real implementation, you might want to paginate or limit the results
		const total = data.length
		const maxPage = 1 // Since we're just returning the latest items

		return {
			data,
			total,
			maxPage
		}
	}
}
