import { ApiProperty } from "@nestjs/swagger"
import { OptionalProp, Prop } from "@root/_shared/utils/decorators"
import { PaginatedParams } from "@root/dtos/common.dto"
import {
	CreateReelReportDto,
	UpdateReelUserActionDto
} from "@root/reels/dtos/payload.dto"
import { IsString, IsUUID, Length } from "class-validator"

export class CreateReelCommentDto {
	@ApiProperty({
		description: "content",
		example: "Great!"
	})
	@Prop()
	@IsString()
	@Length(1, 500)
	content: string

	@ApiProperty({
		description: "Id parent comment to reply"
	})
	@OptionalProp()
	@IsUUID()
	parentId?: string
}

export class PaginateReelCommentDto extends PaginatedParams {}
export class UpdateReelCommentActionDto extends UpdateReelUserActionDto {}

export class PaginateReelCommenReplytDto extends PaginatedParams {}
export class PaginateReportedReelCommentDto extends PaginatedParams {}
export class CreateReelCommentReportDto extends CreateReelReportDto {}
