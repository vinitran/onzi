import { ApiProperty } from "@nestjs/swagger"
import { Expose } from "class-transformer"

export class GetMessageResponse {
	@ApiProperty({
		description: "Authentication message to be signed by the wallet",
		example: "MQTiGPGVJzWI"
	})
	@Expose()
	message: string
}

export class VerifySignatureResponse {
	@ApiProperty({
		description: "JWT token for authenticated requests",
		example: "eyJhbGciOiJIUzI1NiIs..."
	})
	@Expose()
	token: string
}
