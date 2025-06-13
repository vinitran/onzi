import { ApiProperty } from "@nestjs/swagger"
import { RaydiumStatusType } from "@prisma/client"
import { TokenChart } from "@root/dtos/token-chart.dto"
import { TokenFavorite } from "@root/dtos/token-favorite.dto"
import { TokenOwner } from "@root/dtos/token-owner.dto"
import { User } from "@root/dtos/user.dto"
import { Expose, Type } from "class-transformer"

class SocialToken {
	@ApiProperty({
		description: "Telegram group/channel link",
		example: "https://t.me/yourgroup",
		required: false
	})
	@Expose()
	telegramLink?: string

	@ApiProperty({
		description: "Twitter profile link",
		example: "https://twitter.com/yourprofile",
		required: false
	})
	@Expose()
	twitterLink?: string

	@ApiProperty({
		description: "Website URL",
		example: "https://yourwebsite.com",
		required: false
	})
	@Expose()
	websiteLink?: string

	@ApiProperty({
		description: "Instagram profile link",
		example: "https://instagram.com/yourprofile",
		required: false
	})
	@Expose()
	instagramLink?: string

	@ApiProperty({
		description: "YouTube channel link",
		example: "https://youtube.com/yourchannel",
		required: false
	})
	@Expose()
	youtubeLink?: string

	@ApiProperty({
		description: "TikTok profile link",
		example: "https://tiktok.com/@yourprofile",
		required: false
	})
	@Expose()
	tiktokLink?: string

	@ApiProperty({
		description: "OnlyFans profile link",
		example: "https://onlyfans.com/yourprofile",
		required: false
	})
	@Expose()
	onlyFansLink?: string
}

export class Token extends SocialToken {
	@ApiProperty({
		description: "Token id",
		example: "123e4567-e89b-12d3-a456-426614174000"
	})
	@Expose()
	id: string

	@ApiProperty({
		description: "Token address",
		example: "ES69bn51QABsJ5G5Kp2LZW524MCSdxhP1a7dHB84nQ12"
	})
	@Expose()
	address: string

	@ApiProperty({
		description: "Token name",
		example: "Ponz Token"
	})
	@Expose()
	name: string

	@ApiProperty({
		description: "Token ticker",
		example: "PONZ"
	})
	@Expose()
	ticker: string

	@ApiProperty({ description: "Token price at transaction time" })
	@Expose()
	@Type(() => Number)
	price: number

	@ApiProperty({
		description: "Token metadata URI",
		example: "https://example.com/metadata/ponz.json"
	})
	@Expose()
	uri: string

	@ApiProperty({
		description: "Token image URI",
		example: "https://example.com/tokens/ponz.jpg"
	})
	@Expose()
	imageUri: string

	@ApiProperty({
		description: "Token banner URI",
		example: "https://example.com/tokens/ponz.jpg"
	})
	@Expose()
	bannerUri: string

	@ApiProperty({
		description: "Token raydium status",
		example: "NotListed",
		enum: RaydiumStatusType
	})
	@Expose()
	raydiumStatus: RaydiumStatusType

	@ApiProperty({
		description: "Token metadata",
		example: '{"attributes":[{"trait_type":"Rarity","value":"Legendary"}]}'
	})
	@Expose()
	metadata: string

	@ApiProperty({
		description: "Token description",
		example: "A revolutionary token for the Ponz ecosystem"
	})
	@Expose()
	description: string

	@ApiProperty({
		description: "Is token highlighted?",
		example: true
	})
	@Expose()
	isHighlight: boolean

	@ApiProperty({
		description: "Is token hall of fame?",
		example: false
	})
	@Expose()
	hallOfFame: boolean

	@ApiProperty({
		description: "Token network",
		example: "mainnet"
	})
	@Expose()
	network: string

	@ApiProperty({
		description: "Bonding curve target amount",
		example: 1000000
	})
	@Expose()
	@Type(() => Number)
	bondingCurveTarget: number

	@ApiProperty({
		description: "Has completed bonding curve?",
		example: true
	})
	@Expose()
	isCompletedBondingCurve: boolean

	@ApiProperty({
		description: "Timestamp of bonding curve completion",
		example: "2024-03-20T12:00:00Z",
		required: false
	})
	@Expose()
	createdAtBondingCurve?: string

	@ApiProperty({
		description: "Has completed King of the Hill?",
		example: false
	})
	@Expose()
	isCompletedKingOfHill: boolean

	@ApiProperty({
		description: "Timestamp of King of the Hill",
		example: "2024-03-21T15:30:00Z"
	})
	@Expose()
	createdAtKingOfHill?: string

	@ApiProperty({
		description: "Token bump flag (on chain)",
		example: true
	})
	@Expose()
	bump?: boolean

	@ApiProperty({
		description: "Token creator address",
		example: "ES69bn51QABsJ5G5Kp2LZW524MCSdxhP1a7dHB84nQ12"
	})
	@Expose()
	creatorAddress: string

	@ApiProperty({
		description: "Token market capacity",
		example: 10000000
	})
	@Expose()
	@Type(() => Number)
	marketCapacity?: number

	@ApiProperty({
		description: "Token total supply ",
		example: 1000000000
	})
	@Expose()
	@Type(() => Number)
	totalSupply: number

	@ApiProperty({
		description: "Token bump timestamp",
		example: "2024-03-22T09:45:00Z",
		required: false
	})
	@Expose()
	bumpAt?: Date

	@ApiProperty({
		description: "Token volumn",
		example: 1000000
	})
	@Expose()
	@Type(() => Number)
	volumn: number

	@ApiProperty({
		description: "Token tax percentage",
		example: 5
	})
	@Expose()
	@Type(() => Number)
	tax: number

	@ApiProperty({
		description: "Token reward tax percentage",
		example: 2
	})
	@Expose()
	@Type(() => Number)
	rewardTax: number

	@ApiProperty({
		description: "Token jackpot tax percentage",
		example: 1
	})
	@Expose()
	@Type(() => Number)
	jackpotTax: number

	@ApiProperty({
		description: "Token jackpot amount",
		example: 1000
	})
	@Expose()
	@Type(() => Number)
	jackpotAmount: number

	@ApiProperty({
		description: "Token burn tax percentage",
		example: 2
	})
	@Expose()
	@Type(() => Number)
	burnTax: number

	@ApiProperty({
		description: "Token jackpot amount pending",
		example: 100000000
	})
	@Expose()
	@Type(() => Number)
	jackpotPending: number

	@ApiProperty({
		description: "Token tax amount pending",
		example: 1000000000
	})
	@Expose()
	@Type(() => Number)
	taxPending: number

	@ApiProperty({
		description: "Token lock amount",
		example: 1000000000
	})
	@Expose()
	@Type(() => Number)
	lockAmount: number

	@ApiProperty({
		description: "Token lock time",
		example: "2024-03-19T10:15:00Z"
	})
	@Expose()
	unlockAt: Date

	@ApiProperty({
		description: "Price change in last 1 hour",
		example: 5.25,
		required: false,
		default: 0
	})
	@Expose()
	@Type(() => Number)
	token1hChange: number

	@ApiProperty({
		description: "Price change in last 24 hours",
		example: -2.5,
		required: false,
		default: 0
	})
	@Expose()
	@Type(() => Number)
	token24hChange: number

	@ApiProperty({
		description: "Price change in last 7 days",
		example: 10.75,
		required: false,
		default: 0
	})
	@Expose()
	@Type(() => Number)
	token7dChange: number

	@ApiProperty({
		description: "Token favorite",
		example: false
	})
	@Expose()
	isFavorite?: boolean

	@ApiProperty({ description: "Headeline of token", example: "Token headline" })
	@Expose()
	headline?: string

	@ApiProperty({
		description: "Token is ordered for popular",
		example: 1
	})
	@Expose()
	highlightOrder?: number

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

	@ApiProperty({
		description: "Token creator",
		required: false,
		type: User
	})
	@Expose()
	creator?: User

	@ApiProperty({
		description: "Token tokenOwners",
		required: false,
		isArray: true,
		type: () => TokenOwner
	})
	@Expose()
	@Type(() => TokenOwner)
	tokenOwners?: TokenOwner[]

	@ApiProperty({
		description: "Token token favorite",
		required: false,
		isArray: true,
		type: () => TokenFavorite
	})
	@Expose()
	@Type(() => TokenFavorite)
	tokenFavorite?: TokenFavorite[]

	@ApiProperty({
		description: "Token charts",
		required: false,
		isArray: true,
		type: () => TokenChart
	})
	@Expose()
	@Type(() => TokenChart)
	tokenCharts?: TokenChart[]

	constructor(partial: Partial<Token>) {
		super()
		Object.assign(this, partial)
	}
}
