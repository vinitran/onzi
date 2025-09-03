import { ApiProperty } from "@nestjs/swagger"
import { S3Upload } from "@root/dtos/file.dto"
import { TokenOwner } from "@root/dtos/token-owner.dto"
import { User } from "@root/dtos/user.dto"
import { Expose } from "class-transformer"

export class CoinHeldsResponse extends TokenOwner {}

export class SetAvatarResponse extends S3Upload {}

export class SetInformationUser {
	@ApiProperty({ description: "User information", type: User })
	@Expose()
	user: User

	@ApiProperty({
		description: "Attachment avatar",
		type: S3Upload,
		required: false
	})
	@Expose()
	avatarAttachment?: S3Upload

	@ApiProperty({
		description: "Attachment background",
		type: S3Upload,
		required: false
	})
	@Expose()
	backgroundAttachment?: S3Upload
}

export class UserBalanceResponse {
	@ApiProperty({ description: "User's balance" })
	@Expose()
	balance: string
}
