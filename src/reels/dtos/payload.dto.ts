import { ApiProperty } from "@nestjs/swagger"
import { UserActionStatus } from "@prisma/client"
import { REPORTED_REEL_SORT_OPTIONS } from "@root/_shared/constants/reel"
import { OptionalProp, Prop } from "@root/_shared/utils/decorators"
import { PaginatedParams } from "@root/dtos/common.dto"
import { Transform } from "class-transformer"
import {
	IsArray,
	IsBoolean,
	IsEnum,
	IsOptional,
	IsString,
	Length
} from "class-validator"

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

export class UpdateReelCommentActionDto extends UpdateReelUserActionDto {}

export class PaginateReelCommenReplytDto extends PaginatedParams {}

export class CreateReelReportDto {
	@ApiProperty({
		description: "Reason to report",
		example: "Violent or repulsive content"
	})
	@Prop()
	@IsString()
	description: string
}

export class PaginateReportedReelDto extends PaginatedParams {
	@ApiProperty({ description: "Text to search reel" })
	@IsString()
	@OptionalProp()
	text: string

	@ApiProperty({
		description: "Sort options",
		enum: REPORTED_REEL_SORT_OPTIONS
	})
	@IsEnum(REPORTED_REEL_SORT_OPTIONS)
	@OptionalProp()
	sortBy: REPORTED_REEL_SORT_OPTIONS
}

export class PaginateReelReportsDto extends PaginatedParams {}

export class GetReelDetailDto {
	@ApiProperty({
		description: "Status of users watching reels",
		required: false
	})
	@IsBoolean()
	@OptionalProp({ default: false })
	@IsOptional()
	isWatching?: boolean
}

export class GetLatestReelDto {
	@ApiProperty({
		description: "List of reel IDs that were watched",
		type: [String],
		required: false
	})
	@IsOptional()
	@Transform(({ value }) => {
		if (Array.isArray(value)) return value
		if (typeof value === "string") return [value].filter(item => item.trim())
		return []
	})
	@IsArray()
	@IsString({ each: true })
	excludedReelIds?: string[]
}
