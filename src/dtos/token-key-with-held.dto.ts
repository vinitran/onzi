import { ApiProperty } from "@nestjs/swagger"
import { Expose } from "class-transformer"

export class TokenKeyWithHeld {
	@ApiProperty({
		description: "Token owner id",
		example: "123e4567-e89b-12d3-a456-426614174000"
	})
	@Expose()
	id: string

	@ApiProperty({
		description: "Token owner id",
		example: "ES69bn51QABsJ5G5Kp2LZW524MCSdxhP1a7dHB84nQ12"
	})
	@Expose()
	publicKey: string

	constructor(partial: Partial<TokenKeyWithHeld>) {
		Object.assign(this, partial)
	}
}
