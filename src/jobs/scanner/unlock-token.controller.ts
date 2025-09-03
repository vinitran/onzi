import { web3 } from "@coral-xyz/anchor"
import { Controller, Logger } from "@nestjs/common"
import { Ctx, EventPattern, Payload, RmqContext } from "@nestjs/microservices"
import { TokenRepository } from "@root/_database/repositories/token.repository"
import { Env, InjectEnv } from "@root/_env/env.module"
import { Ponz } from "@root/programs/ponz/program"
import { InjectConnection } from "@root/programs/programs.module"
import { Keypair, PublicKey } from "@solana/web3.js"
import bs58 from "bs58"

export type UnlockTokenEventPayload = {
	address: string
	creatorAddress: string
}

export const UNLOCK_TOKEN_EVENTS = {
	UNLOCK: "unlock-token.unlock"
} as const

@Controller()
export class UnlockTokenController {
	private systemWalletKeypair: Keypair

	constructor(
		@InjectEnv() private env: Env,
		@InjectConnection() private connection: web3.Connection,
		private readonly tokenRepository: TokenRepository,
		private ponz: Ponz
	) {
		this.systemWalletKeypair = Keypair.fromSecretKey(
			bs58.decode(this.env.SYSTEM_WALLET_PRIVATE_KEY)
		)
	}

	@EventPattern(UNLOCK_TOKEN_EVENTS.UNLOCK)
	async handlerUnlockTokenBalance(
		@Payload() data: UnlockTokenEventPayload,
		@Ctx() context: RmqContext
	) {
		const channel = context.getChannelRef()
		channel.prefetch(10, false)

		const tx = await this.ponz.withdrawTokenPoolLock(
			new PublicKey(data.address),
			this.systemWalletKeypair,
			new PublicKey(data.creatorAddress)
		)

		tx.sign(this.systemWalletKeypair)

		const txSign = await this.connection.sendRawTransaction(tx.serialize(), {
			skipPreflight: true,
			maxRetries: 10
		})

		await this.connection.confirmTransaction(txSign, "finalized")
		Logger.log(txSign, "unlockTxSig")

		await this.tokenRepository.updateUnlockToken(data.address)
	}
}
