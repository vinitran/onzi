import { ApiProperty } from "@nestjs/swagger"
import { Expose } from "class-transformer"

export class CreatorDto {
	@ApiProperty({ description: "Creator ID" })
	@Expose()
	id: string

	@ApiProperty({ description: "Creator address" })
	@Expose()
	address: string

	@ApiProperty({ description: "Creator username", nullable: true })
	@Expose()
	username: string | null
}

export class TokenDto {
	@ApiProperty({ description: "Token address" })
	@Expose()
	address: string

	@ApiProperty({ description: "Token name" })
	@Expose()
	name: string

	@ApiProperty({ description: "Token symbol" })
	@Expose()
	symbol: string

	@ApiProperty({ description: "Token creator address" })
	@Expose()
	creatorAddress: string

	@ApiProperty({ description: "Token creation timestamp" })
	@Expose()
	createdAt: Date

	@ApiProperty({ description: "Token update timestamp" })
	@Expose()
	updatedAt: Date
}

export class PresignedPostFieldsDto {
	@ApiProperty({ description: "S3 bucket name" })
	@Expose()
	bucket: string

	@ApiProperty({ description: "AWS algorithm used for signing" })
	@Expose()
	"X-Amz-Algorithm": string

	@ApiProperty({ description: "AWS credential information" })
	@Expose()
	"X-Amz-Credential": string

	@ApiProperty({ description: "AWS request date" })
	@Expose()
	"X-Amz-Date": string

	@ApiProperty({ description: "S3 object key" })
	@Expose()
	key: string

	@ApiProperty({ description: "S3 policy document" })
	@Expose()
	Policy: string

	@ApiProperty({ description: "AWS signature" })
	@Expose()
	"X-Amz-Signature": string
}

export class PresignedPostDto {
	@ApiProperty({ description: "Presigned post URL" })
	@Expose()
	url: string

	@ApiProperty({
		description: "Presigned post fields",
		type: PresignedPostFieldsDto
	})
	@Expose()
	fields: PresignedPostFieldsDto
}

export class SimilarTokenResponseDto {
	@ApiProperty({ description: "Token information", type: TokenDto })
	@Expose()
	token: TokenDto

	@ApiProperty({
		description: "Total number of replies for the token",
		example: 5
	})
	@Expose()
	totalReplies: number
}

export class CreateTokenResponseDto {
	@ApiProperty({ description: "Token information", type: TokenDto })
	@Expose()
	token: TokenDto & {
		creator: CreatorDto
	}

	@ApiProperty({
		description: "Attachment presigned post",
		type: PresignedPostDto,
		required: false
	})
	@Expose()
	attachment?: PresignedPostDto
}

export class CreateTokenTxResponseDto {
	@ApiProperty({ description: "create and buy token transaction" })
	@Expose()
	transaction: string
}

export class TokenHolderResponseDto {
	@ApiProperty({ description: "Token holder ID" })
	@Expose()
	id: string

	@ApiProperty({ description: "Creation timestamp" })
	@Expose()
	createdAt: Date

	@ApiProperty({ description: "Update timestamp", nullable: true })
	@Expose()
	updatedAt: Date | null

	@ApiProperty({ description: "Amount of tokens held", type: "string" })
	@Expose()
	amount: string

	@ApiProperty({ description: "Token address" })
	@Expose()
	tokenAddress: string

	@ApiProperty({ description: "User address" })
	@Expose()
	userAddress: string

	@ApiProperty({
		description: "Percentage of total supply held by this holder",
		type: "string"
	})
	@Expose()
	percentOfKeeper: string
}
