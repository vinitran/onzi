import { ApiProperty } from "@nestjs/swagger"
import { Prop } from "@root/_shared/utils/decorators"
import { Expose } from "class-transformer"

export class GetMessagePayload {
	@ApiProperty({
		description: "Public key of the wallet to authenticate",
		example: "DuoULHu4KtX4pSg3DFViE86HLq96VhHD5eUEhY4MQauD"
	})
	@Prop()
	publicKey: string
}

export class GetMessageResponse {
	@ApiProperty({
		description: "Authentication message to be signed by the wallet",
		example: "MQTiGPGVJzWI"
	})
	@Expose()
	message: string
}
