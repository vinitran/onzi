import { ApiProperty } from "@nestjs/swagger"
import { S3Upload } from "@root/dtos/file.dto"
import { TokenFavorite } from "@root/dtos/token-favorite.dto"
import { TokenTransaction } from "@root/dtos/token-transaction.dto"
import { Token as TokenDto } from "@root/dtos/token.dto"
import { User } from "@root/dtos/user.dto"
import { Expose, Type } from "class-transformer"

export class CreateTokenResponse {
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

export class TokenPriceChangeResponse {
	@ApiProperty({
		description: "Price change in last 1 hour",
		example: 5.25,
		required: false,
		default: 0
	})
	@Expose()
	"1h" = 0

	@ApiProperty({
		description: "Price change in last 24 hours",
		example: -2.5,
		required: false,
		default: 0
	})
	@Expose()
	"24h" = 0

	@ApiProperty({
		description: "Price change in last 7 days",
		example: 10.75,
		required: false,
		default: 0
	})
	@Expose()
	"7d" = 0
}

export class FindTokenResponse extends TokenDto {
	@ApiProperty({
		description: "Amount of transaction",
		required: false,
		default: 0
	})
	@Expose()
	amountTx?: number = 0

	@ApiProperty({
		description: "Price change of token",
		required: false,
		type: TokenPriceChangeResponse
	})
	@Expose()
	@Type(() => TokenPriceChangeResponse)
	priceChange?: TokenPriceChangeResponse

	@ApiProperty({
		description: "Amount Holder of token",
		required: false
	})
	@Expose()
	amountHolders?: number
}

export class TokenHolderResponse extends User {
	@ApiProperty({
		description: "Percentage of total supply held by this holder",
		type: "string"
	})
	@Expose()
	percentOfKeeper: string
}

export class ToggleFavoriteTokenResponse {
	@ApiProperty({ type: "string", description: "Message" })
	@Expose()
	message: string
}

export class FindFavoriteTokenResponse extends TokenFavorite {}
