import { Event } from "@coral-xyz/anchor"
import { Injectable } from "@nestjs/common"
import { SettingRepository } from "@root/_database/repositories/setting.repository"
import { TokenTransactionRepository } from "@root/_database/repositories/token-transaction.repository"
import { Env, InjectEnv } from "@root/_env/env.module"
import { RabbitMQService } from "@root/_rabbitmq/rabbitmq.service"
import { SETTING_KEYS } from "@root/_shared/constants/setting"
import { TokenAccountResponse } from "@root/indexer/dtos/tokenAccount.dto"
import {
	BuyTokensEvent,
	CreateTokenEvent,
	EVENTS,
	SellTokensEvent
} from "@root/programs/ponz/events"
import { Ponz } from "@root/programs/ponz/program"
import axios from "axios"
import WebSocket from "ws"

@Injectable()
export class IndexerService {
	private HELIUS_RPC =
		this.env.IS_TEST === "true"
			? `https://devnet.helius-rpc.com/?api-key=${this.env.HELIUS_API_KEY}`
			: `https://mainnet.helius-rpc.com/?api-key=${this.env.HELIUS_API_KEY}`

	private HELIUS_WS =
		this.env.IS_TEST === "true"
			? `wss://devnet.helius-rpc.com/?api-key=${this.env.HELIUS_API_KEY}`
			: `wss://mainnet.helius-rpc.com/?api-key=${this.env.HELIUS_API_KEY}`

	constructor(
		@InjectEnv() private env: Env,
		private ponz: Ponz,
		private readonly settingRepository: SettingRepository,
		private readonly tokenTransactionRepository: TokenTransactionRepository,
		private readonly rabbitMQService: RabbitMQService
	) {}

	private async handlePonzEvents(logData: Event[], signature: string) {
		try {
			for await (const log of logData) {
				switch (log.name) {
					case EVENTS.CreateToken: {
						const event = log.data as CreateTokenEvent
						await this.rabbitMQService.emit(EVENTS.CreateToken, {
							event,
							signature
						})
						break
					}

					case EVENTS.BuyTokens: {
						const event = log.data as BuyTokensEvent
						await this.rabbitMQService.emit(EVENTS.BuyTokens, {
							event,
							signature
						})
						break
					}

					case EVENTS.SellTokens: {
						const event = log.data as SellTokensEvent
						await this.rabbitMQService.emit(EVENTS.SellTokens, {
							event,
							signature
						})
						break
					}

					default: {
						break
					}
				}
			}
		} catch (error) {
			console.error(
				`Error processing Ponz events for signature ${signature}:`,
				error
			)
			throw error
		}
	}

	connectToWebSocketSolana() {
		const wsSolana = new WebSocket(this.HELIUS_WS)

		wsSolana.on("open", () => {
			wsSolana.send(
				JSON.stringify({
					jsonrpc: "2.0",
					id: 1,
					method: "logsSubscribe",
					params: [
						{
							mentions: [this.env.CONTRACT_ADDRESS]
						},
						{
							commitment: "finalized"
						}
					]
				})
			)
		})

		wsSolana.on("message", async (data: string) => {
			try {
				const parsedData = JSON.parse(data)
				if (parsedData?.params?.result?.value?.logs) {
					const logData = Array.from(
						this.ponz.parseLogs(parsedData.params.result.value.logs)
					)
					const signature = parsedData.params.result.value.signature
					await this.handlePonzEvents(logData, signature)
				}
			} catch (error) {
				console.error("Error processing WebSocket message:", error)
			}
		})

		wsSolana.on("close", () => {
			console.log("WebSocket connection closed. Reconnecting...")
			this.connectToWebSocketSolana()
		})

		wsSolana.on("error", error => {
			console.error("WebSocket error:", error)
		})
	}

	async scannerSolana() {
		const setting = await this.settingRepository.findByKey(
			SETTING_KEYS.LATEST_SIGNATURE_SCANNED
		)

		let latestSignatureScanned: string

		if (setting?.value) {
			latestSignatureScanned = setting.value
		} else {
			latestSignatureScanned = this.env.PONZ_DEPLOYED_SIGNATURE

			await this.settingRepository.set(
				SETTING_KEYS.LATEST_SIGNATURE_SCANNED,
				latestSignatureScanned
			)
		}

		await this.fetchSignatures(latestSignatureScanned)
	}

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

	private async fetchSignatures(fromSignature: string) {
		let currentSignature = fromSignature
		let hasMore = true

		while (hasMore) {
			const payload = {
				jsonrpc: "2.0",
				id: "1",
				method: "getSignaturesForAddress",
				params: [
					this.env.CONTRACT_ADDRESS,
					{
						commitment: "finalized",
						limit: 1000,
						until: currentSignature
					}
				]
			}

			try {
				const response = await fetch(this.HELIUS_RPC, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(payload)
				})

				const { result } = await response.json()

				if (!result || result.length === 0) {
					hasMore = false
					break
				}

				const signatures = result.map(
					(tx: { signature: string }) => tx.signature
				)

				const nonExistentSignatures =
					await this.tokenTransactionRepository.findNonExistentSignatures(
						signatures
					)

				if (nonExistentSignatures.length > 0) {
					await this.processSignatures(nonExistentSignatures)
				}

				// Update the latest signature scanned
				const latestSignature = result[result.length - 1].signature
				await this.settingRepository.set(
					SETTING_KEYS.LATEST_SIGNATURE_SCANNED,
					latestSignature
				)

				// If we got less than 1000 results, we've reached the end
				if (result.length < 1000 || nonExistentSignatures.length === 0) {
					hasMore = false
				} else {
					// Update current signature for next iteration
					currentSignature = latestSignature
				}
			} catch (error) {
				console.error("Error fetching signatures:", error)
				hasMore = false
			}
		}
	}

	private async processSignatures(signatures: string[]) {
		for (const signature of signatures) {
			try {
				const payload = {
					jsonrpc: "2.0",
					id: "1",
					method: "getTransaction",
					params: [
						signature,
						{
							commitment: "finalized",
							maxSupportedTransactionVersion: 0
						}
					]
				}

				const response = await fetch(this.HELIUS_RPC, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(payload)
				})

				const data = await response.json()
				const result = data.result

				if (!result) {
					console.warn(`No result for signature: ${signature}`)
					continue
				}

				if (!result?.meta?.logMessages) continue

				const logData = Array.from(this.ponz.parseLogs(result.meta.logMessages))
				await this.handlePonzEvents(logData, signature)
				console.log("handler", signature)
			} catch (error) {
				console.error(`Error processing signature ${signature}:`, error)
			}
		}
	}
}
