import { ApiProperty } from "@nestjs/swagger"
import { Expose } from "class-transformer"

export class User {
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
		example: "johndoe",
		required: false
	})
	@Expose()
	username?: string

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
		description: "URL of the user's background image",
		example: "https://example.com/background/user123.jpg"
	})
	@Expose()
	backgroundUrl: string

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

	constructor(partial: Partial<User>) {
		Object.assign(this, partial)
	}
}
