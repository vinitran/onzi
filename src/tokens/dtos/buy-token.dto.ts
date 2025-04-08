import { ApiProperty } from "@nestjs/swagger"
import { Prop } from "@root/_shared/utils/decorators"
import { IsString } from "class-validator"

export class BuyTokenOnchainDto {
	@ApiProperty({
		description: "Minimum SOL amount for buying token",
		example: "1"
	})
	@Prop()
	@IsString()
	minSol: string

	@ApiProperty({
		description: "Maximum SOL amount for buying token",
		example: "1000000000"
	})
	@Prop()
	@IsString()
	maxSol: string
}
