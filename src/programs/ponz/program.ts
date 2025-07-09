import {
	AnchorProvider,
	BN,
	BorshCoder,
	EventParser,
	Program,
	Program as SolanaProgram,
	Wallet,
	utils,
	web3
} from "@coral-xyz/anchor"
import { SYSTEM_PROGRAM_ID } from "@coral-xyz/anchor/dist/cjs/native/system"
import { Injectable, InternalServerErrorException } from "@nestjs/common"
import { Env, InjectEnv } from "@root/_env/env.module"
import { TokenMetadataArgs } from "@root/programs/ponz/events"
import idl from "@root/programs/ponz/ponz_sc.json"
import {
	ASSOCIATED_TOKEN_PROGRAM_ID,
	TOKEN_2022_PROGRAM_ID
} from "@solana/spl-token"
import {
	Keypair,
	PublicKey,
	SYSVAR_RENT_PUBKEY,
	Transaction
} from "@solana/web3.js"
import { InjectConnection } from "../programs.module"
import { PonzSc } from "./idl"

export type BuyTokenType = {
	amountSol: string
	minTokenOut: string
	lockPercent?: number
	lockTime?: number
}

interface IBondingCurveData {
	creator: PublicKey
	bump: number
	initVirtualSol: BN
	initVirtualToken: BN
	tokenSupply: BN
	tokenReserves: BN
	solReserves: BN
	complete: boolean
	unlockTime: BN
	prevPrice: number
}

@Injectable()
export class Ponz extends SolanaProgram<PonzSc> {
	public eventParser: EventParser
	public program: Program<PonzSc>
	public globalConfiguration: web3.PublicKey
	public rewardVault: web3.PublicKey
	public tokenMintAuthorityWallet: web3.PublicKey
	public feePool: web3.PublicKey

	constructor(
		@InjectConnection() public connection: web3.Connection,
		@InjectEnv() private env: Env
	) {
		const randomWallet = new Wallet(web3.Keypair.generate())
		const provider = new AnchorProvider(connection, randomWallet)

		super(idl as PonzSc, provider)

		this.program = new Program(idl as PonzSc, provider)
		this.eventParser = new EventParser(this.programId, new BorshCoder(this.idl))

		this.rewardVault = new web3.PublicKey(env.REWARD_VAULT_ADDRESS)
		this.tokenMintAuthorityWallet = new web3.PublicKey(
			env.TOKEN_MINT_AUTHORITY_WALLET
		)
		this.globalConfiguration = web3.PublicKey.findProgramAddressSync(
			[Buffer.from("global_config")],
			this.programId
		)[0]

		this.feePool = web3.PublicKey.findProgramAddressSync(
			[Buffer.from("fee_pool")],
			this.programId
		)[0]
	}

	public async lauchToken(
		tokenMetadata: TokenMetadataArgs,
		mint: web3.PublicKey,
		user: web3.PublicKey,
		tokenKeypair: web3.Keypair,
		withheldAuthority: web3.PublicKey,
		data: BuyTokenType
	) {
		if (data.lockTime && data.lockPercent) {
			return this.launchTokenLock(
				tokenMetadata,
				mint,
				user,
				tokenKeypair,
				withheldAuthority,
				data
			)
		}
		return this.launchTokenBuy(
			tokenMetadata,
			mint,
			user,
			tokenKeypair,
			withheldAuthority,
			data
		)
	}

	public async launchTokenBuy(
		tokenMetadata: TokenMetadataArgs,
		mint: web3.PublicKey,
		user: web3.PublicKey,
		tokenKeypair: web3.Keypair,
		withheldAuthority: web3.PublicKey,
		data: BuyTokenType
	): Promise<web3.Transaction> {
		const createTokenIx = await this.program.methods
			.createToken({
				name: tokenMetadata.name,
				symbol: tokenMetadata.symbol,
				uri: tokenMetadata.uri,
				transferFeeBasisPoints: tokenMetadata.transferFeeBasisPoints,
				maximumFee: tokenMetadata.maximumFee
			})
			.accountsStrict({
				globalConfiguration: this.globalConfiguration,
				mint: mint,
				bondingCurve: this.getBondingCurve(mint),
				tokenPool: this.getTokenPool(mint),
				psrvTokenPool: this.getRewardVaultTokenPool(mint),
				ponzVault: this.rewardVault,
				ponzTokenMintAuthorityWallet: this.tokenMintAuthorityWallet,
				payer: user,
				withheldAuthority,
				tokenProgram: TOKEN_2022_PROGRAM_ID,
				rent: SYSVAR_RENT_PUBKEY,
				systemProgram: SYSTEM_PROGRAM_ID
			})
			.instruction()

		const buyTokenIx = await this.program.methods
			.buy(new BN(data.amountSol), new BN(data.minTokenOut))
			.accountsPartial({
				globalConfiguration: this.globalConfiguration,
				mint,
				bondingCurve: this.getBondingCurve(mint),
				tokenPool: this.getTokenPool(mint),
				feePool: this.feePool,
				payerAta: this.getOwnerAta(user, mint),
				payer: user,
				tokenProgram: TOKEN_2022_PROGRAM_ID,
				systemProgram: SYSTEM_PROGRAM_ID,
				associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID
			})
			.instruction()

		const tx = new web3.Transaction()
		tx.add(createTokenIx)
		tx.add(buyTokenIx)
		tx.feePayer = user
		tx.recentBlockhash = (await this.connection.getLatestBlockhash()).blockhash
		tx.partialSign(tokenKeypair)

		return tx
	}

	public async swapToSol(
		mint: web3.PublicKey,
		owner: web3.Keypair,
		feePayer: web3.Keypair,
		amount: BN
	) {
		const tx = await this.sell(
			mint,
			owner.publicKey,
			feePayer,
			amount,
			new BN(0)
		)

		tx.sign(owner, feePayer)

		const simulationResult = await this.connection.simulateTransaction(tx)

		if (simulationResult.value.err) {
			throw new InternalServerErrorException(simulationResult.value.err)
		}

		const txSig = await this.connection.sendRawTransaction(tx.serialize(), {
			skipPreflight: true
		})

		await this.connection.confirmTransaction(txSig, "finalized")
		return txSig
	}

	public async sell(
		mint: PublicKey,
		owner: PublicKey,
		feePayer: Keypair,
		sellTokensAmount: BN,
		expectedSolAmount: BN
	): Promise<Transaction> {
		const tx = await this.program.methods
			.sell(sellTokensAmount, expectedSolAmount)
			.accountsStrict({
				globalConfiguration: this.globalConfiguration,
				mint,
				bondingCurve: this.getBondingCurve(mint),
				tokenPool: this.getTokenPool(mint),
				feePool: this.feePool,
				payer: owner,
				payerAta: this.getOwnerAta(owner, mint),
				tokenProgram: TOKEN_2022_PROGRAM_ID,
				associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
				systemProgram: SYSTEM_PROGRAM_ID
			})
			.transaction()

		tx.recentBlockhash = (await this.connection.getLatestBlockhash()).blockhash
		tx.feePayer = feePayer.publicKey

		return tx
	}

	public async launchTokenLock(
		tokenMetadata: TokenMetadataArgs,
		mint: web3.PublicKey,
		user: web3.PublicKey,
		tokenKeypair: web3.Keypair,
		withheldAuthority: web3.PublicKey,
		data: BuyTokenType
	): Promise<web3.Transaction> {
		if (!data.lockPercent || !data.lockTime)
			throw new InternalServerErrorException("lock data can not be null")

		const createTokenIx = await this.program.methods
			.createToken({
				name: tokenMetadata.name,
				symbol: tokenMetadata.symbol,
				uri: tokenMetadata.uri,
				transferFeeBasisPoints: tokenMetadata.transferFeeBasisPoints,
				maximumFee: tokenMetadata.maximumFee
			})
			.accountsPartial({
				globalConfiguration: this.globalConfiguration,
				mint: mint,
				bondingCurve: this.getBondingCurve(mint),
				tokenPool: this.getTokenPool(mint),
				psrvTokenPool: this.getRewardVaultTokenPool(mint),
				ponzVault: this.rewardVault,
				ponzTokenMintAuthorityWallet: this.tokenMintAuthorityWallet,
				withheldAuthority,
				payer: user,
				tokenProgram: TOKEN_2022_PROGRAM_ID,
				rent: SYSVAR_RENT_PUBKEY,
				systemProgram: SYSTEM_PROGRAM_ID
			})
			.instruction()

		const buyTokenIx = await this.program.methods
			.buyLock(
				new BN(data.amountSol),
				new BN(data.minTokenOut),
				data.lockPercent,
				new BN(data.lockTime)
			)
			.accountsPartial({
				globalConfiguration: this.globalConfiguration,
				mint: mint,
				bondingCurve: this.getBondingCurve(mint),
				tokenPool: this.getTokenPool(mint),
				tokenPoolLock: this.getTokenPoolLockPDA(mint),
				feePool: this.feePool,
				payerAta: this.getOwnerAta(user, mint),
				payer: user,
				tokenProgram: TOKEN_2022_PROGRAM_ID,
				systemProgram: SYSTEM_PROGRAM_ID,
				associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID
			})
			.instruction()

		const tx = new web3.Transaction()
		tx.add(createTokenIx)
		tx.add(buyTokenIx)
		tx.feePayer = user
		tx.recentBlockhash = (await this.connection.getLatestBlockhash()).blockhash
		tx.partialSign(tokenKeypair)

		return tx
	}

	public async removeLiquidity(
		mint: PublicKey,
		ponzSystemWallet: PublicKey
	): Promise<web3.Transaction> {
		const tx = await this.program.methods
			.removeLiquidity()
			.accountsStrict({
				globalConfiguration: this.globalConfiguration,
				payer: ponzSystemWallet,
				mint: mint,
				bondingCurve: this.getBondingCurve(mint),
				tokenPool: this.getTokenPool(mint),
				payerAta: this.getOwnerAta(ponzSystemWallet, mint),
				tokenProgram: TOKEN_2022_PROGRAM_ID,
				associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
				systemProgram: SYSTEM_PROGRAM_ID
			})
			.transaction()

		tx.recentBlockhash = (await this.connection.getLatestBlockhash()).blockhash
		tx.feePayer = ponzSystemWallet

		return tx
	}

	public parseLogs(logs: string[]) {
		return this.eventParser.parseLogs(logs)
	}

	public async calculateMarketcap(mint: string) {
		const bondingCurve = this.getBondingCurve(new PublicKey(mint))

		try {
			const marketcapAccount =
				await this.account.bondingCurve.fetch(bondingCurve)

			const solReserves = BigInt(marketcapAccount.solReserves)
			const initVirtualSol = BigInt(marketcapAccount.initVirtualSol)
			return solReserves + initVirtualSol
		} catch (error) {
			throw new InternalServerErrorException(`can not get marketCap: ${error}`)
		}
	}

	public async getLockData(mint: string) {
		const poolLock = this.getTokenPoolLockPDA(new PublicKey(mint))

		const poolLockInfor = await this.connection.getAccountInfo(poolLock)
		if (!poolLockInfor) return

		try {
			const [timeUnlock, lockAmount] = await Promise.all([
				this.account.bondingCurve.fetch(
					this.getBondingCurve(new PublicKey(mint))
				),
				this.connection.getTokenAccountBalance(poolLock)
			])

			const unlockTimeBigInt = BigInt(timeUnlock.unlockTime.toString()) * 1000n
			const maxTimestamp = 8640000000000000n // max Date in JS
			const clampedUnlockTime =
				unlockTimeBigInt > maxTimestamp ? maxTimestamp : unlockTimeBigInt

			const maxDate = new Date("9999-12-31T23:59:59.999Z")
			const finalUnlockDate = new Date(Number(clampedUnlockTime))
			return {
				unlockAt: finalUnlockDate > maxDate ? maxDate : finalUnlockDate,
				lockAmount: BigInt(lockAmount.value.amount)
			}
		} catch (error) {
			throw new InternalServerErrorException(`can not get lock data: ${error}`)
		}
	}

	// ==== PDAs
	get globalConfigPDA(): PublicKey {
		return PublicKey.findProgramAddressSync(
			[Buffer.from(utils.bytes.utf8.encode("global_config"))],
			this.program.programId
		)[0]
	}

	get feePoolPDA(): PublicKey {
		return PublicKey.findProgramAddressSync(
			[Buffer.from(utils.bytes.utf8.encode("fee_pool"))],
			this.program.programId
		)[0]
	}

	// withdraw fee
	public async withdrawFeePool(
		ponzMultiSigWallet: PublicKey
	): Promise<Transaction> {
		const tx = await this.program.methods
			.withdrawFeePool()
			.accountsStrict({
				globalConfiguration: this.globalConfigPDA,
				feePool: this.feePoolPDA,
				payer: ponzMultiSigWallet,
				systemProgram: SYSTEM_PROGRAM_ID
			})
			.transaction()

		tx.recentBlockhash = (await this.connection.getLatestBlockhash()).blockhash
		tx.feePayer = ponzMultiSigWallet

		return tx
	}

	public getBondingCurve(mint: PublicKey) {
		return web3.PublicKey.findProgramAddressSync(
			[mint.toBuffer(), Buffer.from("bonding_curve")],
			this.programId
		)[0]
	}

	public getTokenPoolLockPDA(mint: PublicKey): PublicKey {
		return web3.PublicKey.findProgramAddressSync(
			[mint.toBytes(), Buffer.from("token_pool_lock")],
			this.programId
		)[0]
	}

	public getTokenPool(mint: PublicKey) {
		return web3.PublicKey.findProgramAddressSync(
			[mint.toBytes(), Buffer.from("token_pool")],
			this.programId
		)[0]
	}

	private getRewardVaultTokenPool(mint: PublicKey) {
		return web3.PublicKey.findProgramAddressSync(
			[mint.toBytes(), Buffer.from("token_pool")],
			this.rewardVault
		)[0]
	}

	private getOwnerAta(owner: PublicKey, mint: PublicKey) {
		return web3.PublicKey.findProgramAddressSync(
			[owner.toBuffer(), TOKEN_2022_PROGRAM_ID.toBuffer(), mint.toBuffer()],
			ASSOCIATED_TOKEN_PROGRAM_ID
		)[0]
	}

	public async fetchBondingCurve(
		bondingCurvePubkey: PublicKey
	): Promise<IBondingCurveData> {
		try {
			const bondingCurveData =
				await this.program.account.bondingCurve.fetch(bondingCurvePubkey)

			return bondingCurveData
		} catch (error) {
			console.error("Error fetching bonding curve:", error)
			throw error
		}
	}

	public async calculateLamportsOut(
		bondingCurvePubkey: PublicKey,
		tokensIn: BN
	): Promise<BN> {
		const bondingCurveData = await this.fetchBondingCurve(bondingCurvePubkey)

		const xTotal = bondingCurveData.initVirtualSol.add(
			bondingCurveData.solReserves
		)
		const yTotal = bondingCurveData.initVirtualToken.sub(
			bondingCurveData.tokenSupply
				.mul(new BN(99))
				.div(new BN(100))
				.sub(bondingCurveData.tokenReserves)
		)

		const kParam = xTotal.mul(yTotal)

		let lamportsOut = xTotal.sub(kParam.div(yTotal.add(tokensIn)))

		const bondingCurveAccountInfo =
			await this.connection.getAccountInfo(bondingCurvePubkey)

		if (bondingCurveAccountInfo) {
			if (lamportsOut.lt(new BN(bondingCurveAccountInfo.lamports))) {
				const minimumLamports =
					await this.connection.getMinimumBalanceForRentExemption(
						bondingCurveAccountInfo.data.length
					)

				lamportsOut = new BN(bondingCurveAccountInfo.lamports).sub(
					new BN(minimumLamports)
				)
			}
		}

		return lamportsOut
	}
}
