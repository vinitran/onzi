import { ApiProperty } from "@nestjs/swagger"
import { Prop } from "@root/_shared/utils/decorators"
import { ContentType } from "@root/tokens/dtos/payload.dto"
import { IsEnum } from "class-validator"

export class CreateStickerPayload {
	@ApiProperty({
		description: "Content type of the token",
		example: ContentType.PNG,
		enum: ContentType,
		required: false
	})
	@Prop()
	@IsEnum(ContentType)
	contentType: ContentType
}
