import { Body, Controller, Get, Post, Query } from "@nestjs/common"
import { ApiTags } from "@nestjs/swagger"
import { plainToInstance } from "class-transformer"
import { AuthService } from "./auth.service"
import { GetMessageParams, GetMessageResponse } from "./dto/get-message.dto"
import {
	VerifySignaturePayload,
	VerifySignatureResponse
} from "./dto/verify-signature.dto"

@Controller("auth")
@ApiTags("auth")
export class AuthController {
	constructor(private authService: AuthService) {}

	@Get("message")
	async createMessage(@Query() { publicKey }: GetMessageParams) {
		const message = await this.authService.generateMessage(publicKey)
		return plainToInstance(
			GetMessageResponse,
			{ message },
			{ excludeExtraneousValues: true }
		)
	}

	@Post("verify-signature")
	async verifySignature(
		@Body() verifySignatureRequest: VerifySignaturePayload
	) {
		const token = await this.authService.verifySignature(verifySignatureRequest)
		return plainToInstance(
			VerifySignatureResponse,
			{ token },
			{ excludeExtraneousValues: true }
		)
	}
}
