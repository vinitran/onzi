import { Prop } from "@root/_shared/utils/decorators"
import { IsString, Length } from "class-validator"

export class CreateTokenDto {
	@Prop()
	@IsString()
	@Length(3, 80)
	name: string

	@Prop()
	@IsString()
	ticker: string

	@Prop()
	@IsString()
	description: string
}
