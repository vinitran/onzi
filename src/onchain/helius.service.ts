import { Injectable, Logger } from "@nestjs/common"
import { Env, InjectEnv } from "@root/_env/env.module"
import WebSocket from "ws"

export type TokenHolder = {
	address: string
	amount: bigint
}

@Injectable()
export class HeliusService {
	private readonly heliusRpcUrl: string
	private readonly heliusWebsocket: string

	constructor(@InjectEnv() private readonly env: Env) {
		this.heliusRpcUrl =
			this.env.IS_TEST === "true"
				? `https://devnet.helius-rpc.com/?api-key=${this.env.HELIUS_API_KEY}`
				: `https://mainnet.helius-rpc.com/?api-key=${this.env.HELIUS_API_KEY}`

		this.heliusWebsocket =
			this.env.IS_TEST === "true"
				? `wss://devnet.helius-rpc.com/?api-key=${this.env.HELIUS_API_KEY}`
				: `wss://mainnet.helius-rpc.com/?api-key=${this.env.HELIUS_API_KEY}`
	}

	/**
	 * Private helper to send JSON-RPC requests
	 */
	private async sendJsonRpcRequest<T>(payload: T) {
		try {
			const response = await fetch(this.heliusRpcUrl, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload)
			})
			return await response.json()
		} catch (error) {
			Logger.error("Error in sendJsonRpcRequest:", error)
			return undefined
		}
	}

	async logsSubscribe(
		contractAddresses: string[],
		func: (data: string) => Promise<void>,
		commitment = "finalized"
	) {
		const wsSolana = new WebSocket(this.heliusWebsocket)

		wsSolana.on("open", () => {
			wsSolana.send(
				JSON.stringify({
					jsonrpc: "2.0",
					id: 1,
					method: "logsSubscribe",
					params: [
						{
							mentions: contractAddresses
						},
						{
							commitment
						}
					]
				})
			)
		})

		wsSolana.on("message", async (data: string) => {
			await func(data)
		})

		wsSolana.on("close", () => {
			Logger.log("WebSocket connection closed. Reconnecting...")
			this.logsSubscribe(contractAddresses, func, commitment)
		})

		wsSolana.on("error", error => {
			Logger.error("WebSocket error:", error)
		})
	}

	async getTokenHolders(mintAddress: string): Promise<TokenHolder[]> {
		let holders: TokenHolder[] = []
		let page = 1
		const pageSize = 1000

		while (true) {
			const pageHolders = await this.fetchTokenHoldersByPage(
				mintAddress,
				page,
				pageSize
			)
			if (!pageHolders || pageHolders.length === 0) break
			holders = holders.concat(pageHolders)
			if (pageHolders.length < pageSize) break
			page++
		}

		return [...new Set(holders)]
	}

	async getListSignature(from: string, commitment = "finalized") {
		const payload = {
			jsonrpc: "2.0",
			id: "1",
			method: "getSignaturesForAddress",
			params: [
				this.env.CONTRACT_ADDRESS,
				{
					commitment,
					limit: 1000,
					until: from
				}
			]
		}

		try {
			const data = await this.sendJsonRpcRequest(payload)
			const result = data?.result
			if (!result || result.length === 0) {
				return
			}
			return result
				.map((tx: { signature: string }) => tx.signature)
				.reverse() as string[]
		} catch (error) {
			Logger.error("Error in getListSignature:", error)
			return
		}
	}

	async getLogsTransaction(signature: string, commitment = "finalized") {
		const payload = {
			jsonrpc: "2.0",
			id: "1",
			method: "getTransaction",
			params: [
				signature,
				{
					commitment,
					maxSupportedTransactionVersion: 0
				}
			]
		}

		try {
			const data = await this.sendJsonRpcRequest(payload)
			const result = data?.result
			if (!result) {
				Logger.warn(`No result for signature: ${signature}`)
				return
			}
			return (result?.meta?.logMessages as string[]) || undefined
		} catch (error) {
			Logger.error("Error in getLogsTransaction:", error)
			return
		}
	}

	private async fetchTokenHoldersByPage(
		mint: string,
		page = 1,
		limit = 1000
	): Promise<TokenHolder[] | undefined> {
		const payload = {
			jsonrpc: "2.0",
			id: "",
			method: "getTokenAccounts",
			params: {
				page,
				limit,
				mint
			}
		}
		try {
			const data = await this.sendJsonRpcRequest(payload)
			const tokenAccounts = data?.result?.token_accounts
			if (!tokenAccounts || tokenAccounts.length === 0) {
				return
			}
			return tokenAccounts.map(
				(account: { owner: string; amount: number }) => ({
					address: account.owner,
					amount: BigInt(account.amount)
				})
			) as TokenHolder[]
		} catch (error) {
			Logger.error("Error fetching token holders:", error)
			throw error
		}
	}
}
