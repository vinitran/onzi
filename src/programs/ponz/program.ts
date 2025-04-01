import {
	AnchorProvider,
	BorshCoder,
	EventParser,
	Program as SolanaProgram,
	Wallet,
	web3
} from "@coral-xyz/anchor"
import { Injectable } from "@nestjs/common"
import { Env, InjectEnv } from "@root/_env/env.module"
import idl from "@root/programs/ponz/ponz_sc.json"
import { PublicKey } from "@solana/web3.js"
import { InjectConnection } from "../programs.module"
import { PonzSc } from "./idl"

const _MARKETCAP_SEEDS = Buffer.from("marketcap")

const _MASTER_SEEDS = Buffer.from("king_meme_master")

const _TICKET_SEEDS = Buffer.from("king_meme_ticket")

@Injectable()
export class Ponz extends SolanaProgram<PonzSc> {
	public eventParser: EventParser
	constructor(
		@InjectConnection() public connection: web3.Connection,
		@InjectEnv() private env: Env
	) {
		const randomWallet = new Wallet(web3.Keypair.generate())
		super(idl as PonzSc, new AnchorProvider(connection, randomWallet))

		this.eventParser = new EventParser(this.programId, new BorshCoder(this.idl))
	}

	public parseLogs(logs: string[]) {
		return this.eventParser.parseLogs(logs)
	}

	public async calculateMarketcap(mint: PublicKey) {
		const [bondingCurve] = web3.PublicKey.findProgramAddressSync(
			[
				mint.toBuffer(), // Dùng toBuffer() thay vì toBytes()
				Buffer.from("bonding_curve") // Sử dụng Buffer.from() trực tiếp
			],
			this.programId
		)

		try {
			const marketcapAccount =
				await this.account.bondingCurve.fetch(bondingCurve)

			return marketcapAccount.initVirtualSol * marketcapAccount.solReserves
		} catch {
			return 0
		}
	}
}
