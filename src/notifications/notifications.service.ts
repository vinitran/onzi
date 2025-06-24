import { Injectable } from "@nestjs/common"
import { TokenTransactionRepository } from "@root/_database/repositories/token-transaction.repository"
import { TokenRepository } from "@root/_database/repositories/token.repository"

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
			data.push({
				token,
				transaction: null
			})
		}

		if (transaction) {
			data.push({
				token: null,
				transaction: transaction
			})
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
