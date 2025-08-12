import { Event } from "@coral-xyz/anchor"
import { Injectable, Logger } from "@nestjs/common"
import { TransactionType } from "@prisma/client"
import { SettingRepository } from "@root/_database/repositories/setting.repository"
import { TokenTransactionRepository } from "@root/_database/repositories/token-transaction.repository"
import { Env, InjectEnv } from "@root/_env/env.module"
import { RabbitMQService } from "@root/_rabbitmq/rabbitmq.service"
import { SETTING_KEYS } from "@root/_shared/constants/setting"
import {
	BuyTokensEvent,
	CompleteBondingCurveEvent,
	CreateTokenEvent,
	EVENTS,
	RemoveLiquidityEvent,
	SellTokensEvent
} from "@root/programs/ponz/events"
import { Ponz } from "@root/programs/ponz/program"
import { Raydium, RaydiumEvent } from "@root/programs/raydium/program"
import WebSocket from "ws"

@Injectable()
export class IndexerService {
	private HELIUS_RPC: string
	private HELIUS_WS: string

	constructor(
		@InjectEnv() private env: Env,
		private ponz: Ponz,
		private raydium: Raydium,
		private readonly settingRepository: SettingRepository,
		private readonly tokenTransactionRepository: TokenTransactionRepository,
		private readonly rabbitMQService: RabbitMQService
	) {
		this.HELIUS_RPC =
			this.env.IS_TEST === "true"
				? `https://devnet.helius-rpc.com/?api-key=${this.env.HELIUS_API_KEY}`
				: `https://mainnet.helius-rpc.com/?api-key=${this.env.HELIUS_API_KEY}`

		this.HELIUS_WS =
			this.env.IS_TEST === "true"
				? `wss://devnet.helius-rpc.com/?api-key=${this.env.HELIUS_API_KEY}`
				: `wss://mainnet.helius-rpc.com/?api-key=${this.env.HELIUS_API_KEY}`
	}

	private async handleRaydiumEvents(data: RaydiumEvent) {
		switch (data.type) {
			case "Buy":
				if (await this.isExistEvent(data.signature, data.type)) {
					break
				}
				await this.rabbitMQService.emit(
					"blockchain",
					EVENTS.BuyTokensRaydium,
					data
				)
				break

			case "Sell":
				if (await this.isExistEvent(data.signature, data.type)) {
					break
				}
				await this.rabbitMQService.emit(
					"blockchain",
					EVENTS.SellTokensRaydium,
					data
				)
				break
		}
	}

	private async handlePonzEvents(logData: Event[], signature: string) {
		try {
			for await (const log of logData) {
				switch (log.name) {
					case EVENTS.CreateToken: {
						const event = {
							...log.data,
							signature,
							type: "Create"
						} as CreateTokenEvent
						if (await this.isExistEvent(signature, event.type)) {
							break
						}
						await this.rabbitMQService.emit(
							"blockchain",
							EVENTS.CreateToken,
							event
						)
						break
					}

					case EVENTS.BuyTokens: {
						const event = {
							...log.data,
							signature,
							type: "Buy"
						} as BuyTokensEvent
						if (await this.isExistEvent(signature, event.type)) {
							break
						}
						await this.rabbitMQService.emit(
							"blockchain",
							EVENTS.BuyTokens,
							event
						)
						break
					}

					case EVENTS.SellTokens: {
						const event = {
							...log.data,
							signature,
							type: "Sell"
						} as SellTokensEvent
						if (await this.isExistEvent(signature, event.type)) {
							break
						}
						await this.rabbitMQService.emit(
							"blockchain",
							EVENTS.SellTokens,
							event
						)
						break
					}

					case EVENTS.CompleteBondingCurve: {
						const event = {
							...log.data,
							signature,
							type: "CompleteBondingCurve"
						} as CompleteBondingCurveEvent
						if (await this.isExistEvent(signature, event.type)) {
							break
						}
						await this.rabbitMQService.emit(
							"raydium",
							EVENTS.CompleteBondingCurve,
							event
						)
						break
					}

					case EVENTS.RemoveLiquidity: {
						const event = {
							...log.data,
							signature,
							type: "RemoveLiquidity"
						} as RemoveLiquidityEvent
						if (await this.isExistEvent(signature, event.type)) {
							break
						}
						await this.rabbitMQService.emit(
							"raydium",
							EVENTS.RemoveLiquidity,
							event
						)
						break
					}

					default: {
						break
					}
				}
			}
		} catch (error) {
			Logger.error(
				`Error processing Ponz events for signature ${signature}:`,
				error
			)
			throw error
		}
	}

	connectToWebSocketSolana() {
		const subcribe = (
			address: string,
			func: (signature: string, logs: string[]) => Promise<void>
		) => {
			const wsSolana = new WebSocket(this.HELIUS_WS)

			wsSolana.on("open", () => {
				wsSolana.send(
					JSON.stringify({
						jsonrpc: "2.0",
						id: 1,
						method: "logsSubscribe",
						params: [
							{
								mentions: [address]
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
						const signature = parsedData.params.result.value.signature
						const logs = parsedData?.params?.result?.value?.logs as string[]
						await func(signature, logs)
					}
				} catch (error) {
					Logger.error("Error processing WebSocket message:", error)
				}
			})

			wsSolana.on("close", () => {
				Logger.log("WebSocket connection closed. Reconnecting...")
				subcribe(address, func)
			})

			wsSolana.on("error", error => {
				Logger.error("WebSocket error:", error)
			})
		}

		subcribe(this.env.CONTRACT_ADDRESS, this.getPonzLogs)

		// subcribe(this.env.RAYDIUM_CONTRACT_ADDRESS, this.getRaydiumLogs)
	}

	getPonzLogs = async (signature: string, logs?: string[]) => {
		const logData = Array.from(this.ponz.parseLogs(logs!))
		await this.handlePonzEvents(logData, signature)
	}

	getRaydiumLogs = async (signature: string, _logs?: string[]) => {
		const data = await this.raydium.handleSwapFromSignature(signature)
		if (!data) return
		await this.handleRaydiumEvents(data)
	}

	async scannerPonz() {
		const setting = await this.settingRepository.findByKey(
			SETTING_KEYS.LATEST_SIGNATURE_SCANNED_PONZ
		)

		let latestSignatureScanned: string

		if (setting?.value) {
			latestSignatureScanned = setting.value
		} else {
			latestSignatureScanned = this.env.PONZ_DEPLOYED_SIGNATURE

			await this.settingRepository.set(
				SETTING_KEYS.LATEST_SIGNATURE_SCANNED_PONZ,
				latestSignatureScanned
			)
		}

		await this.fetchSignatures(
			latestSignatureScanned,
			this.env.CONTRACT_ADDRESS,
			SETTING_KEYS.LATEST_SIGNATURE_SCANNED_PONZ,
			this.getPonzLogs,
			this.processSignatures
		)
	}

	async scannerRaydium() {
		const setting = await this.settingRepository.findByKey(
			SETTING_KEYS.LATEST_SIGNATURE_SCANNED_RAYDIUM
		)

		let latestSignatureScanned: string

		if (setting?.value) {
			latestSignatureScanned = setting.value
		} else {
			latestSignatureScanned = this.env.PONZ_DEPLOYED_SIGNATURE

			await this.settingRepository.set(
				SETTING_KEYS.LATEST_SIGNATURE_SCANNED_RAYDIUM,
				latestSignatureScanned
			)
		}

		await this.fetchSignatures(
			latestSignatureScanned,
			this.env.RAYDIUM_CONTRACT_ADDRESS,
			SETTING_KEYS.LATEST_SIGNATURE_SCANNED_RAYDIUM,
			this.getRaydiumLogs,
			this.processSignatures
		)
	}

	private async isExistEvent(signature: string, type: TransactionType) {
		const tokenBySig = await this.tokenTransactionRepository.findBySignature(
			signature,
			type
		)

		return !!tokenBySig
	}

	private async fetchSignatures(
		fromSignature: string,
		address: string,
		key: string,
		getLogsFunc: (signature: string, logs?: string[]) => Promise<void>,
		getSignatureFunc: (
			signatures: string[],
			getLogsFunc: (signature: string, logs?: string[]) => Promise<void>
		) => Promise<void>
	) {
		let currentSignature = fromSignature
		let hasMore = true

		while (hasMore) {
			const payload = {
				jsonrpc: "2.0",
				id: "1",
				method: "getSignaturesForAddress",
				params: [
					address,
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

				const signatures = result
					.map((tx: { signature: string }) => tx.signature)
					.reverse()

				const nonExistentSignatures =
					await this.tokenTransactionRepository.findNonExistentSignatures(
						signatures
					)

				if (nonExistentSignatures.length > 0) {
					await getSignatureFunc(nonExistentSignatures, getLogsFunc)
				}

				// Update the latest signature scanned
				const latestSignature = signatures[signatures.length - 1]
				await this.settingRepository.set(key, latestSignature)

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

	private processSignatures = async (
		signatures: string[],
		func: (signature: string, logs?: string[]) => Promise<void>
	) => {
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

				await func(signature, result.meta.logMessages)
			} catch (error) {
				console.error(`Error processing signature ${signature}:`, error)
			}
		}
	}
}
