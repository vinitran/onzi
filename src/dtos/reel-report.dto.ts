import { ApiProperty } from "@nestjs/swagger"
import { Expose } from "class-transformer"

export class ReelReport {
	@ApiProperty({
		type: String,
		example: "b3c1e2f4-5678-4a9b-8c2d-123456789abc"
	})
	@Expose()
	id: string

	@ApiProperty({
		type: String,
		example: "a1b2c3d4-5678-4e9f-8a2b-123456789def"
	})
	@Expose()
	reelId: string

	@ApiProperty({
		type: String,
		example: "d4c3b2a1-8765-4f9e-8b2a-abcdef123456"
	})
	@Expose()
	reporterId: string

	@ApiProperty({
		type: String,
		example: "This reel contains inappropriate content."
	})
	@Expose()
	description: string

	@ApiProperty({ type: String, example: "2024-06-01T12:34:56.789Z" })
	@Expose()
	createdAt: Date
}
