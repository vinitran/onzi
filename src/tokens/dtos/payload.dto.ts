import { ApiProperty } from "@nestjs/swagger"
import { OptionalProp, Prop } from "@root/_shared/utils/decorators"
import { PaginatedParams } from "@root/dtos/common.dto"
import { Transform, Type } from "class-transformer"
import {
	IsBoolean,
	IsEnum,
	IsNumber,
	IsOptional,
	IsString,
	IsUrl,
	Length,
	Min
} from "class-validator"

export enum ContentType {
	JPEG = "image/jpeg",
	PNG = "image/png",
	GIF = "image/gif",
	WEBP = "image/webp",
	MP4 = "video/mp4",
	MOV = "video/quicktime",
	AVI = "video/x-msvideo",
	PDF = "application/pdf",
	JSON = "application/json"
}

class Social {
	@ApiProperty({
		description: "Telegram group/channel link",
		example: "https://t.me/yourgroup",
		required: false
	})
	@OptionalProp()
	@IsString()
	@IsUrl()
	@IsOptional()
	telegramLink?: string

	@ApiProperty({
		description: "Twitter profile link",
		example: "https://twitter.com/yourprofile",
		required: false
	})
	@OptionalProp()
	@IsString()
	@IsUrl()
	@IsOptional()
	twitterLink?: string

	@ApiProperty({
		description: "Website URL",
		example: "https://yourwebsite.com",
		required: false
	})
	@OptionalProp()
	@IsString()
	@IsUrl()
	@IsOptional()
	websiteLink?: string

	@ApiProperty({
		description: "Instagram profile link",
		example: "https://instagram.com/yourprofile",
		required: false
	})
	@OptionalProp()
	@IsString()
	@IsUrl()
	@IsOptional()
	instagramLink?: string

	@ApiProperty({
		description: "YouTube channel link",
		example: "https://youtube.com/yourchannel",
		required: false
	})
	@OptionalProp()
	@IsString()
	@IsUrl()
	@IsOptional()
	youtubeLink?: string

	@ApiProperty({
		description: "TikTok profile link",
		example: "https://tiktok.com/@yourprofile",
		required: false
	})
	@OptionalProp()
	@IsString()
	@IsUrl()
	@IsOptional()
	tiktokLink?: string

	@ApiProperty({
		description: "OnlyFans profile link",
		example: "https://onlyfans.com/yourprofile",
		required: false
	})
	@OptionalProp()
	@IsString()
	@IsUrl()
	@IsOptional()
	onlyFansLink?: string
}

export class CreateTokenPayload extends Social {
	@ApiProperty({
		description: "Content type of the token",
		example: ContentType.PNG,
		enum: ContentType,
		required: true
	})
	@Prop()
	@IsEnum(ContentType)
	contentType: ContentType

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

	@ApiProperty({
		description: "Token reward tax percentage",
		example: 2
	})
	@Prop()
	@IsNumber()
	rewardTax: number

	@ApiProperty({
		description: "Token jackpot tax percentage",
		example: 1
	})
	@Prop()
	@IsNumber()
	jackpotTax: number

	@ApiProperty({
		description: "Token jackpot amount",
		example: 1000
	})
	@Prop()
	@IsNumber()
	jackpotAmount: number

	@ApiProperty({
		description: "Token burn tax percentage",
		example: 2
	})
	@Prop()
	@IsNumber()
	burnTax: number
}

export class FindTokenParams extends PaginatedParams {
	@ApiProperty({
		description: "Text to search in token name, ticker, and description",
		example: "Ponz",
		required: false
	})
	@IsOptional()
	@IsString()
	searchText?: string

	@ApiProperty({
		description: "Sort by latest creation date",
		example: "desc",
		required: false,
		enum: ["desc", "asc"]
	})
	@IsEnum(["desc", "asc"])
	@IsOptional()
	latest?: "desc" | "asc"

	@ApiProperty({
		description: "Show detail token",
		example: false,
		required: false
	})
	@IsBoolean()
	@IsOptional()
	@Transform(({ value }) => value === "true")
	detail?: boolean

	@ApiProperty({
		description: "Search hall of fame",
		example: false,
		required: false
	})
	@IsBoolean()
	@IsOptional()
	@Transform(({ value }) => value === "true")
	hallOfFame?: boolean

	@ApiProperty({
		description: "Sort By MarketCap",
		example: "desc",
		required: false,
		enum: ["desc", "asc"]
	})
	@IsEnum(["desc", "asc"])
	@IsOptional()
	marketCap?: "desc" | "asc"

	@ApiProperty({
		description: "Sort By Price",
		example: "desc",
		required: false,
		enum: ["desc", "asc"]
	})
	@IsEnum(["desc", "asc"])
	@IsOptional()
	price?: "desc" | "asc"

	@ApiProperty({
		description: "Sort By Transaction amount",
		example: "desc",
		required: false,
		enum: ["desc", "asc"]
	})
	@IsEnum(["desc", "asc"])
	@IsOptional()
	tx?: "desc" | "asc"

	@ApiProperty({
		description: "Sort By Transaction volumn",
		example: "desc",
		required: false,
		enum: ["desc", "asc"]
	})
	@IsEnum(["desc", "asc"])
	@IsOptional()
	volumn?: "desc" | "asc"

	@ApiProperty({
		description: "Sort By 1h Price Change",
		example: "desc",
		required: false,
		enum: ["desc", "asc"]
	})
	@IsEnum(["desc", "asc"])
	@IsOptional()
	priceChange1h?: "desc" | "asc"

	@ApiProperty({
		description: "Sort By 24h Price Change",
		example: "desc",
		required: false,
		enum: ["desc", "asc"]
	})
	@IsEnum(["desc", "asc"])
	@IsOptional()
	priceChange24h?: "desc" | "asc"

	@ApiProperty({
		description: "Sort By 7d Price Change",
		example: "desc",
		required: false,
		enum: ["desc", "asc"]
	})
	@IsEnum(["desc", "asc"])
	@IsOptional()
	priceChange7d?: "desc" | "asc"

	@ApiProperty({
		description: "Sort By Amount of Token Holders",
		example: "desc",
		required: false,
		enum: ["desc", "asc"]
	})
	@IsEnum(["desc", "asc"])
	@IsOptional()
	holders?: "desc" | "asc"

	@ApiProperty({
		description: "Sort By last trade time",
		example: "desc",
		required: false,
		enum: ["desc", "asc"]
	})
	@IsEnum(["desc", "asc"])
	@IsOptional()
	lastTrade?: "desc" | "asc"
}

export class BuyTokenOnchainPayload {
	@ApiProperty({
		description: "SOL amount for buying token",
		example: "1000000000"
	})
	@Prop()
	@IsString()
	amountSol: string

	@ApiProperty({
		description: "Minimun Token out",
		example: "1000000000"
	})
	@Prop()
	@IsString()
	minTokenOut: string
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

export class FindListTokenFavoriteParams extends PaginatedParams {}
