import { Prop } from "@root/_shared/utils/decorators"
import { IsString } from "class-validator"

export class CreateCommentDto {
	@Prop()
	@IsString()
	content: string
}
