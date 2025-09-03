import { ApiProperty } from "@nestjs/swagger"
import { Expose, Type } from "class-transformer"

export class ReelCommentReporter {
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

export class ReelCommentReport {
	@ApiProperty({
		description: "Unique identifier for the reel comment report",
		example: "a3f1c2d4-5678-4e9b-8c2d-123456789abc"
	})
	@Expose()
	id: string

	@ApiProperty({
		description: "ID of the reported reel comment",
		example: "b2e1d3c4-1234-4f5a-9b8c-987654321def"
	})
	@Expose()
	reelCommentId: string

	@ApiProperty({
		description: "ID of the user who reported the comment",
		example: "c1d2e3f4-4321-4a5b-8c9d-abcdef123456"
	})
	@Expose()
	reporterId: string

	@ApiProperty({
		description: "Description of the report",
		example: "This comment contains inappropriate language."
	})
	@Expose()
	description: string

	@ApiProperty({
		description: "Date and time when the report was created",
		example: "2024-06-01T12:34:56.789Z"
	})
	@Expose()
	createdAt: Date
}

export class ReelCommentReportItem extends ReelCommentReport {
	@ApiProperty({ type: ReelCommentReporter })
	@Type(() => ReelCommentReporter)
	@Expose()
	reporter: ReelCommentReporter
}
