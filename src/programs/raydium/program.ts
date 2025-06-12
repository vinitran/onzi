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
	POOL_SEED,
	getAmmConfigAddress,
	getAuthAddress,
	getOrcleAccountAddress,
	getPoolAddress,
	getPoolLpMintAddress,
	getPoolVaultAddress
} from "@root/programs/raydium/pda"
import idl from "@root/programs/raydium/raydium_cp_swap.json"
import {
	ASSOCIATED_TOKEN_PROGRAM_ID,
	NATIVE_MINT,
	TOKEN_2022_PROGRAM_ID,
	TOKEN_PROGRAM_ID,
	createAssociatedTokenAccountIdempotentInstruction,
	createAssociatedTokenAccountInstruction,
	createBurnCheckedInstruction,
	createCloseAccountInstruction,
	createSyncNativeInstruction,
	getAssociatedTokenAddressSync
} from "@solana/spl-token"
import {
	ConfirmOptions,
	Keypair,
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

		return txSig
	}

	async swap(
		owner: Keypair,
		feePayer: Keypair,
		tokenAddress: PublicKey,
		exactAmountIn: BN,
		slippage: BN, // 10_000 = 100% - 100% = 1%
		inputIsWSol: boolean, // false -> active
		taxPercent: number // 10_000 = 100% - 100 = 1%
	) {
		const [configAddress] = await getAmmConfigAddress(0, this.program.programId)

		const amountInputAfterTaxes = this.calculateInputAmountAfterTaxes(
			exactAmountIn,
			taxPercent
		)

		const minimumAmountOut = await this.calculateAmountOut(
			tokenAddress,
			amountInputAfterTaxes,
			slippage,
			inputIsWSol
		)

		const tx = await this.swapBaseIn(
			owner.publicKey,
			feePayer.publicKey,
			configAddress,
			tokenAddress,
			exactAmountIn,
			minimumAmountOut,
			inputIsWSol
		)
		tx.recentBlockhash = (await this.connection.getLatestBlockhash()).blockhash
		tx.feePayer = feePayer.publicKey
		tx.sign(feePayer, owner)

		const simulationResult = await this.connection.simulateTransaction(tx)

		if (simulationResult.value.err) {
			throw Error(simulationResult.value.err.toString())
		}

		const txSig = await this.connection.sendRawTransaction(tx.serialize(), {
			skipPreflight: true,
			maxRetries: 5
		})
		await this.connection.confirmTransaction(txSig, "finalized")
		return txSig
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

	async burnLpToken(tokenAddress: PublicKey, creator: Keypair) {
		const sortedTokenArray = this.sortTokens(tokenAddress, new BN(0), new BN(0))
		if (sortedTokenArray.length !== 2)
			throw new InternalServerErrorException("Can not sort token")

		const token0 = sortedTokenArray[0]
		const token1 = sortedTokenArray[1]

		const poolAddress = await this.fetchPoolAddress(
			token0.address,
			token1.address
		)

		const poolState = await this.program.account.poolState.fetch(poolAddress)
		const lpMintAddress = poolState.lpMint

		// fetch lpMintAta - creator's ATA
		const lpMintAta = getAssociatedTokenAddressSync(
			lpMintAddress,
			creator.publicKey
		)
		console.log("lpMintAta", lpMintAta.toBase58())

		const lpMintAtaAccount =
			await this.connection.getTokenAccountBalance(lpMintAta)
		console.log("lpMintAtaAccount", lpMintAtaAccount.value.amount)

		// Burn entire the amount in the creator's lpMintAta
		const tx = new Transaction().add(
			createBurnCheckedInstruction(
				lpMintAta,
				lpMintAddress,
				creator.publicKey,
				BigInt(lpMintAtaAccount.value.amount),
				lpMintAtaAccount.value.decimals
			)
		)

		tx.recentBlockhash = (await this.connection.getLatestBlockhash()).blockhash
		tx.feePayer = creator.publicKey
		tx.sign(creator)

		const txSig = await this.connection.sendRawTransaction(tx.serialize(), {
			skipPreflight: true,
			maxRetries: 5
		})

		await this.connection.confirmTransaction(txSig, "confirmed")
		return txSig
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

	getPoolAddress(
		ammConfig: PublicKey,
		tokenMint0: PublicKey,
		tokenMint1: PublicKey,
		programId: PublicKey
	): [PublicKey, number] {
		const [token0, token1] = this.sortTokenAddresses(tokenMint0, tokenMint1)

		const [address, bump] = PublicKey.findProgramAddressSync(
			[POOL_SEED, ammConfig.toBuffer(), token0.toBuffer(), token1.toBuffer()],
			programId
		)
		return [address, bump]
	}

	async fetchPoolAddress(tokenMint0: PublicKey, tokenMint1: PublicKey) {
		const [ammConfigAddress] = await getAmmConfigAddress(
			0,
			this.program.programId
		)

		return this.getPoolAddress(
			ammConfigAddress,
			tokenMint0,
			tokenMint1,
			this.program.programId
		)[0]
	}

	async fetchPool(
		tokenMint0: PublicKey,
		tokenMint1: PublicKey
	): Promise<[BN, BN]> {
		const poolAddress = await this.fetchPoolAddress(tokenMint0, tokenMint1)

		const poolState = await this.program.account.poolState.fetch(poolAddress)

		const pool0 = poolState.token0Vault
		const pool1 = poolState.token1Vault
		const pool0Balance = await this.connection.getTokenAccountBalance(pool0)
		const pool1Balance = await this.connection.getTokenAccountBalance(pool1)

		const wSolReserve =
			poolState.token0Mint.toString() === NATIVE_MINT.toString()
				? new BN(pool0Balance.value.amount)
				: new BN(pool1Balance.value.amount)

		const tokenReserve =
			poolState.token0Mint.toString() === NATIVE_MINT.toString()
				? new BN(pool1Balance.value.amount)
				: new BN(pool0Balance.value.amount)

		const _kParam = new BN(pool0Balance.value.amount).mul(
			new BN(pool1Balance.value.amount)
		)

		return [wSolReserve, tokenReserve]
	}

	async calculateAmountOut(
		tokenAddress: PublicKey,
		exactAmountIn: BN,
		slippage: BN,
		inputIsWSOL: boolean
	): Promise<BN> {
		const [wSolReserve, tokenReserve] = await this.fetchPool(
			NATIVE_MINT,
			tokenAddress
		)

		const [ammConfigAddress] = await getAmmConfigAddress(
			0,
			this.program.programId
		)

		const ammConfig =
			await this.program.account.ammConfig.fetch(ammConfigAddress)
		const tradeFeeRate: BN = ammConfig.tradeFeeRate
		const ONE_MILLION = new BN(1_000_000)

		const reserveIn = inputIsWSOL ? wSolReserve : tokenReserve
		const reserveOut = inputIsWSOL ? tokenReserve : wSolReserve

		const feeAmount = exactAmountIn.mul(tradeFeeRate).div(ONE_MILLION)

		const netIn = exactAmountIn.sub(feeAmount)

		const newReserveIn = reserveIn.add(netIn)
		let amountOut = reserveOut.mul(netIn).div(newReserveIn)

		if (slippage.gt(new BN(0))) {
			amountOut = amountOut.sub(amountOut.mul(slippage).div(new BN(10_000)))
		}

		return amountOut
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

	sortTokenAddresses(tokenA: PublicKey, tokenB: PublicKey): PublicKey[] {
		const tokenArray: PublicKey[] = [tokenA, tokenB]

		tokenArray.sort((x, y) => {
			const buffer1 = x.toBuffer()
			const buffer2 = y.toBuffer()

			for (let i = 0; i < buffer1.length && i < buffer2.length; i++) {
				if (buffer1[i] < buffer2[i]) return -1
				if (buffer1[i] > buffer2[i]) return 1
			}

			return buffer1.length - buffer2.length
		})

		return tokenArray
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

	async swapBaseOutput(
		program: Program<RaydiumCpSwap>,
		creator: PublicKey,
		configAddress: PublicKey,
		inputToken: PublicKey,
		inputTokenProgram: PublicKey,
		outputToken: PublicKey,
		outputTokenProgram: PublicKey,
		amount_out_less_fee: BN,
		max_amount_in: BN
	): Promise<Transaction> {
		const [auth] = await getAuthAddress(program.programId)
		const [poolAddress] = await getPoolAddress(
			configAddress,
			inputToken,
			outputToken,
			program.programId
		)

		const [inputVault] = await getPoolVaultAddress(
			poolAddress,
			inputToken,
			program.programId
		)
		const [outputVault] = await getPoolVaultAddress(
			poolAddress,
			outputToken,
			program.programId
		)

		const inputTokenAccount = getAssociatedTokenAddressSync(
			inputToken,
			creator,
			false,
			inputTokenProgram
		)
		const outputTokenAccount = getAssociatedTokenAddressSync(
			outputToken,
			creator,
			false,
			outputTokenProgram
		)
		const [observationAddress] = await getOrcleAccountAddress(
			poolAddress,
			program.programId
		)

		const tx = await program.methods
			.swapBaseOutput(max_amount_in, amount_out_less_fee)
			.accountsStrict({
				payer: creator,
				authority: auth,
				ammConfig: configAddress,
				poolState: poolAddress,
				inputTokenAccount,
				outputTokenAccount,
				inputVault,
				outputVault,
				inputTokenProgram: inputTokenProgram,
				outputTokenProgram: outputTokenProgram,
				inputTokenMint: inputToken,
				outputTokenMint: outputToken,
				observationState: observationAddress
			})
			.transaction()

		return tx
	}

	async swapBaseIn(
		creator: PublicKey,
		feePayer: PublicKey,
		configAddress: PublicKey,
		tokenAddress: PublicKey,
		amountIn: BN,
		minimumAmountOut: BN,
		inputIsWSol: boolean
	): Promise<Transaction> {
		const inputToken = inputIsWSol ? NATIVE_MINT : tokenAddress
		const outputToken = inputIsWSol ? tokenAddress : NATIVE_MINT
		const inputTokenProgram = inputIsWSol
			? TOKEN_PROGRAM_ID
			: TOKEN_2022_PROGRAM_ID
		const outputTokenProgram = inputIsWSol
			? TOKEN_2022_PROGRAM_ID
			: TOKEN_PROGRAM_ID

		const [auth] = await getAuthAddress(this.program.programId)
		const [poolAddress] = this.getPoolAddress(
			configAddress,
			inputToken,
			outputToken,
			this.program.programId
		)

		const [inputVault] = await getPoolVaultAddress(
			poolAddress,
			inputToken,
			this.program.programId
		)
		const [outputVault] = await getPoolVaultAddress(
			poolAddress,
			outputToken,
			this.program.programId
		)

		const inputTokenAccount = getAssociatedTokenAddressSync(
			inputToken,
			creator,
			false,
			inputTokenProgram
		)
		const outputTokenAccount = getAssociatedTokenAddressSync(
			outputToken,
			creator,
			false,
			outputTokenProgram
		)

		const [observationAddress] = await getOrcleAccountAddress(
			poolAddress,
			this.program.programId
		)

		const wsolAta = getAssociatedTokenAddressSync(NATIVE_MINT, creator)

		const tokenPubkey = NATIVE_MINT === inputToken ? outputToken : inputToken
		const tokenAta = getAssociatedTokenAddressSync(
			tokenPubkey,
			creator,
			undefined,
			TOKEN_2022_PROGRAM_ID,
			ASSOCIATED_TOKEN_PROGRAM_ID
		)

		const createWsolAtaIx = createAssociatedTokenAccountIdempotentInstruction(
			feePayer,
			wsolAta,
			creator,
			NATIVE_MINT
		)

		const createTokenAtaIx = createAssociatedTokenAccountIdempotentInstruction(
			feePayer,
			tokenAta,
			creator,
			tokenPubkey,
			TOKEN_2022_PROGRAM_ID,
			ASSOCIATED_TOKEN_PROGRAM_ID
		)

		const transferIx = SystemProgram.transfer({
			fromPubkey: creator,
			toPubkey: wsolAta,
			lamports: BigInt(amountIn.toString())
		})

		const syncNativeIx = createSyncNativeInstruction(wsolAta)

		const swapIx = await this.program.methods
			.swapBaseInput(amountIn, minimumAmountOut)
			.accountsStrict({
				payer: creator,
				authority: auth,
				ammConfig: configAddress,
				poolState: poolAddress,
				inputTokenAccount,
				outputTokenAccount,
				inputVault,
				outputVault,
				inputTokenProgram: inputTokenProgram,
				outputTokenProgram: outputTokenProgram,
				inputTokenMint: inputToken,
				outputTokenMint: outputToken,
				observationState: observationAddress
			})
			.instruction()

		const closeWsolAtaIx = createCloseAccountInstruction(
			wsolAta,
			creator,
			creator
		)

		const tx = new Transaction()

		if (inputIsWSol) {
			tx.add(
				createWsolAtaIx,
				createTokenAtaIx,
				transferIx,
				syncNativeIx,
				swapIx,
				closeWsolAtaIx
			)
		} else {
			tx.add(createWsolAtaIx, createTokenAtaIx, swapIx, closeWsolAtaIx)
		}

		return tx
	}

	calculateInputAmountAfterTaxes(inputAmount: BN, taxesPercent: number): BN {
		const taxRate = new BN(taxesPercent).mul(new BN(100)) // percent * 100 (5% -> 500)
		const taxAmount = inputAmount.mul(taxRate).div(new BN(10000)) // input * taxRate / 10000
		const amountAfterTaxes = inputAmount.sub(taxAmount)

		return amountAfterTaxes
	}
}
