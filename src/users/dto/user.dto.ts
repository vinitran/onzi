import { ApiProperty } from "@nestjs/swagger"
import { Prop } from "@root/_shared/utils/decorators"
import { PaginatedParams } from "@root/_shared/utils/parsers"
import { Expose } from "class-transformer"
import { IsNotEmpty, IsOptional, IsUrl, MaxLength } from "class-validator"

export class UserResponse {
	@ApiProperty()
	@Expose()
	id: string

	@ApiProperty()
	@Expose()
	address: string

	@ApiProperty()
	@Expose()
	username: string

	@ApiProperty()
	@Expose()
	bio: string

	@ApiProperty()
	@Expose()
	avatarUrl: string

	@ApiProperty()
	@Expose()
	network: string

	@ApiProperty()
	@Expose()
	premium: string

	@ApiProperty()
	@Expose()
	createdAt: string

	@ApiProperty()
	@Expose()
	updatedAt: string

	constructor(partial: Partial<UserResponse>) {
		Object.assign(this, partial)
	}
}

export class TokenResponse {
	@Expose()
	id: string

	@Expose()
	address: string

	@Expose()
	name: string

	@Expose()
	symbol: string

	@Expose()
	uri: string

	@Expose()
	ticker?: string

	@Expose()
	metadata: string

	@Expose()
	network: string

	@Expose()
	isCompletedBondingCurve: boolean

	@Expose()
	createdAtBondingCurve?: string

	@Expose()
	bump?: boolean

	@Expose()
	marketCapacity?: number

	@Expose()
	createdAt: string

	@Expose()
	updatedAt?: string

	constructor(partial: Partial<TokenResponse>) {
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

export class CommentResponse {
	@Expose()
	id: string

	@Expose()
	content: string

	@Expose()
	attachmentUrl?: string

	@Expose()
	authorId: string

	@Expose()
	tokenId: string

	@Expose()
	parentId?: string

	@Expose()
	createdAt: string

	@Expose()
	updatedAt?: string

	constructor(partial: Partial<CommentResponse>) {
		Object.assign(this, partial)
	}
}

export class SetInformationPayload {
	@Prop({ required: false })
	@IsOptional()
	@MaxLength(20, { message: "Maximum length allowed is 20 characters." })
	username?: string

	@Prop({ required: false })
	@IsOptional()
	@MaxLength(50, { message: "Maximum length allowed is 20 characters." })
	bio?: string
}

export class SetAvatarPayload {
	@Prop()
	@IsNotEmpty({ message: "Avatar url must not be empty" })
	@IsUrl({}, { message: "Avatar URL must be a valid URL" })
	avatarUrl: string
}

export class GetCoinCreatedParams extends PaginatedParams {
	@Prop()
	creatorAddress: string
}
