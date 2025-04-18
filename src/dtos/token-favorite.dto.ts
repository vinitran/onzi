import { ApiProperty } from "@nestjs/swagger"
import { Expose } from "class-transformer"
import { Token } from "./token.dto"
import { User } from "./user.dto"

export class TokenFavorite {
	@ApiProperty({
		description: "Token address that is favorited",
		example: "ES69bn51QABsJ5G5Kp2LZW524MCSdxhP1a7dHB84nQ12"
	})
	@Expose()
	tokenAddress: string

	@ApiProperty({
		description: "User address who favorited the token",
		example: "ES69bn51QABsJ5G5Kp2LZW524MCSdxhP1a7dHB84nQ12"
	})
	@Expose()
	userAddress: string

	@ApiProperty({
		description: "Token details",
		type: () => Token
	})
	@Expose()
	token: Token

	@ApiProperty({
		description: "User details",
		type: () => User
	})
	@Expose()
	user: User

	@ApiProperty({
		description: "Favorite creation timestamp",
		example: "2024-03-19T10:15:00Z"
	})
	@Expose()
	createdAt: Date

	constructor(partial: Partial<TokenFavorite>) {
		Object.assign(this, partial)
	}
}
