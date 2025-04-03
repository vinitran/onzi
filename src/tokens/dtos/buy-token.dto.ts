import { Prop } from "@root/_shared/utils/decorators"
import { IsString } from "class-validator"

export class BuyTokenOnchainDto {
	@Prop()
	@IsString()
	minSol: string

	@Prop()
	@IsString()
	maxSol: string
}
