import { ApiProperty } from "@nestjs/swagger"
import { Comment } from "@root/dtos/comment.dto"
import { S3Upload } from "@root/dtos/file.dto"
import { Expose } from "class-transformer"

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
