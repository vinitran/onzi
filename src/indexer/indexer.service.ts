import { Event } from "@coral-xyz/anchor"
import { Injectable, Logger } from "@nestjs/common"
import { TransactionType } from "@prisma/client"
import { SettingRepository } from "@root/_database/repositories/setting.repository"
import { TokenTransactionRepository } from "@root/_database/repositories/token-transaction.repository"
import { Env, InjectEnv } from "@root/_env/env.module"
import { RabbitMQService } from "@root/_rabbitmq/rabbitmq.service"
import { SETTING_KEYS } from "@root/_shared/constants/setting"
import { HeliusService } from "@root/onchain/helius.service"
import {
	BuyTokensEvent,
	CompleteBondingCurveEvent,
	CreateTokenEvent,
	EVENTS,
	RemoveLiquidityEvent,
	SellTokensEvent
} from "@root/programs/ponz/events"
import { Ponz } from "@root/programs/ponz/program"

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
		private readonly rabbitMQService: RabbitMQService,
		private readonly helius: HeliusService
	) {}

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
							"blockchain",
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
							"blockchain",
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

	async logSubcribe() {
		const handlerEvent = async (data: string) => {
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
				Logger.error("Error processing WebSocket message:", error)
			}
		}

		await this.helius.logsSubscribe([this.env.CONTRACT_ADDRESS], handlerEvent)
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

	private async isExistEvent(signature: string, type: TransactionType) {
		const tokenBySig = await this.tokenTransactionRepository.findBySignature(
			signature,
			type
		)

		return !!tokenBySig
	}

	private async fetchSignatures(fromSignature: string) {
		let currentSignature = fromSignature
		let hasMore = true

		while (hasMore) {
			try {
				const signatures = await this.helius.getListSignature(currentSignature)
				if (!signatures || signatures.length === 0) {
					break
				}

				const nonExistentSignatures =
					await this.tokenTransactionRepository.findNonExistentSignatures(
						signatures
					)

				if (nonExistentSignatures.length > 0) {
					await this.processSignatures(nonExistentSignatures)
				}

				// Update the latest signature scanned
				const latestSignature = signatures[signatures.length - 1]
				await this.settingRepository.set(
					SETTING_KEYS.LATEST_SIGNATURE_SCANNED,
					latestSignature
				)

				// If we got less than 1000 results, we've reached the end
				if (signatures.length < 1000 || nonExistentSignatures.length === 0) {
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
				const txLogs = await this.helius.getLogsTransaction(signature)
				if (!txLogs) continue

				const logData = Array.from(this.ponz.parseLogs(txLogs))
				await this.handlePonzEvents(logData, signature)
			} catch (error) {
				console.error(`Error processing signature ${signature}:`, error)
			}
		}
	}
}
