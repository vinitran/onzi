import { Injectable } from "@nestjs/common"
import { TokenTransactionRepository } from "@root/_database/repositories/token-transaction.repository"
import { TokenRepository } from "@root/_database/repositories/token.repository"

@Injectable()
export class NotificationsService {
	constructor(
		private tokenTransaction: TokenTransactionRepository,
		private token: TokenRepository
	) {}

	/* Get latest transaction & created on-chain coin */
	async getLatest() {
		const getLatestOnChainToken = this.token.getLatestOnChain()
		const getLatestTransaction = this.tokenTransaction.getLatest()

		const [transaction, token] = await Promise.all([
			getLatestTransaction,
			getLatestOnChainToken
		])

		return {
			token,
			transaction
		}
	}
}
