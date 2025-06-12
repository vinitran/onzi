import { ApiProperty } from "@nestjs/swagger"
import { TokenTransactionDistributeType } from "@prisma/client"
import { Expose, Transform } from "class-transformer"

export class TokenTransactionDistribute {
	@ApiProperty({ type: String, format: "uuid" })
	@Expose()
	id: string

	@ApiProperty({ type: String, format: "uuid" })
	@Expose()
	tokenId: string

	@ApiProperty({ type: String, required: false })
	@Expose()
	from?: string

	@ApiProperty({ type: String, required: false })
	@Expose()
	to?: string

	@ApiProperty({ type: String, description: "BigInt as string", default: "0" })
	@Transform(({ value }) => Number(value))
	@Expose()
	lamport: bigint

	@ApiProperty({ type: String, description: "BigInt as string", default: "0" })
	@Transform(({ value }) => Number(value))
	@Expose()
	amountToken: bigint

	@ApiProperty({ enum: TokenTransactionDistributeType })
	@Expose()
	type: TokenTransactionDistributeType

	@ApiProperty({ type: String, required: false })
	@Expose()
	signature?: string

	@ApiProperty({ type: Date, required: false })
	@Expose()
	updatedAt?: Date
}
