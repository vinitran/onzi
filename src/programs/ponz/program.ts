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
import { Injectable } from "@nestjs/common"
import { Env, InjectEnv } from "@root/_env/env.module"
import { TokenMetadataArgs } from "@root/programs/ponz/events"
import idl from "@root/programs/ponz/ponz_sc.json"
import {
	ASSOCIATED_TOKEN_PROGRAM_ID,
	TOKEN_2022_PROGRAM_ID
} from "@solana/spl-token"
import { PublicKey } from "@solana/web3.js"
import { InjectConnection } from "../programs.module"
import { PonzSc } from "./idl"

const _MARKETCAP_SEEDS = Buffer.from("marketcap")

const _MASTER_SEEDS = Buffer.from("king_meme_master")

const _TICKET_SEEDS = Buffer.from("king_meme_ticket")

@Injectable()
export class Ponz extends SolanaProgram<PonzSc> {
	public eventParser: EventParser
	public program: Program<PonzSc>
	public globalConfiguration: web3.PublicKey
	public rewardVault: web3.PublicKey
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
		this.globalConfiguration = web3.PublicKey.findProgramAddressSync(
			[Buffer.from("global_config")],
			this.programId
		)[0]

		this.feePool = web3.PublicKey.findProgramAddressSync(
			[Buffer.from("fee_pool")],
			this.programId
		)[0]
	}

	public async createTokenAndBuyTx(
		tokenMetadata: TokenMetadataArgs,
		mint: web3.PublicKey,
		user: web3.PublicKey,
		tokenKeypair: web3.Keypair,
		minSol: string,
		maxSol: string
	): Promise<web3.Transaction> {
		const createTokenIx = await this.program.methods
			.createToken(tokenMetadata)
			.accountsStrict({
				globalConfiguration: this.globalConfiguration,
				mint,
				bondingCurve: this.getBondingCurve(mint),
				psrvTokenPool: this.getRewardVaultTokenPool(mint),
				tokenPool: this.getTokenPool(mint),
				payer: user,
				ponzScRewardVault: this.rewardVault,
				tokenProgram: TOKEN_2022_PROGRAM_ID,
				rent: web3.SYSVAR_RENT_PUBKEY,
				systemProgram: web3.SystemProgram.programId,
				associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID
			})
			.instruction()

		const buyIx = await this.program.methods
			.buy(new BN(maxSol), new BN(minSol))
			.accountsStrict({
				globalConfiguration: this.globalConfiguration,
				mint,
				bondingCurve: this.getBondingCurve(mint),
				payerAta: this.getOwnerAta(user, mint),
				tokenPool: this.getTokenPool(mint),
				payer: user,
				associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
				tokenProgram: TOKEN_2022_PROGRAM_ID,
				systemProgram: web3.SystemProgram.programId,
				feePool: this.feePool
			})
			.instruction()

		const tx = new web3.Transaction()
		tx.add(createTokenIx)
		tx.add(buyIx)
		tx.feePayer = user
		tx.recentBlockhash = (await this.connection.getLatestBlockhash()).blockhash
		tx.partialSign(tokenKeypair)

		return tx
	}

	public parseLogs(logs: string[]) {
		return this.eventParser.parseLogs(logs)
	}

	public async calculateMarketcap(mint: PublicKey) {
		const bondingCurve = this.getBondingCurve(mint)

		try {
			const marketcapAccount =
				await this.account.bondingCurve.fetch(bondingCurve)

			return marketcapAccount.initVirtualSol * marketcapAccount.solReserves
		} catch {
			return 0
		}
	}

	private getBondingCurve(mint: PublicKey) {
		return web3.PublicKey.findProgramAddressSync(
			[mint.toBuffer(), Buffer.from("bonding_curve")],
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
