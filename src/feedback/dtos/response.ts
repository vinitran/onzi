import { Expose } from "class-transformer"
import { IsString } from "class-validator"

export class FeedbackCreateResponse {
	@Expose()
	@IsString()
	message: string
}
