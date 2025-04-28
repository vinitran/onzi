import { ApiProperty } from "@nestjs/swagger"
import { Expose } from "class-transformer"
import { Sticker } from "./sticker.dto"

export class StickerOwner {
	@ApiProperty({
		description: "Owner id",
		example: "123e4567-e89b-12d3-a456-426614174999"
	})
	@Expose()
	userAddress: string

	@ApiProperty({
		description: "Uri of sticker",
		example: "https://example.com/attachments/sticker123.jpg"
	})
	@Expose()
	sticker: Sticker

	@ApiProperty({
		description: "Timestamp when the sticker was added",
		example: "2024-03-20T12:00:00Z"
	})
	@Expose()
	createdAt: string

	constructor(partial: Partial<StickerOwner>) {
		Object.assign(this, partial)
	}
}
