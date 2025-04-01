import { BN, web3 } from "@coral-xyz/anchor"
import { PublicKey } from "@solana/web3.js"

export type BuyTokensEvent = {
	mint: web3.PublicKey
	buyer: web3.PublicKey
	amount: BN
	lamports: BN
	previousPrice: number
	newPrice: number
}

export type CreateTokenEventDto = {
	creator: PublicKey
	pubkey: PublicKey
	name: string
	symbol: string
	uri: string
	timestamp: BN
}

export type CreateTokenEvent = {
	creator: web3.PublicKey
	address: web3.PublicKey
	name: string
	symbol: string
	uri: string
	ticker?: string
}

export type SellTokensEvent = {
	seller: web3.PublicKey
	mint: web3.PublicKey
	amount: BN
	lamports: BN
	previousPrice: number
	newPrice: number
}

export const EVENTS = {
	CreateToken: "createTokenEvent",
	BuyTokens: "buyTokensEvent",
	SellTokens: "sellTokensEvent",
	ClaimEvent: "claimTicketEvent"
} as const
