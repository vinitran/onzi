export interface TokenAccount {
	address: string
	mint: string
	owner: string
	amount: number
	delegated_amount: number
	frozen: boolean
}

export interface TokenAccountResponse {
	total: number
	limit: number
	page: number
	token_accounts: TokenAccount[]
}
