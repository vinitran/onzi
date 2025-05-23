import { ApiProperty, PickType } from "@nestjs/swagger"
import { Token } from "@root/dtos/token.dto"
import { Expose } from "class-transformer"

export class ToggleBlockUserChatResponse {
	@ApiProperty({
		description: "Toggle block user create chat in all platform(token, reel)",
		example: [
			"Block user CreateReelComment successfully",
			"Block user CreateTokenComment successfully"
		],
		isArray: true
	})
	@Expose()
	messages: string[]
}

export class ToggleBlockUserCreateReelResponse {
	@ApiProperty({
		description: "Toggle block user create reel in every token"
	})
	@Expose()
	message: string
}

export class UpdateTokensResponse extends PickType(Token, [
	"id",
	"headline",
	"highlightOrder",
	"address",
	"imageUri",
	"name"
]) {}

export class AdminPopularTokenResponse extends UpdateTokensResponse {}
