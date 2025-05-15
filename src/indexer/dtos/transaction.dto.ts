import { BN } from "@coral-xyz/anchor"
import { Expose } from 'class-transformer';

class Signer {
	@Expose()
	id: string

	@Expose()
	address: string

	@Expose()
	username: string
}
export class TokenCreationDto {
	address: string
	name: string
	network: string
	createdBy: {
		id: string
		createdAt: Date
		updatedAt: Date | null
		address: string
		username: string | null
		bio: string | null
		avatarUrl: string | null
		premium: boolean
	}
}
export class TransactionDto {
	address: string
	date: number
	amount: BN
	lamports: BN
	signer: Signer
	price: number
	newPrice: number
	network: string
	signature: string
}
