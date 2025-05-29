import {
	AnchorProvider,
	BN,
	BorshCoder,
	EventParser,
	Program,
	Program as SolanaProgram,
	Wallet,
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
import { PublicKey, SYSVAR_RENT_PUBKEY } from "@solana/web3.js"
import { InjectConnection } from "../programs.module"
import { PonzSc } from "./idl"

export type BuyTokenType = {
	amountSol: string
	minTokenOut: string
	lockPercent?: number
	lockTime?: number
}

@Injectable()
export class Ponz extends SolanaProgram<PonzSc> {
	public eventParser: EventParser
	public program: Program<PonzSc>
	public globalConfiguration: web3.PublicKey
	public rewardVault: web3.PublicKey
	public tokenMintAuthorityWallet: web3.PublicKey
	public feePool: web3.PublicKey
	public heldAuthority: web3.PublicKey

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
		this.heldAuthority = new web3.PublicKey(env.HELD_AUTHORITY)
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
		data: BuyTokenType
	) {
		if (data.lockTime && data.lockPercent) {
			return this.launchTokenLock(tokenMetadata, mint, user, tokenKeypair, data)
		}
		return this.launchTokenBuy(tokenMetadata, mint, user, tokenKeypair, data)
	}

	public async launchTokenBuy(
		tokenMetadata: TokenMetadataArgs,
		mint: web3.PublicKey,
		user: web3.PublicKey,
		tokenKeypair: web3.Keypair,
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
			.accountsPartial({
				globalConfiguration: this.globalConfiguration,
				mint: mint,
				bondingCurve: this.getBondingCurve(mint),
				tokenPool: this.getTokenPool(mint),
				psrvTokenPool: this.getRewardVaultTokenPool(mint),
				ponzScRewardVault: this.rewardVault,
				ponzTokenMintAuthorityWallet: this.tokenMintAuthorityWallet,
				payer: user,
				withheldAuthority: this.heldAuthority,
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

	public async launchTokenLock(
		tokenMetadata: TokenMetadataArgs,
		mint: web3.PublicKey,
		user: web3.PublicKey,
		tokenKeypair: web3.Keypair,
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
				ponzScRewardVault: this.rewardVault,
				ponzTokenMintAuthorityWallet: this.tokenMintAuthorityWallet,
				withheldAuthority: this.heldAuthority,
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

			return {
				unlockAt: timeUnlock.unlockTime,
				lockAmount: BigInt(lockAmount.value.amount)
			}
		} catch (error) {
			throw new InternalServerErrorException(`can not get lock data: ${error}`)
		}
	}

	private getBondingCurve(mint: PublicKey) {
		return web3.PublicKey.findProgramAddressSync(
			[mint.toBuffer(), Buffer.from("bonding_curve")],
			this.programId
		)[0]
	}

	private getTokenPoolLockPDA(mint: PublicKey): PublicKey {
		return web3.PublicKey.findProgramAddressSync(
			[mint.toBytes(), Buffer.from("token_pool_lock")],
			this.programId
		)[0]
	}

	private getTokenPool(mint: PublicKey) {
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
}
