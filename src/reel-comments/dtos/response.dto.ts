import { ApiProperty } from "@nestjs/swagger"
import { Paginate } from "@root/dtos/common.dto"
import { ReelCommentReportItem } from "@root/dtos/reel-comment-report.dto"
import { ReelComment, ReelCommentItem } from "@root/dtos/reel-comment.dto"
import {
	ReportedReelCreator,
	UpdateReelUserActionResponse
} from "@root/reels/dtos/response.dto"
import { Expose, Type } from "class-transformer"

class ReelCommentReporter extends ReportedReelCreator {}
export class UpdateReelCommentActionResponse extends UpdateReelUserActionResponse {}

export class PaginateReelCommentResponse extends Paginate<ReelCommentItem> {
	@ApiProperty({ type: [ReelCommentItem] })
	@Type(() => ReelCommentItem)
	@Expose()
	data: ReelCommentItem[]
}

export class ReportedReelComment extends ReelComment {
	@ApiProperty({ type: ReelCommentReportItem, isArray: true })
	@Expose()
	@Type(() => ReelCommentReportItem)
	reelCommentReports: ReelCommentReportItem[]

	@ApiProperty({ type: ReelCommentReporter })
	@Expose()
	@Type(() => ReelCommentReporter)
	author: ReelCommentReporter
}

export class PaginateReportedReelCommentResponse extends Paginate<ReportedReelComment> {
	@ApiProperty({ type: [ReportedReelComment] })
	@Type(() => ReportedReelComment)
	@Expose()
	data: ReportedReelComment[]
}
