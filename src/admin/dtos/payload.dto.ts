import { ApiProperty } from "@nestjs/swagger"
import { Type } from "class-transformer"
import {
	IsArray,
	IsEnum,
	IsPositive,
	IsString,
	IsUUID,
	Length,
	ValidateNested
} from "class-validator"

export enum BlockUserChatType {
	CreateReelComment = "CreateReelComment",
	CreateTokenComment = "CreateTokenComment"
}

export enum BlockUserCreateReelType {
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
	@IsEnum(BlockUserChatType, { each: true })
	listType: BlockUserChatType[]
}

export class ToggleBlockUserCreateReelDto {
	@ApiProperty({
		description:
			"Block user create reel with options Permanent or Temporary. Temporary is default 3 days",
		example: BlockUserCreateReelType.Permanent,
		enum: BlockUserCreateReelType
	})
	@IsEnum(BlockUserCreateReelType)
	type: BlockUserCreateReelType
}

export class UpdateTokenItemDto {
	@ApiProperty({
		description: "Token ID",
		example: "1"
	})
	@IsUUID()
	id: string

	@ApiProperty({
		description: "Token order",
		example: 1
	})
	@IsPositive()
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
		isArray: true
	})
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => UpdateTokenItemDto)
	tokens: UpdateTokenItemDto[]
}
