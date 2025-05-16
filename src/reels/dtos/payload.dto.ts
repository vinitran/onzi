import { ApiProperty } from "@nestjs/swagger"
import { UserActionStatus } from "@prisma/client"
import { OptionalProp, Prop } from "@root/_shared/utils/decorators"
import { PaginatedParams } from "@root/dtos/common.dto"
import { IsEnum, IsString, IsUUID, Length } from "class-validator"

export class CreateReelDto {
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

export class UpdateReelUserActionDto {
	@ApiProperty({
		description: "Option",
		enum: UserActionStatus,
		example: UserActionStatus.Like
	})
	@Prop()
	@IsEnum(UserActionStatus)
	action: UserActionStatus
}

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

export class UpdateReelCommentActionDto extends UpdateReelUserActionDto {}

export class PaginateReelCommentDto extends PaginatedParams {}
export class PaginateReelCommenReplytDto extends PaginateReelCommentDto {}

export class CreateReelCommentReportDto {
	@ApiProperty({
		description: "Reason to report",
		example: "Violent or repulsive content"
	})
	@Prop()
	@IsString()
	description: string
}
