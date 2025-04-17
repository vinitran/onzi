import { ApiProperty } from "@nestjs/swagger"
import { Expose } from "class-transformer"

export class TokenOwner {
	@ApiProperty({
		description: "Token owner id",
		example: "123e4567-e89b-12d3-a456-426614174000"
	})
	@Expose()
	id: string

	@ApiProperty({
		description: "User address who owns the token",
		example: "ES69bn51QABsJ5G5Kp2LZW524MCSdxhP1a7dHB84nQ12"
	})
	@Expose()
	userAddress: string

	@ApiProperty({
		description: "Token address that is owned",
		example: "ES69bn51QABsJ5G5Kp2LZW524MCSdxhP1a7dHB84nQ12"
	})
	@Expose()
	tokenAddress: string

	@ApiProperty({
		description: "Amount of tokens owned",
		example: "1000000000000000000",
		required: false
	})
	@Expose()
	amount?: number

	@ApiProperty({
		description: "Token creation timestamp",
		example: "2024-03-19T10:15:00Z"
	})
	@Expose()
	createdAt: Date

	@ApiProperty({
		description: "Token update timestamp",
		example: "2024-03-23T14:20:00Z"
	})
	@Expose()
	updatedAt?: Date

	constructor(partial: Partial<TokenOwner>) {
		Object.assign(this, partial)
	}
}
