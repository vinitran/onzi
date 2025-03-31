import { OptionalProp } from "@root/_shared/utils/decorators"
import { PaginatedParams } from "@root/_shared/utils/parsers"
import { Type } from "class-transformer"
import { IsEnum, IsNumber, Min } from "class-validator"

export class PaginateListTransactionDto extends PaginatedParams {
	@OptionalProp()
	@IsNumber()
	@Min(0)
	@Type(() => Number)
	minimumLamports?: number

	@OptionalProp({ enum: ["following", "own"] })
	@IsEnum(["following", "own"])
	filterBy?: "following" | "own"
}
