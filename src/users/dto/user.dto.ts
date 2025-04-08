import { ApiProperty } from "@nestjs/swagger"
import { Prop } from "@root/_shared/utils/decorators"
import { PaginatedParams } from "@root/_shared/utils/parsers"
import { Expose } from "class-transformer"
import { IsNotEmpty, IsOptional, IsUrl, MaxLength } from "class-validator"

export class UserResponse {
	@ApiProperty({
		description: "Unique identifier of the user",
		example: "123e4567-e89b-12d3-a456-426614174000"
	})
	@Expose()
	id: string

	@ApiProperty({
		description: "User's wallet address",
		example: "ES69bn51QABsJ5G5Kp2LZW524MCSdxhP1a7dHB84nQ12"
	})
	@Expose()
	address: string

	@ApiProperty({
		description: "User's display name",
		example: "johndoe"
	})
	@Expose()
	username: string

	@ApiProperty({
		description: "User's biography",
		example: "Crypto enthusiast and blockchain developer"
	})
	@Expose()
	bio: string

	@ApiProperty({
		description: "URL of the user's avatar image",
		example: "https://example.com/avatars/user123.jpg"
	})
	@Expose()
	avatarUrl: string

	@ApiProperty({
		description: "User's network",
		example: "mainnet"
	})
	@Expose()
	network: string

	@ApiProperty({
		description: "User's premium status",
		example: "premium"
	})
	@Expose()
	premium: string

	@ApiProperty({
		description: "Timestamp when the user was created",
		example: "2024-03-20T12:00:00Z"
	})
	@Expose()
	createdAt: string

	@ApiProperty({
		description: "Timestamp when the user was last updated",
		example: "2024-03-21T15:30:00Z"
	})
	@Expose()
	updatedAt: string

	constructor(partial: Partial<UserResponse>) {
		Object.assign(this, partial)
	}
}

export class TokenResponse {
	@ApiProperty({
		description: "Unique identifier of the token",
		example: "123e4567-e89b-12d3-a456-426614174000"
	})
	@Expose()
	id: string

	@ApiProperty({
		description: "Token's address",
		example: "ES69bn51QABsJ5G5Kp2LZW524MCSdxhP1a7dHB84nQ12"
	})
	@Expose()
	address: string

	@ApiProperty({
		description: "Token's name",
		example: "My Token"
	})
	@Expose()
	name: string

	@ApiProperty({
		description: "Token's symbol",
		example: "MTK"
	})
	@Expose()
	symbol: string

	@ApiProperty({
		description: "Token's URI",
		example: "https://example.com/tokens/mytoken"
	})
	@Expose()
	uri: string

	@ApiProperty({
		description: "Token's ticker",
		example: "MTK",
		required: false
	})
	@Expose()
	ticker?: string

	@ApiProperty({
		description: "Token's metadata",
		example: '{"description": "My awesome token"}'
	})
	@Expose()
	metadata: string

	@ApiProperty({
		description: "Token's network",
		example: "mainnet"
	})
	@Expose()
	network: string

	@ApiProperty({
		description: "Whether the token has completed bonding curve",
		example: true
	})
	@Expose()
	isCompletedBondingCurve: boolean

	@ApiProperty({
		description: "Timestamp when the token completed bonding curve",
		example: "2024-03-20T12:00:00Z",
		required: false
	})
	@Expose()
	createdAtBondingCurve?: string

	@ApiProperty({
		description: "Whether the token is bumped",
		example: true,
		required: false
	})
	@Expose()
	bump?: boolean

	@ApiProperty({
		description: "Token's market capacity",
		example: 1000000,
		required: false
	})
	@Expose()
	marketCapacity?: number

	@ApiProperty({
		description: "Timestamp when the token was created",
		example: "2024-03-20T12:00:00Z"
	})
	@Expose()
	createdAt: string

	@ApiProperty({
		description: "Timestamp when the token was last updated",
		example: "2024-03-21T15:30:00Z",
		required: false
	})
	@Expose()
	updatedAt?: string

	constructor(partial: Partial<TokenResponse>) {
		Object.assign(this, partial)
	}
}

export class AvatarPresignedUrlResponse {
	@ApiProperty({
		description: "Presigned URL for uploading avatar",
		example: "https://example.com/upload?key=avatar-123"
	})
	@Expose()
	url: string

	@ApiProperty({
		description: "Required fields for the upload",
		example: '{"key": "avatar-123"}'
	})
	@Expose()
	fields: string

	constructor(partial: Partial<AvatarPresignedUrlResponse>) {
		Object.assign(this, partial)
	}
}

export class CommentResponse {
	@ApiProperty({
		description: "Unique identifier of the comment",
		example: "123e4567-e89b-12d3-a456-426614174000"
	})
	@Expose()
	id: string

	@ApiProperty({
		description: "Content of the comment",
		example: "This is a great token!"
	})
	@Expose()
	content: string

	@ApiProperty({
		description: "URL of the comment's attachment",
		example: "https://example.com/attachments/comment123.jpg",
		required: false
	})
	@Expose()
	attachmentUrl?: string

	@ApiProperty({
		description: "ID of the comment's author",
		example: "123e4567-e89b-12d3-a456-426614174000"
	})
	@Expose()
	authorId: string

	@ApiProperty({
		description: "ID of the token the comment is about",
		example: "123e4567-e89b-12d3-a456-426614174000"
	})
	@Expose()
	tokenId: string

	@ApiProperty({
		description: "ID of the parent comment if this is a reply",
		example: "123e4567-e89b-12d3-a456-426614174000",
		required: false
	})
	@Expose()
	parentId?: string

	@ApiProperty({
		description: "Timestamp when the comment was created",
		example: "2024-03-20T12:00:00Z"
	})
	@Expose()
	createdAt: string

	@ApiProperty({
		description: "Timestamp when the comment was last updated",
		example: "2024-03-21T15:30:00Z",
		required: false
	})
	@Expose()
	updatedAt?: string

	constructor(partial: Partial<CommentResponse>) {
		Object.assign(this, partial)
	}
}

export class SetInformationPayload {
	@ApiProperty({
		description: "New username for the user",
		example: "johndoe",
		required: false,
		maxLength: 20
	})
	@Prop({ required: false })
	@IsOptional()
	@MaxLength(20, { message: "Maximum length allowed is 20 characters." })
	username?: string

	@ApiProperty({
		description: "New biography for the user",
		example: "Crypto enthusiast and blockchain developer",
		required: false,
		maxLength: 50
	})
	@Prop({ required: false })
	@IsOptional()
	@MaxLength(50, { message: "Maximum length allowed is 20 characters." })
	bio?: string
}

export class SetAvatarPayload {
	@ApiProperty({
		description: "URL of the new avatar image",
		example: "https://example.com/avatars/new-avatar.jpg"
	})
	@Prop()
	@IsNotEmpty({ message: "Avatar url must not be empty" })
	@IsUrl({}, { message: "Avatar URL must be a valid URL" })
	avatarUrl: string
}

export class CoinHeldsResponse {
	@ApiProperty({
		description: "Address of the coin holder",
		example: "ES69bn51QABsJ5G5Kp2LZW524MCSdxhP1a7dHB84nQ12"
	})
	@Expose()
	address: string

	@ApiProperty({
		description: "Mint address of the coin",
		example: "ES69bn51QABsJ5G5Kp2LZW524MCSdxhP1a7dHB84nQ12"
	})
	@Expose()
	mint: string

	@ApiProperty({
		description: "Address of the coin owner",
		example: "ES69bn51QABsJ5G5Kp2LZW524MCSdxhP1a7dHB84nQ12"
	})
	@Expose()
	owner: string

	@ApiProperty({
		description: "Amount of coins held",
		example: 1000
	})
	@Expose()
	amount: number

	@ApiProperty({
		description: "Amount of coins delegated",
		example: 500
	})
	@Expose()
	delegated_amount: number

	@ApiProperty({
		description: "Whether the coins are frozen",
		example: false
	})
	@Expose()
	frozen: boolean
}

export class GetCoinCreatedParams extends PaginatedParams {
	@ApiProperty({
		description: "Address of the token creator",
		example: "ES69bn51QABsJ5G5Kp2LZW524MCSdxhP1a7dHB84nQ12"
	})
	@Prop()
	creatorAddress: string
}
