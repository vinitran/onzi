import { ApiProperty } from "@nestjs/swagger"
import { S3Upload } from "@root/dtos/file.dto"
import { Sticker } from "@root/dtos/sticker.dto"
import { Expose } from "class-transformer"

export class CreateStickerResponse {
	@ApiProperty({
		description: "The created sticker",
		type: Sticker
	})
	@Expose()
	sticker: Sticker

	@ApiProperty({
		description: "Presigned URL data for attachment upload"
	})
	@Expose()
	attachment: S3Upload
}
