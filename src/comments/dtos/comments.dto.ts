import { ApiProperty } from "@nestjs/swagger"
import { Expose } from "class-transformer"

export class AuthorResponse {
	@ApiProperty({
		description: "Unique identifier of the author",
		example: "123e4567-e89b-12d3-a456-426614174000"
	})
	@Expose()
	id: string

	@ApiProperty({
		description: "Wallet address of the author",
		example: "0x1234567890abcdef"
	})
	@Expose()
	address: string

	@ApiProperty({
		description: "Username of the author",
		example: "johndoe",
		required: false
	})
	@Expose()
	username: string | null

	@ApiProperty({
		description: "Avatar URL of the author",
		example: "https://example.com/avatar.jpg",
		required: false
	})
	@Expose()
	avatarUrl: string | null
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
	parentId: string | null

	@ApiProperty({
		description: "Whether the current user has liked this comment",
		example: false
	})
	@Expose()
	isLiked: boolean

	@ApiProperty({
		description: "Total number of likes on the comment",
		example: 5
	})
	@Expose()
	totalLike: number

	@ApiProperty({
		description: "Total number of replies to the comment",
		example: 3
	})
	@Expose()
	totalReply: number

	@ApiProperty({
		description: "Timestamp when the comment was created",
		example: "2024-03-20T12:00:00Z"
	})
	@Expose()
	createdAt: Date

	@ApiProperty({
		description: "Timestamp when the comment was last updated",
		example: "2024-03-21T15:30:00Z",
		required: false
	})
	@Expose()
	updatedAt: Date | null

	@ApiProperty({
		description: "Author information",
		type: AuthorResponse
	})
	@Expose()
	author: AuthorResponse
}

export class CreateCommentResponse {
	@ApiProperty({
		description: "The created comment",
		type: CommentResponse
	})
	@Expose()
	comment: CommentResponse

	@ApiProperty({
		description: "Presigned URL data for attachment upload",
		required: false
	})
	@Expose()
	attachment?: {
		fields: Record<string, string>
		url: string
	}
}
