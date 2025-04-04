import { Injectable } from "@nestjs/common"
import { Env, InjectEnv } from "@root/_env/env.module"
import { TokenAccountResponse } from "@root/indexer/dto/tokenAccount.dto"
import axios from "axios"

@Injectable()
export class IndexerService {
	private HELIUS_RPC =
		this.env.IS_TEST === "true"
			? `https://devnet.helius-rpc.com/?api-key=${this.env.HELIUS_API_KEY}`
			: `https://mainnet.helius-rpc.com/?api-key=${this.env.HELIUS_API_KEY}`

	constructor(@InjectEnv() private env: Env) {}

	async getUserTokenAccounts(
		owner: string,
		page = 1,
		limit = 100
	): Promise<TokenAccountResponse> {
		try {
			const response = await axios.post(
				this.HELIUS_RPC,
				{
					jsonrpc: "2.0",
					id: "",
					method: "getTokenAccounts",
					params: {
						owner,
						page,
						limit
					}
				},
				{
					headers: {
						"Content-Type": "application/json"
					}
				}
			)

			return response.data.result
		} catch (error) {
			console.error("Error fetching token accounts:", error)
			throw error
		}
	}

	async getTokenHoldersByPage(mint: string, page = 1, limit = 1000) {
		try {
			const response = await axios.post(
				this.HELIUS_RPC,
				{
					jsonrpc: "2.0",
					id: "",
					method: "getTokenAccounts",
					params: {
						page,
						limit,
						mint
					}
				},
				{
					headers: {
						"Content-Type": "application/json"
					}
				}
			)

			if (
				!response.data.result ||
				response.data.result.token_accounts.length === 0
			) {
				return
			}

			return response.data.result.token_accounts.map(
				(account: { owner: string }) => account.owner
			) as string[]
		} catch (error) {
			console.error("Error fetching token holders:", error)
			throw error
		}
	}
}
