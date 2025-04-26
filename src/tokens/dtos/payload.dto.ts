import { ApiProperty } from "@nestjs/swagger"
import { OptionalProp, Prop } from "@root/_shared/utils/decorators"
import { PaginatedParams } from "@root/dtos/common.dto"
import { Transform, Type } from "class-transformer"
import {
	IsArray,
	IsBoolean,
	IsEnum,
	IsNumber,
	IsOptional,
	IsString,
	IsUrl,
	Length,
	MinLength
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

export enum SickoModeType {
	NEWEST = "newest",
	GRADUATING = "graduating",
	SUGGESTED = "suggested",
	FAVORITE = "favorite"
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

export class SickoModeParams extends PaginatedParams {
	@ApiProperty({
		description: "Sort by param",
		example: SickoModeType.NEWEST,
		required: true,
		enum: SickoModeType
	})
	@Prop()
	@IsEnum(SickoModeType)
	sort: SickoModeType

	@ApiProperty({
		description: "Keywords to exclude from token name/ticker",
		example: ["scam", "fake"],
		isArray: true,
		required: false
	})
	@IsOptional()
	@Transform(({ value }) => (typeof value === "string" ? [value] : value))
	@IsArray()
	@IsString({ each: true })
	@MinLength(1, { each: true })
	excludeKeywords?: string[]

	@ApiProperty({
		description: "Keywords to include in token name/ticker",
		example: ["ponz", "coin"],
		isArray: true,
		required: false
	})
	@IsOptional()
	@Transform(({ value }) => (typeof value === "string" ? [value] : value))
	@IsArray()
	@IsString({ each: true })
	@MinLength(1, { each: true })
	includeKeywords?: string[]

	@ApiProperty({
		description: "Minimum market cap filter",
		example: 1000,
		required: false
	})
	@IsOptional()
	@Type(() => Number)
	@IsNumber({ allowNaN: false })
	marketCapFrom?: number

	@ApiProperty({
		description: "Maximum market cap filter",
		example: 10000,
		required: false
	})
	@IsOptional()
	@Type(() => Number)
	@IsNumber({ allowNaN: false })
	marketCapTo?: number

	@ApiProperty({
		description: "Minimum volume filter",
		example: 100,
		required: false
	})
	@IsOptional()
	@Type(() => Number)
	@IsNumber({ allowNaN: false })
	volumnFrom?: number

	@ApiProperty({
		description: "Maximum volume filter",
		example: 1000,
		required: false
	})
	@IsOptional()
	@Type(() => Number)
	@IsNumber({ allowNaN: false })
	volumnTo?: number

	@ApiProperty({
		description: "Minimum holders filter",
		example: 10,
		required: false
	})
	@IsOptional()
	@Type(() => Number)
	@IsNumber({ allowNaN: false })
	holderFrom?: number

	@ApiProperty({
		description: "Maximum holders filter",
		example: 100,
		required: false
	})
	@IsOptional()
	@Type(() => Number)
	@IsNumber({ allowNaN: false })
	holderTo?: number
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

	@ApiProperty({
		description: "Sort By approaching jackpot",
		example: "desc",
		required: false,
		enum: ["desc", "asc"]
	})
	@IsEnum(["desc", "asc"])
	@IsOptional()
	approachingJackpot?: "desc" | "asc"
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

export class CreateTokenOnchainPayload extends BuyTokenOnchainPayload {
	@ApiProperty({
		description: "lock persent",
		example: 0.4,
		required: false
	})
	@Prop()
	@IsNumber()
	@IsOptional()
	lockPercent?: number

	@ApiProperty({
		description: "lock time",
		example: 3600,
		required: false
	})
	@Prop()
	@IsNumber()
	@IsOptional()
	lockTime?: number

	constructor(partial: Partial<CreateTokenOnchainPayload>) {
		super()
		Object.assign(this, partial)
		if (
			(this.lockPercent !== undefined && this.lockTime === undefined) ||
			(this.lockPercent === undefined && this.lockTime !== undefined)
		) {
			throw new Error(
				"lockPercent and lockTime must be both provided or both omitted"
			)
		}
	}
}

export class ListTransactionParams extends PaginatedParams {
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
		description: "Sort By type transaction",
		example: "buy",
		required: false,
		enum: ["buy", "sell"]
	})
	@IsEnum(["buy", "sell"])
	@IsOptional()
	type?: "buy" | "sell"

	@ApiProperty({
		description: "Sort By transaction amount token",
		example: "desc",
		required: false,
		enum: ["desc", "asc"]
	})
	@IsEnum(["desc", "asc"])
	@IsOptional()
	amount?: "desc" | "asc"

	@ApiProperty({
		description: "Sort By transaction amount lamports",
		example: "desc",
		required: false,
		enum: ["desc", "asc"]
	})
	@IsEnum(["desc", "asc"])
	@IsOptional()
	lamports?: "desc" | "asc"

	@ApiProperty({
		description: "Sort By token price",
		example: "desc",
		required: false,
		enum: ["desc", "asc"]
	})
	@IsEnum(["desc", "asc"])
	@IsOptional()
	price?: "desc" | "asc"

	@ApiProperty({
		description: "Sort By creation time",
		example: "desc",
		required: false,
		enum: ["desc", "asc"]
	})
	@IsEnum(["desc", "asc"])
	@IsOptional()
	createTime?: "desc" | "asc"

	@ApiProperty({
		description: "Filter by token name",
		example: "Ponz",
		required: false
	})
	@IsString()
	@IsOptional()
	name?: string

	@ApiProperty({
		description: "Minimum amount token filter",
		example: 0,
		required: false
	})
	@IsOptional()
	@Type(() => Number)
	@IsNumber({ allowNaN: false })
	amountTokenFrom?: number

	@ApiProperty({
		description: "Maximum amount token filter",
		example: 1000000,
		required: false
	})
	@IsOptional()
	@Type(() => Number)
	@IsNumber({ allowNaN: false })
	amountTokenTo?: number

	@ApiProperty({
		description: "Minimum amount solana filter",
		example: 0,
		required: false
	})
	@IsOptional()
	@Type(() => Number)
	@IsNumber({ allowNaN: false })
	amountSolFrom?: number

	@ApiProperty({
		description: "Maximum amount solana filter",
		example: 1000000000,
		required: false
	})
	@IsOptional()
	@Type(() => Number)
	@IsNumber({ allowNaN: false })
	amountSolTo?: number

	@ApiProperty({
		description: "Minimum create at filter",
		example: "2024-03-20T00:00:00.000Z",
		required: false
	})
	@IsOptional()
	@Transform(({ value }) => (value ? new Date(value) : undefined))
	@Type(() => Date)
	createAtFrom?: Date

	@ApiProperty({
		description: "Maximum create at filter",
		example: "2024-03-21T00:00:00.000Z",
		required: false
	})
	@IsOptional()
	@Transform(({ value }) => (value ? new Date(value) : undefined))
	@Type(() => Date)
	createAtTo?: Date
}

export class FindListTokenFavoriteParams extends PaginatedParams {}
