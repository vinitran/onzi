import { BN, web3 } from "@coral-xyz/anchor"
import {
	Injectable,
	InternalServerErrorException,
	Logger
} from "@nestjs/common"
import { Prisma } from "@prisma/client"
import { RaydiumStatusType } from "@prisma/client"
import { PrismaService } from "@root/_database/prisma.service"
import { TokenTransactionRepository } from "@root/_database/repositories/token-transaction.repository"
import { TokenRepository } from "@root/_database/repositories/token.repository"
import { Env, InjectEnv } from "@root/_env/env.module"
import {
	CompleteBondingCurveEvent,
	RemoveLiquidityEvent
} from "@root/programs/ponz/events"
import { Ponz } from "@root/programs/ponz/program"
import { InjectConnection } from "@root/programs/programs.module"
import { Raydium } from "@root/programs/raydium/program"
import { Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js"
import bs58 from "bs58"
import { DateTime } from "luxon"

@Injectable()
export class IndexerClientService {
	constructor(
		@InjectEnv() private env: Env,
		private ponz: Ponz,
		private raydium: Raydium,
		@InjectConnection() private connection: web3.Connection,
		private readonly tokenTxRepository: TokenTransactionRepository,
		private readonly tokenRepository: TokenRepository,
		private prisma: PrismaService
	) {}

	async handleCompleteBondingCurve(data: CompleteBondingCurveEvent) {
		if (!(await this.tokenRepository.exist(data.mint))) {
			return
		}

		if (
			await this.tokenTxRepository.findBySignature(data.signature, data.type)
		) {
			return
		}

		const systemWalletKeypair = Keypair.fromSecretKey(
			bs58.decode(this.env.SYSTEM_WALLET_PRIVATE_KEY)
		)

		const tx = await this.ponz.removeLiquidity(
			new PublicKey(data.mint),
			systemWalletKeypair.publicKey
		)

		tx.sign(systemWalletKeypair)

		const simulationResult = await this.connection.simulateTransaction(tx)

		if (simulationResult.value.err) {
			throw new InternalServerErrorException(
				`faild to simulate token:${simulationResult.value.err}`
			)
		}

		const txSig = await this.connection.sendRawTransaction(tx.serialize(), {
			skipPreflight: true,
			maxRetries: 10
		})

		Logger.log(`Transaction RemoveLiquidity: ${txSig}`)

		try {
			await this.prisma.$transaction(
				async prismatTx => {
					const date = await this.getTimeFromSignature(data.signature)

					const txCreateInput: Prisma.TokenTransactionCreateInput = {
						signature: data.signature,
						network: "Solana",
						type: "CompleteBondingCurve",
						date: date.toJSDate(),
						token: {
							connect: {
								address: data.mint
							}
						},
						price: 0,
						newPrice: 0
					}
					await this.tokenTxRepository.create(txCreateInput, prismatTx)

					const tokenUpdateInput: Prisma.TokenUpdateInput = {
						isCompletedBondingCurve: true,
						createdAtBondingCurve: date.toJSDate(),
						raydiumStatus: RaydiumStatusType.Pending
					}
					await this.tokenRepository.update(
						data.mint,
						tokenUpdateInput,
						prismatTx
					)
				},
				{
					maxWait: 120000, // 5s
					timeout: 120000, // 10s
					isolationLevel: Prisma.TransactionIsolationLevel.Serializable
				}
			)
		} catch (e) {
			Logger.error(e)
			throw new InternalServerErrorException(
				"Failed to handle complete bonding curve token"
			)
		}
	}

	async handleRemoveLiquidity(data: RemoveLiquidityEvent) {
		if (!(await this.tokenRepository.exist(data.mint))) {
			return
		}

		if (
			await this.tokenTxRepository.findBySignature(data.signature, data.type)
		) {
			return
		}

		const systemWalletKeypair = Keypair.fromSecretKey(
			bs58.decode(this.env.SYSTEM_WALLET_PRIVATE_KEY)
		)

		const lamportsAmount = new BN(LAMPORTS_PER_SOL * 4) // sol amount - 4 SOL
		const tokensAmount = new BN("11692307000000") // token amount ~ 11692307 Tokens

		const txSignCreateNewPair = await this.raydium.createNewPair(
			systemWalletKeypair,
			new PublicKey(data.mint),
			lamportsAmount,
			tokensAmount
		)

		Logger.log("Transaction migration to raydium", txSignCreateNewPair)

		const txSignBurnLPT = await this.raydium.burnLpToken(
			new PublicKey(data.mint),
			systemWalletKeypair
		)
		Logger.log("Transaction burn liquidity", txSignBurnLPT)

		try {
			await this.prisma.$transaction(
				async prismatTx => {
					const date = await this.getTimeFromSignature(data.signature)

					const txCreateInput: Prisma.TokenTransactionCreateInput = {
						signature: data.signature,
						network: "Solana",
						type: "RemoveLiquidity",
						date: date.toJSDate(),
						token: {
							connect: {
								address: data.mint
							}
						},
						price: 0,
						newPrice: 0
					}
					await this.tokenTxRepository.create(txCreateInput, prismatTx)

					const tokenUpdateInput: Prisma.TokenUpdateInput = {
						raydiumStatus: RaydiumStatusType.Listed
					}
					await this.tokenRepository.update(
						data.mint,
						tokenUpdateInput,
						prismatTx
					)
				},
				{
					maxWait: 120000, // 5s
					timeout: 120000, // 10s
					isolationLevel: Prisma.TransactionIsolationLevel.Serializable
				}
			)
		} catch (e) {
			Logger.error(e)
			throw new InternalServerErrorException(
				"Failed to handle remove liquidity token"
			)
		}
	}

	private async getTimeFromSignature(signature: string) {
		const transaction = await this.connection.getTransaction(signature, {
			commitment: "confirmed",
			maxSupportedTransactionVersion: 0
		})

		if (!transaction) throw new Error(`not found transaction >> ${signature}`)

		if (!transaction.blockTime)
			throw new Error("not found block time from transaction")

		return DateTime.fromSeconds(transaction.blockTime)
	}
}
