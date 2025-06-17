import { ApiProperty } from "@nestjs/swagger"
import { WITHDRAW_CODE_OPTION } from "@root/_shared/constants/admin"
import { TOKEN_SUMMARY_OPTION } from "@root/_shared/constants/token"
import { OptionalProp, Prop } from "@root/_shared/utils/decorators"
import { PaginatedParams } from "@root/dtos/common.dto"
import { Type } from "class-transformer"
import {
	IsArray,
	IsEnum,
	IsNumber,
	IsString,
	IsUUID,
	Length,
	ValidateNested
} from "class-validator"

export enum BlockUserChatType {
	CreateReelComment = "CreateReelComment",
	CreateTokenComment = "CreateTokenComment"
}

export enum BlockUserType {
	Permanent = "Permanent",
	Temporary = "Temporary"
}

export class ToggleBlockUserChatDto {
	@ApiProperty({
		description: "Toggle block user create chat in all platform(token, reel)",
		enum: BlockUserChatType,
		isArray: true,
		example: [
			BlockUserChatType.CreateReelComment,
			BlockUserChatType.CreateTokenComment
		]
	})
	@IsArray()
	@Prop()
	@IsEnum(BlockUserChatType, { each: true })
	listType: BlockUserChatType[]

	@ApiProperty({
		description:
			"Block user create reel with options Permanent or Temporary. Temporary is default 3 days",
		example: BlockUserType.Permanent,
		enum: BlockUserType
	})
	@OptionalProp()
	@IsEnum(BlockUserType)
	option?: BlockUserType
}

export class ToggleBlockUserCreateReelDto {
	@ApiProperty({
		description:
			"Block user create reel with options Permanent or Temporary. Temporary is default 3 days",
		example: BlockUserType.Permanent,
		enum: BlockUserType
	})
	@IsEnum(BlockUserType)
	type: BlockUserType
}

export class UpdateTokenItemDto {
	@ApiProperty({
		description: "Token ID",
		example: "1"
	})
	@IsUUID()
	@Prop()
	id: string

	@ApiProperty({
		description: "Token order",
		example: 1
	})
	@OptionalProp()
	@IsNumber()
	order: number

	@ApiProperty({
		description: "Token headline",
		example: "Token 1"
	})
	@IsString()
	@Length(1, 255)
	headline: string
}

export class UpdateTokensDto {
	@ApiProperty({
		description: "Update tokens for popular with order & headline",
		example: [
			{
				id: "1",
				order: 1,
				headline: "Token 1"
			},
			{
				id: "2",
				order: 2,
				headline: "Token 2"
			}
		],
		isArray: true,
		type: UpdateTokenItemDto
	})
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => UpdateTokenItemDto)
	tokens: UpdateTokenItemDto[]
}

export class PaginateReportedTokensDto extends PaginatedParams {}

export class GetSummaryTokensDto {
	@ApiProperty({ description: "Option to find", enum: TOKEN_SUMMARY_OPTION })
	@Prop()
	@IsEnum(TOKEN_SUMMARY_OPTION)
	option: TOKEN_SUMMARY_OPTION
}

export class GetWithdrawalCodeDto {
	@ApiProperty({
		description: "Option to generate code",
		enum: WITHDRAW_CODE_OPTION
	})
	@Prop()
	@IsEnum(WITHDRAW_CODE_OPTION)
	option: WITHDRAW_CODE_OPTION
}
