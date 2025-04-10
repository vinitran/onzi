import { ApiProperty } from "@nestjs/swagger"
import { Expose } from "class-transformer"

export class UserConnection {
	@ApiProperty({
		description: "Unique identifier of the connection",
		example: "123e4567-e89b-12d3-a456-426614174000"
	})
	@Expose()
	id: string

	@ApiProperty({
		description: "ID of the user being followed",
		example: "123e4567-e89b-12d3-a456-426614174000"
	})
	@Expose()
	followingId: string

	@ApiProperty({
		description: "ID of the user who is following",
		example: "123e4567-e89b-12d3-a456-426614174000"
	})
	@Expose()
	followerId: string

	@ApiProperty({
		description: "Timestamp when the connection was created",
		example: "2024-03-20T12:00:00Z"
	})
	@Expose()
	createdAt: string

	@ApiProperty({
		description: "Timestamp when the connection was last updated",
		example: "2024-03-21T15:30:00Z"
	})
	@Expose()
	updatedAt: string

	constructor(partial: Partial<UserConnection>) {
		Object.assign(this, partial)
	}
}
