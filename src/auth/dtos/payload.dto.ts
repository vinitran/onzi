import { ApiProperty } from "@nestjs/swagger"
import { Prop } from "@root/_shared/utils/decorators"
import { IsNotEmpty, IsString } from "class-validator"

export class GetMessagePayload {
	@ApiProperty({
		description: "Public key of the wallet to authenticate",
		example: "DuoULHu4KtX4pSg3DFViE86HLq96VhHD5eUEhY4MQauD"
	})
	@Prop()
	publicKey: string
}

export class VerifySignaturePayload {
	@ApiProperty({
		description: "Original message that was signed",
		example: "MQTiGPGVJzWI"
	})
	@IsString()
	@IsNotEmpty()
	message: string

	@ApiProperty({
		description: "Signature in base64",
		example: "yMnhiX6xvQTneQB/0phtxtj4m/..."
	})
	@IsString()
	@IsNotEmpty()
	signature: string

	@ApiProperty({
		description: "Public key of the wallet",
		example: "ES69bn51QABsJ5G5..."
	})
	@IsString()
	@IsNotEmpty()
	publicKey: string
}
