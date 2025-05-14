import { ApiProperty } from "@nestjs/swagger"
import { Prop } from "@root/_shared/utils/decorators"
import { PaginatedParams } from "@root/dtos/common.dto"
import { IsString, Length } from "class-validator"

export class CreateReelPayload {
	@ApiProperty({
		description: "Content of the comment",
		example: "This is a great reel!"
	})
	@Prop()
	@IsString()
	@Length(1, 500)
	caption: string
}

export class PaginateListReelParams extends PaginatedParams {}
