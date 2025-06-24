import { ApiProperty } from "@nestjs/swagger"
import { OptionalProp, Prop } from "@root/_shared/utils/decorators"
import { IsString, Length } from "class-validator"

export class FeedbackCreatePayload {
	@ApiProperty({
		description: "Content feedback",
		example: "I had an error in home page"
	})
	@IsString()
	@Prop()
	@Length(5, 500)
	content: string

	@ApiProperty({
		description: "Twitter username",
		example: "ponz"
	})
	@OptionalProp()
	@IsString()
	twitterUsername?: string
}
