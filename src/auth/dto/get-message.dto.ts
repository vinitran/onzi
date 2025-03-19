import { Prop } from "@root/_shared/utils/decorators"
import { Expose } from "class-transformer"

export class GetMessageParams {
	@Prop()
	publicKey: string
}

export class GetMessageResponse {
	@Expose()
	message: string
}
