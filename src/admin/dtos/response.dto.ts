import { ApiProperty, OmitType, PickType } from "@nestjs/swagger"
import { Paginate } from "@root/dtos/common.dto"
import { Token } from "@root/dtos/token.dto"
import { Expose, Type } from "class-transformer"

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

export class ReportedToken extends OmitType(Token, [
	"tokenFavorite",
	"tokenOwners",
	"tokenCharts"
]) {
	@Expose()
	totalReport: number
}
export class PaginateReportedTokensResponse extends Paginate<ReportedToken> {
	@Type(() => ReportedToken)
	@Expose()
	@ApiProperty({
		type: [ReportedToken]
	})
	data: ReportedToken[]
}
