import { ApiProperty } from "@nestjs/swagger"
import { Expose } from "class-transformer"

export class TokenTransactionUserDto {
	@ApiProperty({ description: "User username", nullable: true })
	@Expose()
	username: string | null

	@ApiProperty({ description: "User address" })
	@Expose()
	address: string

	@ApiProperty({ description: "User avatar URL", nullable: true })
	@Expose()
	avatarUrl: string | null
}

export class TokenTransactionTokenDto {
	@ApiProperty({ description: "Token address" })
	@Expose()
	address: string

	@ApiProperty({ description: "Token name" })
	@Expose()
	name: string

	@ApiProperty({ description: "Token network" })
	@Expose()
	network: string

	@ApiProperty({ description: "Token market capacity", type: "string" })
	@Expose()
	marketCapacity: string
}

export class TokenTransactionResponseDto {
	@ApiProperty({ description: "Transaction ID" })
	@Expose()
	id: string

	@ApiProperty({ description: "Transaction signature" })
	@Expose()
	signature: string

	@ApiProperty({ description: "Token address" })
	@Expose()
	tokenAddress: string

	@ApiProperty({ description: "Transaction type" })
	@Expose()
	type: string

	@ApiProperty({ description: "Transaction amount", type: "string" })
	@Expose()
	amount: string

	@ApiProperty({ description: "Transaction lamports", type: "string" })
	@Expose()
	lamports: string

	@ApiProperty({ description: "Transaction price" })
	@Expose()
	price: number

	@ApiProperty({ description: "Transaction new price" })
	@Expose()
	newPrice: number

	@ApiProperty({ description: "Transaction network" })
	@Expose()
	network: string

	@ApiProperty({ description: "Transaction signer" })
	@Expose()
	signer: string

	@ApiProperty({ description: "Transaction creation timestamp" })
	@Expose()
	createdAt: Date

	@ApiProperty({ description: "Transaction update timestamp", nullable: true })
	@Expose()
	updatedAt: Date | null

	@ApiProperty({
		description: "Token information",
		type: TokenTransactionTokenDto
	})
	@Expose()
	token: TokenTransactionTokenDto

	@ApiProperty({
		description: "User information",
		type: TokenTransactionUserDto
	})
	@Expose()
	createdBy: TokenTransactionUserDto
}
