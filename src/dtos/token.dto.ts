import { ApiProperty } from "@nestjs/swagger"
import { User } from "@root/dtos/user.dto"
import { Expose } from "class-transformer"

export class Token {
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

	@ApiProperty({
		description: "Token price",
		example: 1.25
	})
	@Expose()
	price?: number

	@ApiProperty({
		description: "Token image URI",
		example: "https://example.com/tokens/ponz.jpg"
	})
	@Expose()
	uri: string

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
	bondingCurveTarget: number

	@ApiProperty({
		description: "Has completed bonding curve?",
		example: true
	})
	@Expose()
	isCompletedBondingCurve: boolean

	@ApiProperty({
		description: "Timestamp of bonding curve completion",
		example: "2024-03-20T12:00:00Z"
	})
	@Expose()
	createdAtBondingCurve?: Date

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
	createdAtKingOfHill?: Date

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
	marketCapacity: number

	@ApiProperty({
		description: "Token bump timestamp",
		example: "2024-03-22T09:45:00Z"
	})
	@Expose()
	bumpAt?: Date

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

	constructor(partial: Partial<Token>) {
		Object.assign(this, partial)
	}
}
