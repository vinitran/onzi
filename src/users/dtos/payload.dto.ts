import { ApiProperty } from "@nestjs/swagger"
import { EmptyStringToTrue, Prop } from "@root/_shared/utils/decorators"
import { PaginatedParams } from "@root/dtos/common.dto"
import { IsOptional, MaxLength } from "class-validator"

export class GetCoinCreatedParams extends PaginatedParams {}

export class SetInformationPayload {
	@ApiProperty({
		description: "New username for the user",
		example: "johndoe",
		required: false,
		maxLength: 20
	})
	@Prop({ required: false })
	@IsOptional()
	@MaxLength(20, { message: "Maximum length allowed is 20 characters." })
	username?: string

	@ApiProperty({
		description: "New biography for the user",
		example: "Crypto enthusiast and blockchain developer",
		required: false,
		maxLength: 50
	})
	@Prop({ required: false })
	@IsOptional()
	@MaxLength(50, { message: "Maximum length allowed is 50 characters." })
	bio?: string

	@ApiProperty({
		description: "Update Avatar",
		required: false
	})
	@EmptyStringToTrue()
	@IsOptional()
	updateAvatar?: string

	@ApiProperty({
		description: "Update backround",
		required: false
	})
	@EmptyStringToTrue()
	@IsOptional()
	updateBackground?: string

	@ApiProperty({
		description: "Telegram profile link",
		required: false
	})
	@IsOptional()
	telegramLink?: string

	@ApiProperty({
		description: "Twitter profile link",
		required: false
	})
	@IsOptional()
	twitterLink?: string

	@ApiProperty({
		description: "Instagram profile link",
		required: false
	})
	@IsOptional()
	instagramLink?: string

	@ApiProperty({
		description: "TikTok profile link",
		required: false
	})
	@IsOptional()
	tiktokLink?: string

	@ApiProperty({
		description: "OnlyFans profile link",
		required: false
	})
	@IsOptional()
	onlyFansLink?: string
}

export class FollowingPayload {
	@ApiProperty({
		description: "ID of the user to follow",
		example: "123e4567-e89b-12d3-a456-426614174000"
	})
	@Prop()
	followingId: string
}

export class UnfollowingPayload {
	@ApiProperty({
		description: "ID of the follow connection to remove",
		example: "123e4567-e89b-12d3-a456-426614174000"
	})
	@Prop()
	followId: string
}
