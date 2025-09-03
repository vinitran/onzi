import * as anchor from "@coral-xyz/anchor"
import { Program, Program as SolanaProgram } from "@coral-xyz/anchor"
import { SYSTEM_PROGRAM_ID } from "@coral-xyz/anchor/dist/cjs/native/system"
import { Injectable } from "@nestjs/common"
import { Connection, PublicKey, Transaction } from "@solana/web3.js"
import { InjectConnection } from "../programs.module"
import { PonzVault as PonzVaultSc } from "./idl"
import idl from "./ponz-vault.json"

@Injectable()
export class PonzVault extends SolanaProgram<PonzVaultSc> {
	public program: Program<PonzVaultSc>
	public account

	constructor(@InjectConnection() public readonly connection: Connection) {
		const randomWallet = new anchor.Wallet(anchor.web3.Keypair.generate())
		const provider = new anchor.AnchorProvider(connection, randomWallet)
		super(idl as PonzVaultSc, provider)
		this.program = new Program(idl as PonzVaultSc, provider)
		this.account = this.program.account
	}

	// ===== PDAs
	get masterPDA(): PublicKey {
		return PublicKey.findProgramAddressSync(
			[Buffer.from(anchor.utils.bytes.utf8.encode("master"))],
			this.program.programId
		)[0]
	}

	get solPoolPDA(): PublicKey {
		return PublicKey.findProgramAddressSync(
			[Buffer.from(anchor.utils.bytes.utf8.encode("sol_pool"))],
			this.program.programId
		)[0]
	}

	public tokenPoolPDA(mint: PublicKey): PublicKey {
		return PublicKey.findProgramAddressSync(
			[
				mint.toBytes(),
				Buffer.from(anchor.utils.bytes.utf8.encode("token_pool"))
			],
			this.program.programId
		)[0]
	}

	// ===== Functions
	public async withdrawSol(
		ponzMultiSigWallet: PublicKey
	): Promise<Transaction> {
		const tx = await this.program.methods
			.withdrawSol()
			.accountsStrict({
				master: this.masterPDA,
				solPool: this.solPoolPDA,
				withdrawer: ponzMultiSigWallet,
				systemProgram: SYSTEM_PROGRAM_ID
			})
			.transaction()

		tx.recentBlockhash = (await this.connection.getLatestBlockhash()).blockhash
		tx.feePayer = ponzMultiSigWallet

		return tx
	}
}
