import { BN } from "@coral-xyz/anchor"

export type BuyTokensEvent = {
	mint: string
	buyer: string
	amount: string
	lamports: string
	previousPrice: string
	newPrice: string
	timestamp: string
}

export type CreateTokenEventDto = {
	creator: string
	pubkey: string
	name: string
	symbol: string
	uri: string
	timestamp: string
}

export type CreateTokenEvent = {
	creator: string
	mint: string
	name: string
	symbol: string
	uri: string
	timestamp: string
}

export type SellTokensEvent = {
	seller: string
	mint: string
	amount: string
	lamports: string
	previousPrice: string
	newPrice: string
	timestamp: string
}

export const EVENTS = {
	CreateToken: "createTokenEvent",
	BuyTokens: "buyEvent",
	SellTokens: "sellEvent"
} as const

export type TokenMetadataArgs = {
	name: string
	symbol: string
	uri: string
	transferFeeBasisPoints: number
	maximumFee: BN
}
