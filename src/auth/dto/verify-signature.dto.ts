import { Prop } from "@root/_shared/utils/decorators"
import { Expose } from "class-transformer"

export class VerifySignaturePayload {
	@Prop()
	message: string

	@Prop()
	signature: string

	@Prop()
	publicKey: string
}

export class VerifySignatureResponse {
	@Expose()
	token: string
}
