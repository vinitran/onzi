import { ApiProperty } from "@nestjs/swagger"
import { BlockComment } from "@root/dtos/block-comment.dto"
import { Comment } from "@root/dtos/comment.dto"
import { S3Upload } from "@root/dtos/file.dto"
import { Expose, Type } from "class-transformer"

export class CreateCommentResponse {
	@ApiProperty({
		description: "The created comment",
		type: Comment
	})
	@Expose()
	comment: Comment

	@ApiProperty({
		description: "Presigned URL data for attachment upload",
		required: false
	})
	@Expose()
	attachment?: S3Upload
}

export class ToggleLikeResponse {
	@ApiProperty({
		description: "Whether the comment is now liked by the user",
		example: true
	})
	@Expose()
	isLiked: boolean

	@ApiProperty({
		description: "Updated total number of likes",
		example: 6
	})
	@Expose()
	totalLike: number
}

class BlockedUser {
	@Expose()
	id: string

	@Expose()
	username: string

	@Expose()
	address: string

	@Expose()
	avatarUrl: string
}

export class GetBlockedUserCommentResponse extends BlockComment {
	@Expose()
	@Type(() => BlockedUser)
	user: BlockedUser
}
