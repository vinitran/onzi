import { ApiProperty } from "@nestjs/swagger"
import { Expose } from "class-transformer"

export class Sticker {
	@ApiProperty({
		description: "Unique identifier of the sticker",
		example: "123e4567-e89b-12d3-a456-426614174000"
	})
	@Expose()
	id: string

	@ApiProperty({
		description: "Owner id",
		example: "123e4567-e89b-12d3-a456-426614174999"
	})
	@Expose()
	creatorAddress: string

	@ApiProperty({
		description: "Uri of sticker",
		example: "https://example.com/attachments/sticker123.jpg"
	})
	@Expose()
	uri: string

	@ApiProperty({
		description: "Timestamp when the sticker was created",
		example: "2024-03-20T12:00:00Z"
	})
	@Expose()
	createdAt: string

	constructor(partial: Partial<Sticker>) {
		Object.assign(this, partial)
	}
}
