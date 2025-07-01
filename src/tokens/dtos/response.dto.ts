import { ApiProperty, PickType } from "@nestjs/swagger"
import { Paginate } from "@root/dtos/common.dto"
import { S3Upload } from "@root/dtos/file.dto"
import { TokenChart } from "@root/dtos/token-chart.dto"
import { TokenFavorite } from "@root/dtos/token-favorite.dto"
import { TokenTransactionDistribute } from "@root/dtos/token-transaction-distribute.dto"
import { TokenTransaction } from "@root/dtos/token-transaction.dto"
import { Token, Token as TokenDto } from "@root/dtos/token.dto"
import { User } from "@root/dtos/user.dto"
import { Expose, Transform, Type } from "class-transformer"
import { IsArray } from "class-validator"

export class CreateTokenInCacheResponse {
	@ApiProperty({ description: "Token information", type: TokenDto })
	@Expose()
	token: TokenDto

	@ApiProperty({
		description: "Attachment presigned post",
		type: S3Upload,
		required: false
	})
	@Expose()
	attachment?: S3Upload
}

export class CreateTokenOffchainResponse extends TokenDto {}

export class CreateTokenOnchainResponse {
	@ApiProperty({
		description: "Transaction signature for creating and buying token"
	})
	@Expose()
	transaction: string
}

export class SimilarTokenResponse extends TokenDto {
	@ApiProperty({
		description: "Total number of replies for the token",
		example: 5
	})
	@Expose()
	totalReplies: number
}

export class ListTransactionResponse extends TokenTransaction {}

class FindTokenCount {
	@ApiProperty({
		description: "Amount Holder of token",
		required: false
	})
	@Expose()
	amountHolders?: number

	@ApiProperty({
		description: "Amount of transaction",
		required: false,
		default: 0
	})
	@Expose()
	amountTx?: number = 0
}

export class FindTokenResponse extends TokenDto {
	@ApiProperty({
		description: "Count information",
		required: false
	})
	@Expose()
	_count: FindTokenCount
	@ApiProperty({
		description: "Token balance user",
		example: 1000000000
	})
	@Expose()
	@Type(() => Number)
	balance?: number
}

export class PaginateTokenResponse extends Paginate<FindTokenResponse> {
	@ApiProperty({ type: [FindTokenResponse] })
	@Type(() => FindTokenResponse)
	@Transform(({ value }) => value)
	@Expose()
	data: FindTokenResponse[]
}

class SickoModeCountResponse {
	@ApiProperty({
		description: "Token transaction",
		required: false
	})
	@Expose()
	tokenTransaction: number

	@ApiProperty({
		description: "Token Owners",
		required: false
	})
	@Expose()
	tokenOwners: number
}

export class SickoModeResponse extends TokenDto {
	@ApiProperty({
		description: "Count information",
		required: false
	})
	@Expose()
	_count: SickoModeCountResponse

	@ApiProperty({
		description: "Top10 Holders Percentage",
		required: false
	})
	@Expose()
	top10HoldersPercentage: number

	@ApiProperty({
		description: "Dev Hold Percentage",
		required: false
	})
	@Expose()
	devHoldPersent: number
}

export class PaginateSickoModeResponse extends Paginate<SickoModeResponse> {
	@ApiProperty({ type: [SickoModeResponse] })
	@Type(() => SickoModeResponse)
	@Transform(({ value }) => value)
	@Expose()
	data: SickoModeResponse[]
}

export class TokenHolderResponse extends TokenDto {}

export class ToggleFavoriteTokenResponse {
	@ApiProperty({ type: "string", description: "Message" })
	@Expose()
	message: string
}

export class FindFavoriteTokenResponse extends TokenFavorite {}
export class PaginateFavoriteTokenResponse extends Paginate<FindFavoriteTokenResponse> {
	@ApiProperty({ type: [FindFavoriteTokenResponse] })
	@Type(() => FindFavoriteTokenResponse)
	@Transform(({ value }) => value)
	@Expose()
	data: FindFavoriteTokenResponse[]
}

export class TrendingTopicResponse {
	@ApiProperty({ type: "string", description: "Data", isArray: true })
	@Expose()
	@IsArray()
	data: string[]
}

class ChartData extends TokenChart {}

export class ChartResponse {
	@ApiProperty({ type: ChartData, description: "Data", isArray: true })
	@Expose()
	@IsArray()
	@Type(() => ChartData)
	data: ChartData[]
}

export class FindSimilarTokenResponse extends TokenDto {}

export class UpdateBannerResponse extends S3Upload {}

export class GetSummaryTokensResponse extends PickType(Token, [
	"id",
	"address",
	"headline",
	"description",
	"highlightOrder",
	"address",
	"imageUri",
	"name",
	"ticker",
	"marketCapacity",
	"isCompletedKingOfHill",
	"raydiumStatus",
	"price",
	"totalSupply"
]) {
	@Expose()
	@ApiProperty({ description: "Total replies" })
	totalComment: number
}

class TransactionDistributeUser extends PickType(User, [
	"id",
	"address",
	"username",
	"avatarUrl"
]) {}

export class TransactionDistributeItem extends TokenTransactionDistribute {
	@ApiProperty({ description: "Data user from", nullable: true })
	@Expose()
	userFrom?: TransactionDistributeUser
	@ApiProperty({ description: "Data user to", nullable: true })
	@Expose()
	userTo?: TransactionDistributeUser
}

export class PaginateTransactionDistributeResponse extends Paginate<TransactionDistributeItem> {
	@ApiProperty({ type: [TransactionDistributeItem] })
	@Type(() => TransactionDistributeItem)
	@Expose()
	data: TransactionDistributeItem[]
}
