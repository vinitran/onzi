import { ApiProperty } from "@nestjs/swagger"
import { S3Upload } from "@root/dtos/file.dto"
import { User } from "@root/dtos/user.dto"
import { Expose } from "class-transformer"

export class Comment {
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

	@ApiProperty({
		type: () => Comment,
		isArray: true,
		required: false,
		example: []
	})
	@Expose()
	replies?: Comment[]

	@ApiProperty({
		type: User
	})
	@Expose()
	author: User

	@ApiProperty({
		description: "Presigned URL data for attachment upload",
		required: false
	})
	@Expose()
	attachment?: S3Upload

	constructor(partial: Partial<Comment>) {
		Object.assign(this, partial)
	}
}
