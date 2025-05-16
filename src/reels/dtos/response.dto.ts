import { ApiProperty, PickType } from "@nestjs/swagger"
import { Paginate } from "@root/dtos/common.dto"
import { S3Upload } from "@root/dtos/file.dto"
import { ReelCommentItem } from "@root/dtos/reel-comment.dto"
import { Reel } from "@root/dtos/reel.dto"
import { Token } from "@root/dtos/token.dto"
import { Expose, Type } from "class-transformer"

export class CreateReelResponse {
	@ApiProperty({
		description: "Reel created"
	})
	@Expose()
	reel: Reel

	@ApiProperty({
		description: "Presigned URL data for attachment upload",
		required: false
	})
	@Expose()
	attachment: S3Upload
}

export class PaginateReelResponse extends Paginate<Reel> {
	@ApiProperty({ type: [Reel] })
	@Type(() => Reel)
	@Expose()
	data: Reel[]
}

export class UpdateReelUserActionResponse {
	@ApiProperty({
		description: "Message"
	})
	@Expose()
	message: string
}

export class UpdateReelCommentActionResponse extends UpdateReelUserActionResponse {}

export class PaginateReelCommentResponse extends Paginate<ReelCommentItem> {
	@ApiProperty({ type: [ReelCommentItem] })
	@Type(() => ReelCommentItem)
	@Expose()
	data: ReelCommentItem[]
}

class ReelDetailUserStatus {
	@ApiProperty({
		description: "Indicates if the user liked the reel"
	})
	@Expose()
	isLikeReel: boolean

	@ApiProperty({
		description: "Indicates if the user disliked the reel"
	})
	@Expose()
	isDislikeReel: boolean

	@ApiProperty({
		description: "Indicates if the user favorited the reel"
	})
	@Expose()
	isFavoriteToken: boolean
}

class ReelDetailToken extends PickType(Token, [
	"id",
	"address",
	"name",
	"imageUri",
	"marketCapacity",
	"description"
]) {}

export class GetDetailReelResponse extends Reel {
	@ApiProperty({
		description: "Indicates if the current user has favorited this reel"
	})
	@Expose()
	isUserFavouriteToken: boolean

	@ApiProperty({
		description: "Total number of comments on the reel"
	})
	@Expose()
	totalComment: number

	@ApiProperty({
		description: "Total number of likes on the reel"
	})
	@Expose()
	totalLike: number

	@ApiProperty({
		description: "Total number of dislikes on the reel"
	})
	@Expose()
	totalDislike: number

	@ApiProperty({
		description: "Token on the reel"
	})
	@Expose()
	@Type(() => ReelDetailToken)
	token: ReelDetailToken

	@ApiProperty({
		description: "User status on the reel"
	})
	@Expose()
	@Type(() => ReelDetailUserStatus)
	userStatus: ReelDetailUserStatus
}
