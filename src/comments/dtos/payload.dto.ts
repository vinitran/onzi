import { ApiProperty } from "@nestjs/swagger"
import { IsBool, OptionalProp, Prop } from "@root/_shared/utils/decorators"
import { PaginatedParams } from "@root/dtos/common.dto"
import { ContentType } from "@root/tokens/dtos/payload.dto"
import { IsEnum, IsOptional, IsString, IsUUID } from "class-validator"

export class CreateCommentPayload {
	@ApiProperty({
		description: "Content of the comment",
		example: "This is a great token!"
	})
	@Prop()
	@IsString()
	content: string

	@ApiProperty({
		description: "Whether the comment contains an attachment",
		example: false,
		required: false,
		default: false
	})
	@OptionalProp({ default: false })
	@IsBool
	isContainAttachment: boolean

	@ApiProperty({
		description: "Content type of the token",
		example: ContentType.PNG,
		enum: ContentType,
		required: false
	})
	@OptionalProp()
	@IsEnum(ContentType)
	@IsOptional()
	contentType?: ContentType

	@ApiProperty({
		description: "Sticker id owned"
	})
	@OptionalProp()
	@IsUUID()
	stickerId?: string
}

export class GetCommentsParams extends PaginatedParams {
	@ApiProperty({
		description: "Sort order for comments.dtos.ts by creation date",
		enum: ["desc", "asc"],
		example: "desc",
		required: false,
		default: "desc"
	})
	@OptionalProp({ default: "desc", enum: ["desc", "asc"] })
	@IsEnum({ ASC: "asc", DESC: "desc" })
	@IsOptional()
	sortCreatedAt?: "asc" | "desc"
}

export class RepliesParams extends PaginatedParams {}
