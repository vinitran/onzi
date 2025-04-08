import { ApiProperty } from "@nestjs/swagger"
import { Prop } from "@root/_shared/utils/decorators"
import { Expose } from "class-transformer"

export class FollowingPayload {
	@ApiProperty({
		description: "ID of the user to follow",
		example: "123e4567-e89b-12d3-a456-426614174000"
	})
	@Prop()
	followingId: string
}

export class UnfollowingPayload {
	@ApiProperty({
		description: "ID of the follow connection to remove",
		example: "123e4567-e89b-12d3-a456-426614174000"
	})
	@Prop()
	followId: string
}

export class UserConnectionResponse {
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

	constructor(partial: Partial<UserConnectionResponse>) {
		Object.assign(this, partial)
	}
}
