import { web3 } from "@coral-xyz/anchor"
import { Controller, Logger, NotFoundException } from "@nestjs/common"
import { Ctx, EventPattern, Payload, RmqContext } from "@nestjs/microservices"
import { TokenKeyWithHeldRepository } from "@root/_database/repositories/token-key-with-held.repository"
import { TokenTransactionDistributeRepository } from "@root/_database/repositories/token-tx-distribute"
import { Env, InjectEnv } from "@root/_env/env.module"
import { keypairFromPrivateKey } from "@root/_shared/helpers/encode-decode-tx"
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
		private readonly tokentxDistribute: TokenTransactionDistributeRepository,
		private readonly tokenKeyWithHeld: TokenKeyWithHeldRepository
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
			Logger.log("start burning token address: ", data.address)
			const txSign = await this.burnToken(data)
			await this.tokentxDistribute.insert({
				from: this.systemWalletKeypair.publicKey.toBase58(),
				tokenId: data.id,
				amountToken: BigInt(data.amount),
				signature: txSign,
				type: "Burn"
			})
			Logger.log("end burning token address: ", data.address)

			channel.ack(originalMsg, false)
		} catch (error) {
			Logger.error(error, "burn token")
			throw error
		}
	}

	async burnToken(data: BurnFeePayload) {
		const keyWithHeld = await this.tokenKeyWithHeld.find(data.id)
		if (!keyWithHeld) {
			throw new NotFoundException("not found key with held")
		}

		const tokenAta = getAssociatedTokenAddressSync(
			new PublicKey(data.address),
			new PublicKey(keyWithHeld.publicKey),
			undefined,
			TOKEN_2022_PROGRAM_ID
		)

		const tx = new Transaction().add(
			createBurnCheckedInstruction(
				tokenAta,
				new PublicKey(data.address),
				new PublicKey(keyWithHeld.publicKey),
				BigInt(data.amount),
				6,
				[],
				TOKEN_2022_PROGRAM_ID
			)
		)

		tx.recentBlockhash = (await this.connection.getLatestBlockhash()).blockhash
		tx.feePayer = this.systemWalletKeypair.publicKey
		tx.sign(
			keypairFromPrivateKey(keyWithHeld.privateKey),
			this.systemWalletKeypair
		)

		return this.connection.sendRawTransaction(tx.serialize(), {
			skipPreflight: true,
			preflightCommitment: "confirmed",
			maxRetries: 10
		})
	}
}
