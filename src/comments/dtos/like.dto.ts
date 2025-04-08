import { ApiProperty } from "@nestjs/swagger"
import { Expose } from "class-transformer"

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
