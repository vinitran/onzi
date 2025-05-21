import { ApiProperty, PickType } from "@nestjs/swagger"
import { Paginate } from "@root/dtos/common.dto"
import { S3Upload } from "@root/dtos/file.dto"
import { ReelReport } from "@root/dtos/reel-report.dto"
import { Reel } from "@root/dtos/reel.dto"
import { Token } from "@root/dtos/token.dto"
import { User } from "@root/dtos/user.dto"
import { Expose, Type } from "class-transformer"

export class CreateReelResponse {
	@ApiProperty({
		description: "Reel created"
	})
	@Expose()
	reel: Reel

	@ApiProperty({
		description: "Presigned URL data for attachment upload"
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

export class ReportedReelCreator extends PickType(User, [
	"id",
	"username",
	"avatarUrl"
]) {}

class ReelReporter extends ReportedReelCreator {}

export class ReelReportDetail extends ReelReport {
	@ApiProperty({ description: "Data of reporter" })
	@Expose()
	@Type(() => ReelReporter)
	reporter: ReelReporter
}

export class ReportedReel extends Reel {
	@ApiProperty({ description: "Data of creator" })
	@Expose()
	@Type(() => ReportedReelCreator)
	creator: ReportedReelCreator

	@ApiProperty({ description: "List reel report", isArray: true })
	@Expose()
	@Type(() => ReelReportDetail)
	reelReports: ReelReportDetail
}

export class PaginateReelReportsResponse extends Paginate<ReelReportDetail> {
	@ApiProperty({ type: [ReelReportDetail] })
	@Type(() => ReelReportDetail)
	@Expose()
	data: ReelReportDetail[]
}

export class PaginateReportedReelResponse extends Paginate<ReportedReel> {
	@ApiProperty({ type: [ReportedReel] })
	@Type(() => ReportedReel)
	@Expose()
	data: ReportedReel[]
}

export class UpdateReelUserActionResponse {
	@ApiProperty({
		description: "Message"
	})
	@Expose()
	message: string
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
		description: "ID of the previous reel, if available",
		nullable: true
	})
	@Expose()
	prevReelId?: string

	@ApiProperty({
		description: "ID of the next reel, if available",
		nullable: true
	})
	@Expose()
	nextReelId?: string

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

export class TogglePinReelResponse {
	@ApiProperty({
		description: "Message"
	})
	@Expose()
	message: string
}
