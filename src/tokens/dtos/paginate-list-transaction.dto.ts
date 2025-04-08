import { ApiProperty } from "@nestjs/swagger"
import { OptionalProp } from "@root/_shared/utils/decorators"
import { PaginatedParams } from "@root/_shared/utils/parsers"
import { Type } from "class-transformer"
import { IsEnum, IsNumber, Min } from "class-validator"

export class PaginateListTransactionDto extends PaginatedParams {
	@ApiProperty({
		description: "Minimum lamports filter for transactions",
		example: 1000,
		required: false
	})
	@OptionalProp()
	@IsNumber()
	@Min(0)
	@Type(() => Number)
	minimumLamports?: number

	@ApiProperty({
		description: "Filter transactions by following or own",
		enum: ["following", "own"],
		example: "following",
		required: false
	})
	@OptionalProp({ enum: ["following", "own"] })
	@IsEnum(["following", "own"])
	filterBy?: "following" | "own"
}
