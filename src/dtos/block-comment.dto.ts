import { ApiProperty } from "@nestjs/swagger"
import { Expose } from "class-transformer"
import { Token } from "./token.dto"
import { User } from "./user.dto"

export class BlockComment {
	@ApiProperty({
		description: "ID of user",
		example: "123e4567-e89b-12d3-a456-426614174000"
	})
	@Expose()
	userId: string

	@ApiProperty({
		description: "ID of token",
		example: "123e4567-e89b-12d3-a456-426614174001"
	})
	@Expose()
	tokenId: string

	@ApiProperty({
		description: "Timestamp when the user was blocked",
		example: "2023-01-01T00:00:00.000Z"
	})
	@Expose()
	createdAt: string

	@ApiProperty({
		description: "Details of the user who made the comment",
		type: User
	})
	@Expose()
	user: Partial<User>

	@ApiProperty({
		description: "Details of the token associated with the comment",
		type: Token
	})
	@Expose()
	token: Partial<Token>

	constructor(partial: Partial<BlockComment>) {
		Object.assign(this, partial)
	}
}
