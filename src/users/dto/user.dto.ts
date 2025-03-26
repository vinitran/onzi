import { Prop } from "@root/_shared/utils/decorators"
import { Expose } from "class-transformer"
import { IsNotEmpty, IsUrl, MaxLength } from "class-validator"

export class UserResponse {
	@Expose()
	id: string

	@Expose()
	address: string

	@Expose()
	username: string

	@Expose()
	bio: string

	@Expose()
	avatarUrl: string

	@Expose()
	network: string

	@Expose()
	premium: string

	@Expose()
	createdAt: string

	@Expose()
	updatedAt: string

	constructor(partial: Partial<UserResponse>) {
		Object.assign(this, partial)
	}
}

export class AvatarPresignedUrlResponse {
	@Expose()
	url: string

	@Expose()
	fields: string

	constructor(partial: Partial<AvatarPresignedUrlResponse>) {
		Object.assign(this, partial)
	}
}

export class SetUsernamePayload {
	@Prop()
	@IsNotEmpty({ message: "Username must not be empty" })
	@MaxLength(20, { message: "Maximum length allowed is 20 characters." })
	username: string
}

export class SetAvatarPayload {
	@Prop()
	@IsNotEmpty({ message: "Avatar url must not be empty" })
	@IsUrl({}, { message: "Avatar URL must be a valid URL" })
	avatarUrl: string
}
