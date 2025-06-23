import { BN } from "@coral-xyz/anchor"

export type CreateTokenEvent = {
	creator: string
	mint: string
	name: string
	symbol: string
	uri: string
	timestamp: string
	signature: string
	type: "Create"
}

export type BuyTokensEvent = {
	mint: string
	buyer: string
	amount: string
	lamports: string
	previousPrice: string
	newPrice: string
	timestamp: string
	signature: string
	netAmount: string
	type: "Buy"
}

export type SellTokensEvent = {
	seller: string
	mint: string
	amount: string
	lamports: string
	previousPrice: string
	newPrice: string
	timestamp: string
	signature: string
	type: "Sell"
}

export type CompleteBondingCurveEvent = {
	mint: string
	bondingCurve: string
	tokenPool: string
	signature: string
	type: "CompleteBondingCurve"
}

export type RemoveLiquidityEvent = {
	mint: string
	withdrawer: string
	amount: string
	lamports: string
	signature: string
	type: "RemoveLiquidity"
}

export const EVENTS = {
	CreateToken: "createTokenEvent",
	BuyTokens: "buyEvent",
	SellTokens: "sellEvent",
	CompleteBondingCurve: "bondingCurveCompletedEvent",
	RemoveLiquidity: "removeLiquidityEvent"
} as const

export type TokenMetadataArgs = {
	name: string
	symbol: string
	uri: string
	transferFeeBasisPoints: number
	maximumFee: BN
}
