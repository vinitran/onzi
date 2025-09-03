import { ApiProperty } from "@nestjs/swagger"
import { S3Upload } from "@root/dtos/file.dto"
import { StickerOwner } from "@root/dtos/sticker-owner.dto"
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

export class GetStickersResponse extends StickerOwner {
	@ApiProperty({
		description: "Owned this ticker"
	})
	@Expose()
	isOwned: boolean

	constructor(partial: Partial<GetStickersResponse>) {
		super(partial)
		Object.assign(this, partial)
	}
}

export class GetFrequentlyUsedStickersResponse extends StickerOwner {}

export class CheckOwnedStickerResponse {
	@ApiProperty({
		description: "Indicates whether the sticker is owned by the user"
	})
	@Expose()
	isOwned: boolean

	constructor(partial: Partial<CheckOwnedStickerResponse>) {
		Object.assign(this, partial)
	}
}
