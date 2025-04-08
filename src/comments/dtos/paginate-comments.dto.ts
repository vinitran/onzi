import { ApiProperty } from "@nestjs/swagger"
import { OptionalProp } from "@root/_shared/utils/decorators"
import { PaginatedParams } from "@root/_shared/utils/parsers"
import { IsEnum, IsOptional } from "class-validator"

export class PaginateCommentsDto extends PaginatedParams {
	@ApiProperty({
		description: "Sort order for comments by creation date",
		enum: ["desc", "asc"],
		example: "desc",
		required: false,
		default: "desc"
	})
	@OptionalProp({ default: "desc", enum: ["desc", "asc"] })
	@IsEnum({ ASC: "asc", DESC: "desc" })
	@IsOptional()
	sortCreatedAt?: "asc" | "desc"
}
