import { ApiProperty } from "@nestjs/swagger"
import { User } from "@root/dtos/user.dto"
import { Expose } from "class-transformer"

export class UserSocial {
	@ApiProperty({
		description: "Unique identifier of the user",
		example: "123e4567-e89b-12d3-a456-426614174000"
	})
	@Expose()
	id: string

	@ApiProperty({
		description: "Telegram group/channel link",
		example: "https://t.me/yourgroup",
		required: false
	})
	@Expose()
	telegramLink?: string

	@ApiProperty({
		description: "Twitter profile link",
		example: "https://twitter.com/yourprofile",
		required: false
	})
	@Expose()
	twitterLink?: string

	@ApiProperty({
		description: "Instagram profile link",
		example: "https://instagram.com/yourprofile",
		required: false
	})
	@Expose()
	instagramLink?: string

	@ApiProperty({
		description: "TikTok profile link",
		example: "https://tiktok.com/@yourprofile",
		required: false
	})
	@Expose()
	tiktokLink?: string

	@ApiProperty({
		description: "OnlyFans profile link",
		example: "https://onlyfans.com/yourprofile",
		required: false
	})
	@Expose()
	onlyFansLink?: string

	@ApiProperty({
		description: "User",
		type: () => User
	})
	@Expose()
	user: User

	@ApiProperty({
		description: "Timestamp when the user was created",
		example: "2024-03-20T12:00:00Z"
	})
	@Expose()
	createdAt: string

	@ApiProperty({
		description: "Timestamp when the user was last updated",
		example: "2024-03-21T15:30:00Z"
	})
	@Expose()
	updatedAt: string

	constructor(partial: Partial<UserSocial>) {
		Object.assign(this, partial)
	}
}
