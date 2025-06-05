import {
	AnchorProvider,
	BN,
	Program,
	Program as SolanaProgram,
	Wallet,
	web3
} from "@coral-xyz/anchor"
import { ASSOCIATED_PROGRAM_ID } from "@coral-xyz/anchor/dist/cjs/utils/token"
import { Injectable, InternalServerErrorException } from "@nestjs/common"
import { Env, InjectEnv } from "@root/_env/env.module"
import {
	getAmmConfigAddress,
	getAuthAddress,
	getOrcleAccountAddress,
	getPoolAddress,
	getPoolLpMintAddress,
	getPoolVaultAddress
} from "@root/programs/raydium/pda"
import idl from "@root/programs/raydium/raydium_cp_swap.json"
import {
	NATIVE_MINT,
	TOKEN_2022_PROGRAM_ID,
	TOKEN_PROGRAM_ID,
	createAssociatedTokenAccountInstruction,
	createCloseAccountInstruction,
	createSyncNativeInstruction,
	getAssociatedTokenAddressSync
} from "@solana/spl-token"
import {
	ConfirmOptions,
	PublicKey,
	SYSVAR_RENT_PUBKEY,
	Signer,
	SystemProgram,
	Transaction,
	TransactionInstruction,
	TransactionSignature
} from "@solana/web3.js"
import { InjectConnection } from "../programs.module"
import { RaydiumCpSwap } from "./idl"

interface IToken {
	address: PublicKey
	program: PublicKey
	amount: BN
}

@Injectable()
export class Raydium extends SolanaProgram<RaydiumCpSwap> {
	public program: Program<RaydiumCpSwap>
	public createPoolFee: web3.PublicKey

	constructor(
		@InjectConnection() public connection: web3.Connection,
		@InjectEnv() private env: Env
	) {
		const randomWallet = new Wallet(web3.Keypair.generate())
		const provider = new AnchorProvider(connection, randomWallet)

		super(idl as RaydiumCpSwap, provider)

		this.program = new Program(idl as RaydiumCpSwap, provider)

		this.createPoolFee = new PublicKey(this.env.CREATE_POOL_FEE_PUBLIC_KEY)
	}

	async createNewPair(
		creator: Signer,
		tokenAddress: PublicKey,
		lamportsAmount: BN,
		tokensAmount: BN
	) {
		const configAddress = await this.createAmmConfig(
			creator,
			0,
			new BN(2500),
			new BN(120000),
			new BN(40000),
			new BN(150000000)
		)

		const sortedTokenArray = this.sortTokens(
			tokenAddress,
			lamportsAmount,
			tokensAmount
		)
		if (sortedTokenArray.length !== 2)
			throw new InternalServerErrorException("Can not sort token")

		const token0 = sortedTokenArray[0]
		const token1 = sortedTokenArray[1]

		const [auth] = await getAuthAddress(this.program.programId)
		const [poolAddress] = await getPoolAddress(
			configAddress,
			token0.address,
			token1.address,
			this.program.programId
		)
		const [lpMintAddress] = await getPoolLpMintAddress(
			poolAddress,
			this.program.programId
		)
		const [vault0] = await getPoolVaultAddress(
			poolAddress,
			token0.address,
			this.program.programId
		)
		const [vault1] = await getPoolVaultAddress(
			poolAddress,
			token1.address,
			this.program.programId
		)
		const [creatorLpTokenAddress] = await PublicKey.findProgramAddress(
			[
				creator.publicKey.toBuffer(),
				TOKEN_PROGRAM_ID.toBuffer(),
				lpMintAddress.toBuffer()
			],
			ASSOCIATED_PROGRAM_ID
		)

		const [observationAddress] = await getOrcleAccountAddress(
			poolAddress,
			this.program.programId
		)

		const creatorToken0 = getAssociatedTokenAddressSync(
			token0.address,
			creator.publicKey,
			false,
			token0.program
		)

		const creatorToken1 = getAssociatedTokenAddressSync(
			token1.address,
			creator.publicKey,
			false,
			token1.program
		)

		const initPoolIx = await this.program.methods
			.initialize(token0.amount, token1.amount, new BN(0))
			.accountsPartial({
				creator: creator.publicKey,
				ammConfig: configAddress,
				authority: auth,
				poolState: poolAddress,
				token0Mint: token0.address,
				token1Mint: token1.address,
				lpMint: lpMintAddress,
				creatorToken0,
				creatorToken1,
				creatorLpToken: creatorLpTokenAddress,
				token0Vault: vault0,
				token1Vault: vault1,
				createPoolFee: this.createPoolFee,
				observationState: observationAddress,
				tokenProgram: TOKEN_PROGRAM_ID,
				token0Program: token0.program,
				token1Program: token1.program,
				systemProgram: SystemProgram.programId,
				rent: SYSVAR_RENT_PUBKEY
			})
			.instruction()

		const wsolAta = getAssociatedTokenAddressSync(
			NATIVE_MINT,
			creator.publicKey
		)

		const createWsolAtaIx = createAssociatedTokenAccountInstruction(
			creator.publicKey,
			wsolAta,
			creator.publicKey,
			NATIVE_MINT
		)

		const transferIx = SystemProgram.transfer({
			fromPubkey: creator.publicKey,
			toPubkey: wsolAta,
			lamports: BigInt(lamportsAmount.toString())
		})

		const syncNativeIx = createSyncNativeInstruction(wsolAta)

		const closeWsolAtaIx = createCloseAccountInstruction(
			wsolAta,
			creator.publicKey,
			creator.publicKey
		)

		const tx = new Transaction().add(
			createWsolAtaIx,
			transferIx,
			syncNativeIx,
			initPoolIx,
			closeWsolAtaIx
		)

		tx.recentBlockhash = (await this.connection.getLatestBlockhash()).blockhash
		tx.feePayer = creator.publicKey
		tx.sign(creator)

		const simulationResult = await this.connection.simulateTransaction(tx)

		if (simulationResult.value.err) {
			throw new InternalServerErrorException(
				"Simulation failed",
				simulationResult.value.err
			)
		}

		const txSig = await this.connection.sendRawTransaction(tx.serialize())
		await this.connection.confirmTransaction(txSig, "finalized")

		return {
			txSig
		}
	}

	async createAmmConfig(
		owner: Signer,
		config_index: number,
		tradeFeeRate: BN,
		protocolFeeRate: BN,
		fundFeeRate: BN,
		create_fee: BN
	): Promise<PublicKey> {
		const [address, _] = await getAmmConfigAddress(
			config_index,
			this.program.programId
		)

		if (await this.accountExist(address)) {
			return address
		}

		const ix = await this.program.methods
			.createAmmConfig(
				config_index,
				tradeFeeRate,
				protocolFeeRate,
				fundFeeRate,
				create_fee
			)
			.accounts({
				owner: owner.publicKey,
				ammConfig: address,
				systemProgram: SystemProgram.programId
			})
			.instruction()

		await this.sendTransactionWithInstruction([ix], [owner])

		return address
	}

	async accountExist(account: PublicKey) {
		const info = await this.connection.getAccountInfo(account)
		if (info == null || info.data.length === 0) {
			return false
		}
		return true
	}

	async sendTransactionWithInstruction(
		ixs: TransactionInstruction[],
		signers: Array<Signer>
	): Promise<TransactionSignature> {
		const tx = new Transaction()
		for (const ix of ixs) {
			tx.add(ix)
		}

		const options: ConfirmOptions = {
			preflightCommitment: "finalized",
			commitment: "finalized"
		}

		const sendOpt = options && {
			skipPreflight: options.skipPreflight,
			preflightCommitment: options.preflightCommitment || options.commitment
		}

		tx.recentBlockhash = (await this.connection.getLatestBlockhash()).blockhash
		const signature = await this.connection.sendTransaction(
			tx,
			signers,
			sendOpt
		)

		const status = (
			await this.connection.confirmTransaction(signature, options.commitment)
		).value

		if (status.err) {
			throw new Error(
				`Raw transaction ${signature} failed (${JSON.stringify(status)})`
			)
		}
		return signature
	}

	sortTokens(
		tokenAddress: PublicKey,
		lamportsAmount: BN,
		tokensAmount: BN
	): IToken[] {
		const tokenArray: IToken[] = []
		tokenArray.push({
			address: NATIVE_MINT,
			program: TOKEN_PROGRAM_ID,
			amount: lamportsAmount
		})
		tokenArray.push({
			address: tokenAddress,
			program: TOKEN_2022_PROGRAM_ID,
			amount: tokensAmount
		})

		tokenArray.sort((x, y) => {
			const buffer1 = x.address.toBuffer()
			const buffer2 = y.address.toBuffer()

			for (let i = 0; i < buffer1.length && i < buffer2.length; i++) {
				if (buffer1[i] < buffer2[i]) {
					return -1
				}
				if (buffer1[i] > buffer2[i]) {
					return 1
				}
			}

			if (buffer1.length < buffer2.length) {
				return -1
			}
			if (buffer1.length > buffer2.length) {
				return 1
			}

			return 0
		})

		return [tokenArray[0], tokenArray[1]]
	}
}
