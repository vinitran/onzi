import { ApiProperty } from "@nestjs/swagger"
import { IsBool, OptionalProp, Prop } from "@root/_shared/utils/decorators"
import { IsString } from "class-validator"

export class CreateCommentDto {
	@ApiProperty({
		description: "Content of the comment",
		example: "This is a great token!"
	})
	@Prop()
	@IsString()
	content: string

	@ApiProperty({
		description: "Whether the comment contains an attachment",
		example: false,
		required: false,
		default: false
	})
	@OptionalProp({ default: false })
	@IsBool
	isContainAttachment: boolean
}
