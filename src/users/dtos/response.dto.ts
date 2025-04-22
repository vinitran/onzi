import { ApiProperty } from "@nestjs/swagger"
import { S3Upload } from "@root/dtos/file.dto"
import { User } from "@root/dtos/user.dto"
import { Expose } from "class-transformer"

export class CoinHeldsResponse {
	@ApiProperty({
		description: "Address of the coin holder",
		example: "ES69bn51QABsJ5G5Kp2LZW524MCSdxhP1a7dHB84nQ12"
	})
	@Expose()
	address: string

	@ApiProperty({
		description: "Mint address of the coin",
		example: "ES69bn51QABsJ5G5Kp2LZW524MCSdxhP1a7dHB84nQ12"
	})
	@Expose()
	mint: string

	@ApiProperty({
		description: "Address of the coin owner",
		example: "ES69bn51QABsJ5G5Kp2LZW524MCSdxhP1a7dHB84nQ12"
	})
	@Expose()
	owner: string

	@ApiProperty({
		description: "Amount of coins held",
		example: 1000
	})
	@Expose()
	amount: number

	@ApiProperty({
		description: "Amount of coins delegated",
		example: 500
	})
	@Expose()
	delegated_amount: number

	@ApiProperty({
		description: "Whether the coins are frozen",
		example: false
	})
	@Expose()
	frozen: boolean
}

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
