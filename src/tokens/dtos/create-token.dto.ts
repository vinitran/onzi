import { ApiProperty } from "@nestjs/swagger"
import { Prop } from "@root/_shared/utils/decorators"
import { IsString, Length } from "class-validator"

export class CreateTokenDto {
	@ApiProperty({
		description: "Name of the token",
		example: "My Token",
		minLength: 3,
		maxLength: 80
	})
	@Prop()
	@IsString()
	@Length(3, 80)
	name: string

	@ApiProperty({
		description: "Ticker symbol of the token",
		example: "MTK"
	})
	@Prop()
	@IsString()
	ticker: string

	@ApiProperty({
		description: "Description of the token",
		example: "A token for my awesome project"
	})
	@Prop()
	@IsString()
	description: string
}
