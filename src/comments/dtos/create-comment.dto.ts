import { IsBool, OptionalProp, Prop } from "@root/_shared/utils/decorators"
import { IsString } from "class-validator"

export class CreateCommentDto {
	@Prop()
	@IsString()
	content: string

	@OptionalProp({ default: false })
	@IsBool
	isContainAttachment: boolean
}
