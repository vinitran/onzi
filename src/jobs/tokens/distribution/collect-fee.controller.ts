import { web3 } from "@coral-xyz/anchor"
import { Controller, Logger, NotFoundException } from "@nestjs/common"
import { Ctx, EventPattern, Payload, RmqContext } from "@nestjs/microservices"
import { TokenKeyWithHeldRepository } from "@root/_database/repositories/token-key-with-held.repository"
import { TokenTransactionDistributeRepository } from "@root/_database/repositories/token-tx-distribute"
import { TokenRepository } from "@root/_database/repositories/token.repository"
import { Env, InjectEnv } from "@root/_env/env.module"
import { RabbitMQService } from "@root/_rabbitmq/rabbitmq.service"
import { keypairFromPrivateKey } from "@root/_shared/helpers/encode-decode-tx"
import { BurnFeePayload } from "@root/jobs/tokens/distribution/burn-token.controller"
import { REWARD_DISTRIBUTOR_EVENTS } from "@root/jobs/tokens/token.job"
import { HeliusService } from "@root/onchain/helius.service"
import { InjectConnection } from "@root/programs/programs.module"
import { v4 as uuidv4 } from "uuid"

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

export type SwapMessageType = {
	id: string // Token identifier
	address: string // Token address
	amount?: string // Amount to swap (optional)
	type?: "raydium" | "ponz" // Protocol type for swapping
	amountHolder?: number
	idPayload?: string
}

@Controller()
export class CollectFeeController {
	// System wallet keypair for transaction signing
	private systemWalletKeypair: Keypair

	constructor(
		@InjectEnv() private env: Env,
		@InjectConnection() private connection: web3.Connection,
		private readonly tokenKeyWithHeld: TokenKeyWithHeldRepository,
		private readonly tokentxDistribute: TokenTransactionDistributeRepository,
		private readonly tokenRepository: TokenRepository,
		private readonly rabbitMQService: RabbitMQService,
		private readonly helius: HeliusService
	) {
		// Initialize system wallet from private key stored in environment
		this.systemWalletKeypair = Keypair.fromSecretKey(
			bs58.decode(this.env.SYSTEM_WALLET_PRIVATE_KEY)
		)
	}

	// Handle collection of fee tokens from token holders
	@EventPattern(REWARD_DISTRIBUTOR_EVENTS.COLLECT_FEE)
	async handleCollectFeeToken(
		@Payload() data: SwapMessageType,
		@Ctx() context: RmqContext
	) {
		const channel = context.getChannelRef()
		channel.prefetch(20, false) // Process up to 20 messages at a time
		const originalMsg = context.getMessage()

		try {
			Logger.log("start collect fee for token address: ", data.address)
			await this.collectFeesForToken(data)
			Logger.log("end collect fee for token address: ", data.address)
			channel.ack(originalMsg, false)
		} catch (error) {
			Logger.error(error, "collect fee")
			throw error
		}
	}

	// Collect fees from token holders
	async collectFeesForToken(data: SwapMessageType) {
		const batchSize = 20 // Process max 20 users at a time

		// Retrieve key with held information
		const keyWithHeld = await this.tokenKeyWithHeld.find(data.id)
		if (!keyWithHeld) {
			throw new NotFoundException("not found key with held")
		}

		// Create or get destination token account for fee collection
		const destinationTokenAccount = await getOrCreateAssociatedTokenAccount(
			this.connection,
			this.systemWalletKeypair,
			new PublicKey(data.address),
			new PublicKey(keyWithHeld.publicKey),
			true,
			"finalized",
			{
				maxRetries: 5,
				commitment: "finalized"
			},
			TOKEN_2022_PROGRAM_ID,
			ASSOCIATED_TOKEN_PROGRAM_ID
		)

		let feeAmountTotal = BigInt(0)

		const holders = await this.helius.getTokenHolders(data.address)
		if (!holders || holders.length === 0) return

		// Get associated token addresses for all holders
		const sourceAddress = holders.map(account =>
			getAssociatedTokenAddressSync(
				new PublicKey(data.address),
				new PublicKey(account.address),
				true,
				TOKEN_2022_PROGRAM_ID,
				ASSOCIATED_TOKEN_PROGRAM_ID
			)
		)

		// Process holders in batches
		for (let i = 0; i < sourceAddress.length; i += batchSize) {
			const batchSourceAddresses = sourceAddress.slice(i, i + batchSize)
			let feeAmountTotalInBatch = BigInt(0)

			// Check for transfer fees in each account, filter out null results
			const sourceAddressesWithFees =
				await this.getSourceAddressesWithFees(batchSourceAddresses)

			// Filter addresses with fees and calculate total (optimized single pass)
			const validSourceAddresses: PublicKey[] = []
			for (const { address, feeAmount } of sourceAddressesWithFees) {
				if (feeAmount.withheldAmount > 0) {
					feeAmountTotal += feeAmount.withheldAmount
					feeAmountTotalInBatch += feeAmount.withheldAmount
					validSourceAddresses.push(address)
				}
			}

			if (
				validSourceAddresses.length === 0 ||
				feeAmountTotalInBatch === BigInt(0)
			) {
				continue
			}

			// Withdraw withheld tokens from valid addresses
			const txSig = await withdrawWithheldTokensFromAccounts(
				this.connection,
				this.systemWalletKeypair,
				new PublicKey(data.address),
				destinationTokenAccount.address,
				keypairFromPrivateKey(keyWithHeld.privateKey),
				[],
				validSourceAddresses,
				{
					commitment: "finalized"
				},
				TOKEN_2022_PROGRAM_ID
			)

			await this.tokentxDistribute.insert({
				tokenId: data.id,
				amountToken: feeAmountTotalInBatch,
				signature: txSig,
				type: "CollectFee"
			})

			Logger.log("txSign collect fee", txSig)
		}

		// Process collected fees if any were collected
		if (feeAmountTotal > 0) {
			const tokenTax = await this.tokenRepository.getTaxByID(data.id)

			// Calculate total tax percentage
			const totalTotalTax =
				tokenTax!.rewardTax + tokenTax!.jackpotTax + tokenTax!.burnTax

			// Skip distribution if no taxes are configured
			if (totalTotalTax === 0) {
				return
			}

			// Handle burn tax if configured
			if (tokenTax!.burnTax > 0) {
				// Calculate burn amount based on tax proportion
				const burnAmount =
					(feeAmountTotal * BigInt(tokenTax!.burnTax)) / BigInt(totalTotalTax)
				const burnFeeData: BurnFeePayload = {
					id: data.id,
					address: data.address,
					amount: burnAmount.toString(),
					idPayload: uuidv4().toString()
				}

				// Emit burn event
				await this.rabbitMQService.emit(
					"swap-to-sol-reward-distributor",
					REWARD_DISTRIBUTOR_EVENTS.BURN_FEE,
					burnFeeData
				)
			}

			// Calculate amount to be swapped to SOL (reward + jackpot portion)
			const swapAmount =
				(feeAmountTotal * BigInt(tokenTax!.rewardTax + tokenTax!.jackpotTax)) /
				BigInt(totalTotalTax)

			// Prepare swap message
			const swapToSolMessage: SwapMessageType = {
				id: data.id,
				address: data.address,
				amount: swapAmount.toString(),
				type: data.type,
				amountHolder: holders.length,
				idPayload: uuidv4().toString()
			}

			// Emit swap event
			await this.rabbitMQService.emit(
				"swap-to-sol-reward-distributor",
				REWARD_DISTRIBUTOR_EVENTS.SWAP_FEE_TO_SOL,
				swapToSolMessage
			)
		}
	}

	private async getSourceAddressesWithFees(
		batchSourceAddresses: PublicKey[]
	): Promise<{ address: PublicKey; feeAmount: TransferFeeAmount }[]> {
		const results = await Promise.all(
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

		return results.filter(
			(item): item is { address: PublicKey; feeAmount: TransferFeeAmount } =>
				item !== null && item.feeAmount !== null
		)
	}
}
