import { web3 } from "@coral-xyz/anchor"
import { Controller, Logger } from "@nestjs/common"
import { Ctx, EventPattern, Payload, RmqContext } from "@nestjs/microservices"
import { TokenTransactionDistributeRepository } from "@root/_database/repositories/token-tx-distribute"
import { Env, InjectEnv } from "@root/_env/env.module"
import { REWARD_DISTRIBUTOR_EVENTS } from "@root/jobs/tokens/token.job"
import { InjectConnection } from "@root/programs/programs.module"
import {
	TOKEN_2022_PROGRAM_ID,
	createBurnCheckedInstruction,
	getAssociatedTokenAddressSync
} from "@solana/spl-token"
import { Keypair, PublicKey, Transaction } from "@solana/web3.js"
import bs58 from "bs58"

export type BurnFeePayload = {
	id: string
	address: string
	amount: string
}

@Controller()
export class BurnTokenController {
	private readonly systemWalletKeypair: Keypair

	constructor(
		@InjectEnv() private env: Env,
		@InjectConnection() private connection: web3.Connection,
		private readonly tokentxDistribute: TokenTransactionDistributeRepository
	) {
		this.systemWalletKeypair = Keypair.fromSecretKey(
			bs58.decode(this.env.SYSTEM_WALLET_PRIVATE_KEY)
		)
	}

	@EventPattern(REWARD_DISTRIBUTOR_EVENTS.BURN_FEE)
	async handleBurnToken(
		@Payload() data: BurnFeePayload,
		@Ctx() context: RmqContext
	) {
		const channel = context.getChannelRef()
		channel.prefetch(20, false)
		const originalMsg = context.getMessage()

		try {
			const txSign = await this.burnToken(
				new PublicKey(data.address),
				data.amount,
				this.systemWalletKeypair
			)
			await this.tokentxDistribute.insert({
				from: this.systemWalletKeypair.publicKey.toBase58(),
				tokenId: data.id,
				amountToken: BigInt(data.amount),
				signature: txSign,
				type: "Burn"
			})

			channel.ack(originalMsg, false)
		} catch (error) {
			Logger.error(error)
			throw error
		}
	}

	async burnToken(tokenAddress: PublicKey, amount: string, owner: Keypair) {
		const tokenAta = getAssociatedTokenAddressSync(
			tokenAddress,
			owner.publicKey,
			undefined,
			TOKEN_2022_PROGRAM_ID
		)

		const tx = new Transaction().add(
			createBurnCheckedInstruction(
				tokenAta,
				tokenAddress,
				owner.publicKey,
				BigInt(amount),
				6,
				[],
				TOKEN_2022_PROGRAM_ID
			)
		)

		tx.recentBlockhash = (await this.connection.getLatestBlockhash()).blockhash
		tx.feePayer = owner.publicKey
		tx.sign(owner)

		return this.connection.sendRawTransaction(tx.serialize(), {
			skipPreflight: true,
			preflightCommitment: "processed",
			maxRetries: 10
		})
	}
}
