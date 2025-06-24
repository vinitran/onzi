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
import { Env, InjectEnv } from "@root/_env/env.module"
import { RabbitMQService } from "@root/_rabbitmq/rabbitmq.service"
import { keypairFromPrivateKey } from "@root/_shared/helpers/encode-decode-tx"
import { PrepareRewardDistributionPayload } from "@root/jobs/tokens/distribution/distribute-sol.controller"
import { REWARD_DISTRIBUTOR_EVENTS } from "@root/jobs/tokens/token.job"
import { Ponz } from "@root/programs/ponz/program"
import { InjectConnection } from "@root/programs/programs.module"
import { Raydium } from "@root/programs/raydium/program"
import { Keypair, PublicKey } from "@solana/web3.js"
import bs58 from "bs58"

export type SwapMessageType = {
	id: string // Token identifier
	address: string // Token address
	amount?: string // Amount to swap (optional)
	type?: "raydium" | "ponz" // Protocol type for swapping
}

@Controller()
export class SwapController {
	// Configure RPC endpoint based on environment (testnet/mainnet)
	private HELIUS_RPC =
		this.env.IS_TEST === "true"
			? `https://devnet.helius-rpc.com/?api-key=${this.env.HELIUS_API_KEY}`
			: `https://mainnet.helius-rpc.com/?api-key=${this.env.HELIUS_API_KEY}`

	// System wallet keypair for transaction signing
	private systemWalletKeypair: Keypair

	constructor(
		@InjectEnv() private env: Env,
		private raydium: Raydium,
		private ponz: Ponz,
		@InjectConnection() private connection: web3.Connection,
		private readonly tokenKeyWithHeld: TokenKeyWithHeldRepository,
		private readonly tokentxDistribute: TokenTransactionDistributeRepository,
		private readonly rabbitMQService: RabbitMQService
	) {
		// Initialize system wallet from private key stored in environment
		this.systemWalletKeypair = Keypair.fromSecretKey(
			bs58.decode(this.env.SYSTEM_WALLET_PRIVATE_KEY)
		)
	}

	// Handle swapping collected fees to SOL
	@EventPattern(REWARD_DISTRIBUTOR_EVENTS.SWAP_FEE_TO_SOL)
	async handleSwapTokenToSol(
		@Payload() data: SwapMessageType,
		@Ctx() context: RmqContext
	) {
		const channel = context.getChannelRef()
		channel.prefetch(1, false) // Process one message at a time for swaps
		const originalMsg = context.getMessage()

		try {
			Logger.log("start swap for token address: ", data.address)
			await this.swapToSol(data)
			Logger.log("start swap for token address: ", data.address)
			channel.ack(originalMsg, false)
		} catch (error) {
			Logger.error(error, "swap")
			throw error
		}
	}

	// Swap collected tokens to SOL using either Ponz or Raydium protocol
	async swapToSol(data: SwapMessageType) {
		// Retrieve key with held information for the token
		const keyWithHeld = await this.tokenKeyWithHeld.find(data.id)
		if (!keyWithHeld) {
			throw new NotFoundException("not found key with held")
		}

		let txSign = ""
		// Execute swap based on protocol type (Ponz or Raydium)
		if (data.type === "ponz") {
			txSign = await this.ponz.swapToSol(
				new PublicKey(data.address),
				keypairFromPrivateKey(keyWithHeld.privateKey),
				this.systemWalletKeypair,
				new BN(data.amount)
			)
		}

		if (data.type === "raydium") {
			txSign = await this.raydium.swap(
				keypairFromPrivateKey(keyWithHeld.privateKey),
				this.systemWalletKeypair,
				new PublicKey(data.address),
				new BN(data.amount),
				new BN(10000),
				false,
				2000
			)
		}

		// Calculate balance change after swap
		const balanceChange = await this.getBalanceChange(
			txSign,
			keyWithHeld.publicKey
		)

		// Record transaction in database
		await this.tokentxDistribute.insert({
			tokenId: data.id,
			amountToken: BigInt(data.amount!),
			lamport: BigInt(balanceChange),
			signature: txSign,
			type: "SwapToSolana"
		})

		// Emit event for reward distribution
		await this.rabbitMQService.emit(
			"distribute-reward-distributor",
			REWARD_DISTRIBUTOR_EVENTS.PREPARE_REWARD_DISTRIBUTION,
			{
				id: data.id,
				address: data.address,
				lamport: balanceChange
			} as PrepareRewardDistributionPayload
		)
	}

	// Calculate balance change for a transaction
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
			// Fetch transaction details from Helius RPC
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

			// Find wallet address index in transaction
			const index = accountKeys.findIndex(key => key === walletAddress)
			if (index === -1) {
				throw new InternalServerErrorException(
					"Wallet address not found in transaction"
				)
			}

			// Calculate balance difference
			const preLamports = preBalances[index]
			const postLamports = postBalances[index]
			const diffSol = postLamports - preLamports

			return diffSol
		} catch (_error) {
			throw new InternalServerErrorException(_error)
		}
	}
}
