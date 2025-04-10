import { ApiProperty } from "@nestjs/swagger"
import { OptionalProp, Prop } from "@root/_shared/utils/decorators"
import { PaginatedParams } from "@root/dtos/common.dto"
import { Type } from "class-transformer"
import {
	IsBoolean,
	IsEnum,
	IsNumber,
	IsOptional,
	IsString,
	Length,
	Min
} from "class-validator"

export class CreateTokenPayload {
	@ApiProperty({
		description: "Name of the token",
		example: "My Token",
		minLength: 3,
		maxLength: 80
	})
	@Prop()
	@IsString()
	@Length(3, 80)
	name: string

	@ApiProperty({
		description: "Ticker symbol of the token",
		example: "MTK"
	})
	@Prop()
	@IsString()
	ticker: string

	@ApiProperty({
		description: "Description of the token",
		example: "A token for my awesome project"
	})
	@Prop()
	@IsString()
	description: string
}

export class FindTokenParams extends PaginatedParams {
	@ApiProperty({
		description: "Sort by latest creation date",
		example: true,
		required: false,
		default: false
	})
	@OptionalProp({ default: false })
	@IsBoolean()
	@IsOptional()
	@Type(() => Boolean)
	latest?: boolean
}

export class BuyTokenOnchainPayload {
	@ApiProperty({
		description: "Minimum SOL amount for buying token",
		example: "1"
	})
	@Prop()
	@IsString()
	minSol: string

	@ApiProperty({
		description: "Maximum SOL amount for buying token",
		example: "1000000000"
	})
	@Prop()
	@IsString()
	maxSol: string
}

export class CreateTokenOnchainPayload extends BuyTokenOnchainPayload {}

export class ListTransactionParams extends PaginatedParams {
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
