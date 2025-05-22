import { ApiProperty } from "@nestjs/swagger"
import { Token } from "@root/dtos/token.dto"
import { User } from "@root/dtos/user.dto"
import { Expose, Type } from "class-transformer"

export enum TransactionType {
	BUY = "Buy",
	SELL = "Sell"
}

export enum Network {
	Solana = "Solana"
}

export class TokenTransaction {
	@ApiProperty({ description: "Transaction id" })
	@Expose()
	id: string

	@ApiProperty({ description: "Transaction signature" })
	@Expose()
	signature: string

	@ApiProperty({ description: "Transaction amount" })
	@Expose()
	@Type(() => Number)
	amount: number

	@ApiProperty({ description: "Token address" })
	@Expose()
	tokenAddress: string

	@ApiProperty({ description: "Lamports amount (Solana coin)" })
	@Expose()
	@Type(() => Number)
	lamports: number

	@ApiProperty({ description: "Transaction date" })
	@Expose()
	@Type(() => Date)
	date: Date

	@ApiProperty({ description: "Transaction signer" })
	@Expose()
	signer: string

	@ApiProperty({ description: "Token price at transaction time" })
	@Expose()
	@Type(() => Number)
	price: number

	@ApiProperty({ description: "New token price after transaction" })
	@Expose()
	@Type(() => Number)
	newPrice: number

	@ApiProperty({ description: "Transaction type", enum: TransactionType })
	@Expose()
	type: TransactionType

	@ApiProperty({ description: "Transaction network", enum: Network })
	@Expose()
	network: Network

	@ApiProperty({ description: "Transaction creation timestamp" })
	@Expose()
	createdAt: Date

	@ApiProperty({ description: "Transaction update timestamp" })
	@Expose()
	updatedAt?: Date

	@ApiProperty({
		description: "Transaction creator",
		required: false,
		type: User
	})
	@Expose()
	createdBy?: User

	@ApiProperty({
		description: "Transaction token",
		required: false,
		type: Token
	})
	@Expose()
	token?: Token

	constructor(partial: Partial<TokenTransaction>) {
		Object.assign(this, partial)
	}
}
