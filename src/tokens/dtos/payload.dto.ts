import { ApiProperty } from "@nestjs/swagger"
import {
	EmptyStringToTrue,
	OptionalProp,
	Prop
} from "@root/_shared/utils/decorators"
import { PaginatedParams } from "@root/dtos/common.dto"
import { Transform, Type } from "class-transformer"
import {
	IsArray,
	IsEnum,
	IsNumber,
	IsOptional,
	IsString,
	IsUrl,
	Length,
	MaxLength,
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

export enum ChartStep {
	"1m" = 60, // 1 minute
	"5m" = 300, // 5 minutes
	"30m" = 1800, // 30 minutes
	"1h" = 3600, // 1 hour
	"1d" = 86400, // 24 hours
	"7d" = 604800, // 7 days
	"30d" = 2592000 // 30 days
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
		example: "My Token"
	})
	@Prop()
	@IsString()
	name: string

	@ApiProperty({
		description: "Ticker symbol of the token",
		example: "MTK"
	})
	@Prop()
	@IsString()
	@Length(1, 10)
	ticker: string

	@ApiProperty({
		description: "Description of the token",
		example: "A token for my awesome project"
	})
	@OptionalProp()
	@MaxLength(500)
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
		example: 0,
		required: false
	})
	@IsOptional()
	@Type(() => Number)
	@IsNumber({ allowNaN: false })
	marketCapFrom?: number

	@ApiProperty({
		description: "Maximum market cap filter",
		example: 1000000000,
		required: false
	})
	@IsOptional()
	@Type(() => Number)
	@IsNumber({ allowNaN: false })
	marketCapTo?: number

	@ApiProperty({
		description: "Minimum volume filter",
		example: 0,
		required: false
	})
	@IsOptional()
	@Type(() => Number)
	@IsNumber({ allowNaN: false })
	volumnFrom?: number

	@ApiProperty({
		description: "Maximum volume filter",
		example: 1000000000000,
		required: false
	})
	@IsOptional()
	@Type(() => Number)
	@IsNumber({ allowNaN: false })
	volumnTo?: number

	@ApiProperty({
		description: "Minimum holders filter",
		example: 0,
		required: false
	})
	@IsOptional()
	@Type(() => Number)
	@IsNumber({ allowNaN: false })
	holderFrom?: number

	@ApiProperty({
		description: "Maximum holders filter",
		required: false
	})
	@IsOptional()
	@Type(() => Number)
	@IsNumber({ allowNaN: false })
	holderTo?: number

	@ApiProperty({
		description: "Filter by reward tax > 0",
		required: false
	})
	@IsOptional()
	@EmptyStringToTrue()
	reward?: string

	@ApiProperty({
		description: "Filter by jackpot tax > 0",
		required: false
	})
	@IsOptional()
	@EmptyStringToTrue()
	jackpot?: string

	@ApiProperty({
		description: "Filter by burn tax > 0",
		required: false
	})
	@IsOptional()
	@EmptyStringToTrue()
	burn?: string

	@ApiProperty({
		description: "Filter by lock percentage > 0",
		required: false
	})
	@IsOptional()
	@EmptyStringToTrue()
	lock?: string

	@ApiProperty({
		description: "Filter by lightning percentage > 0",
		required: false
	})
	@IsOptional()
	@EmptyStringToTrue()
	lightning?: string
}

export class FindTokenParams extends PaginatedParams {
	@ApiProperty({
		description: "Text to search in token name, ticker, and description",
		required: false
	})
	@IsOptional()
	@IsString()
	searchText?: string

	@ApiProperty({
		description: "Sort by latest creation date",
		required: false,
		enum: ["desc", "asc"]
	})
	@IsEnum(["desc", "asc"])
	@IsOptional()
	latest?: "desc" | "asc"

	@ApiProperty({
		description: "Show detail token",
		required: false
	})
	@IsOptional()
	@EmptyStringToTrue()
	detail?: string

	@ApiProperty({
		description: "Search hall of fame",
		required: false
	})
	@IsOptional()
	@EmptyStringToTrue()
	hallOfFame?: string

	@ApiProperty({
		description: "Sort By MarketCap",
		required: false,
		enum: ["desc", "asc"]
	})
	@IsEnum(["desc", "asc"])
	@IsOptional()
	marketCap?: "desc" | "asc"

	@ApiProperty({
		description: "Sort By Price",
		required: false,
		enum: ["desc", "asc"]
	})
	@IsEnum(["desc", "asc"])
	@IsOptional()
	price?: "desc" | "asc"

	@ApiProperty({
		description: "Sort By Transaction amount",
		required: false,
		enum: ["desc", "asc"]
	})
	@IsEnum(["desc", "asc"])
	@IsOptional()
	tx?: "desc" | "asc"

	@ApiProperty({
		description: "Sort By Transaction volumn",
		required: false,
		enum: ["desc", "asc"]
	})
	@IsEnum(["desc", "asc"])
	@IsOptional()
	volumn?: "desc" | "asc"

	@ApiProperty({
		description: "Sort By 1h Price Change",
		required: false,
		enum: ["desc", "asc"]
	})
	@IsEnum(["desc", "asc"])
	@IsOptional()
	priceChange1h?: "desc" | "asc"

	@ApiProperty({
		description: "Sort By 24h Price Change",
		required: false,
		enum: ["desc", "asc"]
	})
	@IsEnum(["desc", "asc"])
	@IsOptional()
	priceChange24h?: "desc" | "asc"

	@ApiProperty({
		description: "Sort By 7d Price Change",
		required: false,
		enum: ["desc", "asc"]
	})
	@IsEnum(["desc", "asc"])
	@IsOptional()
	priceChange7d?: "desc" | "asc"

	@ApiProperty({
		description: "Sort By Amount of Token Holders",
		required: false,
		enum: ["desc", "asc"]
	})
	@IsEnum(["desc", "asc"])
	@IsOptional()
	holders?: "desc" | "asc"

	@ApiProperty({
		description: "Sort By last trade time",
		required: false,
		enum: ["desc", "asc"]
	})
	@IsEnum(["desc", "asc"])
	@IsOptional()
	lastTrade?: "desc" | "asc"

	@ApiProperty({
		description: "Sort By approaching jackpot",
		required: false,
		enum: ["desc", "asc"]
	})
	@IsEnum(["desc", "asc"])
	@IsOptional()
	approachingJackpot?: "desc" | "asc"

	@ApiProperty({
		description: "Filter by reward tax > 0",
		required: false
	})
	@IsOptional()
	@EmptyStringToTrue()
	reward?: string

	@ApiProperty({
		description: "Filter by jackpot tax > 0",
		required: false
	})
	@IsOptional()
	@EmptyStringToTrue()
	jackpot?: string

	@ApiProperty({
		description: "Filter by burn tax > 0",
		required: false
	})
	@IsOptional()
	@EmptyStringToTrue()
	burn?: string

	@ApiProperty({
		description: "Filter by lock percentage > 0",
		required: false
	})
	@IsOptional()
	@EmptyStringToTrue()
	lock?: string

	@ApiProperty({
		description: "Filter by lightning percentage > 0",
		required: false
	})
	@IsOptional()
	@EmptyStringToTrue()
	lightning?: string

	@ApiProperty({
		description: "Filter by popular",
		required: false
	})
	@IsOptional()
	@EmptyStringToTrue()
	popular?: string
}

export class FindTokenByTextParams extends PaginatedParams {
	@ApiProperty({
		description: "Text to search for name, ticker",
		example: "ponz"
	})
	@Prop()
	@IsString()
	searchText: string
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
		required: false
	})
	@IsOptional()
	@EmptyStringToTrue()
	detail?: string

	@ApiProperty({
		description: "Sort By type transaction",
		example: "Buy",
		required: false,
		enum: ["Buy", "Sell"]
	})
	@IsEnum(["Buy", "Sell"])
	@IsOptional()
	type?: "Buy" | "Sell"

	@ApiProperty({
		description: "Sort By transaction amount token",
		required: false,
		enum: ["desc", "asc"]
	})
	@IsEnum(["desc", "asc"])
	@IsOptional()
	amount?: "desc" | "asc"

	@ApiProperty({
		description: "Sort By transaction amount lamports",
		required: false,
		enum: ["desc", "asc"]
	})
	@IsEnum(["desc", "asc"])
	@IsOptional()
	lamports?: "desc" | "asc"

	@ApiProperty({
		description: "Sort By token price",
		required: false,
		enum: ["desc", "asc"]
	})
	@IsEnum(["desc", "asc"])
	@IsOptional()
	price?: "desc" | "asc"

	@ApiProperty({
		description: "Sort By creation time",
		required: false,
		enum: ["desc", "asc"]
	})
	@IsEnum(["desc", "asc"])
	@IsOptional()
	createTime?: "desc" | "asc"

	@ApiProperty({
		description: "Filter by token name",
		required: false
	})
	@IsString()
	@IsOptional()
	name?: string

	@ApiProperty({
		description: "Minimum amount token filter",
		required: false
	})
	@IsOptional()
	@Type(() => Number)
	@IsNumber({ allowNaN: false })
	amountTokenFrom?: number

	@ApiProperty({
		description: "Maximum amount token filter",
		example: 1000000000,
		required: false
	})
	@IsOptional()
	@Type(() => Number)
	@IsNumber({ allowNaN: false })
	amountTokenTo?: number

	@ApiProperty({
		description: "Minimum amount solana filter",
		required: false
	})
	@IsOptional()
	@Type(() => Number)
	@IsNumber({ allowNaN: false })
	amountSolFrom?: number

	@ApiProperty({
		description: "Maximum amount solana filter",
		required: false
	})
	@IsOptional()
	@Type(() => Number)
	@IsNumber({ allowNaN: false })
	amountSolTo?: number

	@ApiProperty({
		description: "Minimum create at filter",
		required: false
	})
	@IsOptional()
	@Transform(({ value }) => (value ? new Date(value) : undefined))
	@Type(() => Date)
	createAtFrom?: Date

	@ApiProperty({
		description: "Maximum create at filter",
		required: false
	})
	@IsOptional()
	@Transform(({ value }) => (value ? new Date(value) : undefined))
	@Type(() => Date)
	createAtTo?: Date
}

export class ChartParams {
	@ApiProperty({
		description: "Start timestamp in seconds",
		example: 1711008000,
		required: true
	})
	@Prop()
	@IsNumber()
	from: number

	@ApiProperty({
		description: "End timestamp in seconds",
		example: 1711094400,
		required: true
	})
	@Prop()
	@IsNumber()
	to: number

	@ApiProperty({
		description:
			"Step size in milliseconds. Allowed values: 60 (1m), 300 (5m), 1800 (30m), 3600 (1h), 86400 (24h), 604800 (7d), 2592000 (30d)",
		example: ChartStep["1m"],
		enum: ChartStep,
		required: true
	})
	@Prop()
	@IsNumber()
	@IsEnum(ChartStep)
	step: number
}

export class FindListTokenFavoriteParams extends PaginatedParams {}

export class UpdateTokenPayload {
	@ApiProperty({
		description: "Content type of banner",
		example: ContentType.PNG,
		enum: ContentType,
		required: true
	})
	@Prop()
	@IsEnum(ContentType)
	contentTypeBanner: ContentType
}

export class PaginateDistributionPayload extends PaginatedParams {}
