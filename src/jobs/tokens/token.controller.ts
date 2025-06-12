import { BN, web3 } from "@coral-xyz/anchor"
import {
	Controller,
	InternalServerErrorException,
	Logger,
	NotFoundException
} from "@nestjs/common"
import { Ctx, EventPattern, Payload, RmqContext } from "@nestjs/microservices"
import { TokenKeyWithHeldRepository } from "@root/_database/repositories/token-key-with-held.repository"
import { TokenTransactionDistributeRepository } from "@root/_database/repositories/token-tx-distribute"
import { TokenRepository } from "@root/_database/repositories/token.repository"
import { Env, InjectEnv } from "@root/_env/env.module"
import { RabbitMQService } from "@root/_rabbitmq/rabbitmq.service"
import { keypairFromPrivateKey } from "@root/_shared/helpers/encode-decode-tx"
import { IndexerService } from "@root/indexer/indexer.service"
import { REWARD_DISTRIBUTOR_EVENTS } from "@root/jobs/tokens/token.job"
import { InjectConnection } from "@root/programs/programs.module"
import { Raydium } from "@root/programs/raydium/program"
import {
	ASSOCIATED_TOKEN_PROGRAM_ID,
	TOKEN_2022_PROGRAM_ID,
	TransferFeeAmount,
	getAccount,
	getAssociatedTokenAddressSync,
	getOrCreateAssociatedTokenAccount,
	getTransferFeeAmount,
	withdrawWithheldTokensFromAccounts
} from "@solana/spl-token"
import { Keypair, PublicKey } from "@solana/web3.js"
import bs58 from "bs58"

type SwapMessageType = {
	id: string
	address: string
	amount: string
}

@Controller()
export class TokenJobsController {
	private HELIUS_RPC =
		this.env.IS_TEST === "true"
			? `https://devnet.helius-rpc.com/?api-key=${this.env.HELIUS_API_KEY}`
			: `https://mainnet.helius-rpc.com/?api-key=${this.env.HELIUS_API_KEY}`

	private systemWalletKeypair: Keypair

	constructor(
		@InjectEnv() private env: Env,
		private readonly indexer: IndexerService,
		private raydium: Raydium,
		@InjectConnection() private connection: web3.Connection,
		private readonly tokenKeyWithHeld: TokenKeyWithHeldRepository,
		private readonly tokentxDistribute: TokenTransactionDistributeRepository,
		private readonly tokenRepository: TokenRepository,
		private readonly rabbitMQService: RabbitMQService
	) {
		this.systemWalletKeypair = Keypair.fromSecretKey(
			bs58.decode(this.env.SYSTEM_WALLET_PRIVATE_KEY)
		)
	}

	@EventPattern(REWARD_DISTRIBUTOR_EVENTS.COLLECT_TOKEN)
	async handleCollectFeeToken(
		@Payload() data: SwapMessageType,
		@Ctx() context: RmqContext
	) {
		const channel = context.getChannelRef()
		channel.prefetch(20, false)
		const originalMsg = context.getMessage()

		try {
			await this.collectFeesForToken(data)
			channel.ack(originalMsg, false)
		} catch (error) {
			Logger.error(error)
			throw error
		}
	}

	@EventPattern(REWARD_DISTRIBUTOR_EVENTS.SWAP_TOKEN)
	async handleSwapTokenToSol(
		@Payload() data: SwapMessageType,
		@Ctx() context: RmqContext
	) {
		const channel = context.getChannelRef()
		channel.prefetch(1, false)
		const originalMsg = context.getMessage()

		try {
			await this.collectFeesForToken(data)
			channel.ack(originalMsg, false)
		} catch (error) {
			Logger.error(error)
			throw error
		}

		await this.swapToSol(data)
	}

	async swapToSol(data: SwapMessageType) {
		const systemWalletKeypair = Keypair.fromSecretKey(
			bs58.decode(this.env.SYSTEM_WALLET_PRIVATE_KEY)
		)

		const keyWithHeld = await this.tokenKeyWithHeld.find(data.id)
		if (!keyWithHeld) {
			throw new NotFoundException("not found key with held")
		}

		const txSign = await this.raydium.swap(
			keypairFromPrivateKey(keyWithHeld.privateKey),
			systemWalletKeypair,
			new PublicKey(data.address),
			new BN(data.amount),
			new BN(10000),
			false,
			2000
		)

		const balanceChange = await this.getBalanceChange(
			txSign,
			keyWithHeld.publicKey
		)

		await this.tokentxDistribute.insert({
			tokenId: data.id,
			amountToken: BigInt(data.amount),
			lamport: BigInt(balanceChange),
			signature: txSign,
			type: "SwapToSolana"
		})

		await this.rabbitMQService.emit(
			"distribute-reward-distributor",
			REWARD_DISTRIBUTOR_EVENTS.DISTRIBUTE,
			{
				id: data.id,
				address: data.address,
				lamport: balanceChange
			}
		)
	}

	async collectFeesForToken(data: { id: string; address: string }) {
		let page = 1
		const pageSize = 1000 // Process 1000 users per page
		const batchSize = 20 // Process max 20 users at a time

		const keyWithHeld = await this.tokenKeyWithHeld.find(data.id)
		if (!keyWithHeld) {
			throw new NotFoundException("not found key with held")
		}

		const destinationTokenAccount = await getOrCreateAssociatedTokenAccount(
			this.connection,
			this.systemWalletKeypair,
			new PublicKey(data.address),
			new PublicKey(keyWithHeld.publicKey),
			true,
			"processed",
			{},
			TOKEN_2022_PROGRAM_ID,
			ASSOCIATED_TOKEN_PROGRAM_ID
		)

		let feeAmountTotal = BigInt(0)

		let lastSignature = ""
		while (true) {
			try {
				const holders = await this.indexer.getTokenHoldersByPage(
					data.address,
					page,
					pageSize
				)
				if (!holders) break

				if (holders.length === 0) break

				const sourceAddress = [...new Set(holders)].map(account =>
					getAssociatedTokenAddressSync(
						new PublicKey(data.address),
						new PublicKey(account.owner),
						true,
						TOKEN_2022_PROGRAM_ID,
						ASSOCIATED_TOKEN_PROGRAM_ID
					)
				)

				// Process holders in batches of batchSize
				for (let i = 0; i < sourceAddress.length; i += batchSize) {
					const batchSourceAddresses = sourceAddress.slice(i, i + batchSize)

					// Filter source addresses that have transfer fees > 0
					const sourceAddressesWithFees = (
						await Promise.all(
							batchSourceAddresses.map(async address => {
								try {
									const account = await getAccount(
										this.connection,
										address,
										"finalized",
										TOKEN_2022_PROGRAM_ID
									)

									const feeAmount = getTransferFeeAmount(account)
									return { address, feeAmount }
								} catch (_error) {
									return null
								}
							})
						)
					).filter(
						(
							item
						): item is {
							address: PublicKey
							feeAmount: TransferFeeAmount | null
						} => item !== null
					)

					const validSourceAddresses = sourceAddressesWithFees
						.filter(
							({ feeAmount }) => feeAmount && feeAmount.withheldAmount > 0
						)
						.map(({ address, feeAmount }) => {
							feeAmountTotal = feeAmountTotal + feeAmount!.withheldAmount
							return address
						})

					if (validSourceAddresses.length === 0) {
						continue
					}

					const txSig = await withdrawWithheldTokensFromAccounts(
						this.connection,
						this.systemWalletKeypair,
						new PublicKey(data.address),
						destinationTokenAccount.address,
						keypairFromPrivateKey(keyWithHeld.privateKey),
						[],
						validSourceAddresses,
						{
							commitment: "processed"
						},
						TOKEN_2022_PROGRAM_ID
					)

					lastSignature = txSig
					Logger.log("txSign collect fee", txSig)
				}

				page++
			} catch (error) {
				Logger.log("err when collect fee:", error)
				break
			}
		}

		if (feeAmountTotal > 0) {
			await this.connection.confirmTransaction(lastSignature, "finalized")
			const [tokenTax] = await Promise.all([
				this.tokenRepository.getTaxByID(data.id),
				this.tokentxDistribute.insert({
					tokenId: data.id,
					amountToken: feeAmountTotal,
					signature: lastSignature,
					type: "CollectFee"
				})
			])

			const totalTotalTax =
				tokenTax!.rewardTax + tokenTax!.jackpotTax + tokenTax!.burnTax
			if (totalTotalTax === 0) {
				return
			}

			if (tokenTax!.burnTax > 0) {
				const burnAmount =
					(feeAmountTotal * BigInt(tokenTax!.burnTax)) / BigInt(totalTotalTax)
				await this.rabbitMQService.emit(
					"swap-to-sol-reward-distributor",
					REWARD_DISTRIBUTOR_EVENTS.BURN_TOKEN,
					{ ...data, amount: burnAmount.toString() }
				)
			}

			const swapAmount =
				(feeAmountTotal * BigInt(tokenTax!.rewardTax + tokenTax!.jackpotTax)) /
				BigInt(totalTotalTax)
			await this.rabbitMQService.emit(
				"swap-to-sol-reward-distributor",
				REWARD_DISTRIBUTOR_EVENTS.SWAP_TOKEN,
				{ ...data, amount: swapAmount.toString() }
			)
		}
	}

	async getBalanceChange(signature: string, walletAddress: string) {
		const payload = {
			jsonrpc: "2.0",
			id: "1",
			method: "getTransaction",
			params: [
				signature,
				{
					commitment: "finalized"
				}
			]
		}

		try {
			const response = await fetch(this.HELIUS_RPC, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload)
			})

			const data = (await response.json()).result

			const accountKeys: string[] = data?.transaction?.message?.accountKeys
			const preBalances: number[] = data?.meta?.preBalances
			const postBalances: number[] = data?.meta?.postBalances

			if (!accountKeys || !preBalances || !postBalances) {
				throw new InternalServerErrorException("Missing transaction data")
			}

			const index = accountKeys.findIndex(key => key === walletAddress)
			if (index === -1) {
				throw new InternalServerErrorException(
					"Wallet address not found in transaction"
				)
			}

			const preLamports = preBalances[index]
			const postLamports = postBalances[index]
			const diffSol = postLamports - preLamports

			return diffSol
		} catch (_error) {
			throw new InternalServerErrorException(_error)
		}
	}
}
