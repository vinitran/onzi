import { ApiProperty } from "@nestjs/swagger"
import { Expose, Type } from "class-transformer"

export class ReelAuthor {
	@ApiProperty({
		description: "Unique identifier of the user",
		example: "123e4567-e89b-12d3-a456-426614174000"
	})
	@Expose()
	id: string

	@ApiProperty({
		description: "User's display name",
		example: "johndoe",
		required: false
	})
	@Expose()
	username?: string

	@ApiProperty({
		description: "URL of the user's avatar image",
		example: "https://example.com/avatars/user123.jpg"
	})
	@Expose()
	avatarUrl: string
}

export class ReelComment {
	@ApiProperty({ description: "Unique identifier for the comment" })
	@Expose()
	id: string

	@ApiProperty({ description: "Content of the comment" })
	@Expose()
	content: string

	@ApiProperty({ description: "ID of the author who wrote the comment" })
	@Expose()
	authorId: string

	@ApiProperty({ description: "ID of the reel this comment belongs to" })
	@Expose()
	reelId: string

	@ApiProperty({
		required: false,
		nullable: true,
		description: "ID of the parent comment if this is a reply"
	})
	@Expose()
	parentId?: string

	@ApiProperty({
		description: "Timestamp when the comment was created",
		example: "2024-06-01T12:34:56.789Z"
	})
	@Expose()
	createdAt: Date

	@ApiProperty({
		description:
			"The author of the reel comment. Contains information about the user who posted the comment.",
		type: () => ReelAuthor
	})
	@ApiProperty()
	@Expose()
	@Type(() => ReelAuthor)
	author: ReelAuthor

	constructor(partial: Partial<ReelComment>) {
		Object.assign(this, partial)
	}
}

export class ReelCommentItem extends ReelComment {
	@ApiProperty({
		description: "Total number of likes for this comment",
		example: 42
	})
	@Expose()
	totalLike: number

	@ApiProperty({
		description: "Total number of dislikes for this comment",
		example: 3
	})
	@Expose()
	totalDislike: number

	@ApiProperty({
		description: "Total number of replies to this comment",
		example: 5
	})
	@Expose()
	totalReply: number

	@ApiProperty({
		description: "Indicates if the current user has liked this comment",
		example: true
	})
	@Expose()
	isUserLiked: boolean

	@ApiProperty({
		description: "Indicates if the current user has disliked this comment",
		example: false
	})
	@Expose()
	isUserDisLiked: boolean

	@ApiProperty({
		description: "Indicates if the user is the creator token",
		example: false
	})
	@Expose()
	isCreatorToken: boolean
}
