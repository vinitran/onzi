import { Injectable } from "@nestjs/common"
import { Env, InjectEnv } from "@root/_env/env.module"
import { TokenAccountResponse } from "@root/indexer/dto/tokenAccount.dto"
import axios from "axios"

@Injectable()
export class IndexerService {
	private HELIUS_URL = "https://devnet.helius-rpc.com/?api-key="

	constructor(@InjectEnv() private env: Env) {}

	async getTokenAccounts(
		owner: string,
		page = 1,
		limit = 100
	): Promise<TokenAccountResponse> {
		try {
			const response = await axios.post(
				`${this.HELIUS_URL}${this.env.HELIUS_API_KEY}`,
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
}
