import { Body, Controller, Get, Post, Query } from "@nestjs/common"
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger"
import {
	GetMessagePayload,
	VerifySignaturePayload
} from "@root/auth/dtos/payload.dto"
import {
	GetMessageResponse,
	VerifySignatureResponse
} from "@root/auth/dtos/response.dto"
import { plainToInstance } from "class-transformer"
import { AuthService } from "./auth.service"

@Controller("auth")
@ApiTags("auth")
export class AuthController {
	constructor(private authService: AuthService) {}

	@Get("message")
	@ApiOperation({ summary: "Get authentication message for wallet signature" })
	@ApiResponse({
		status: 200,
		description: "Successfully generated authentication message",
		type: GetMessageResponse
	})
	@ApiResponse({ status: 400, description: "Invalid public key" })
	async createMessage(@Query() { publicKey }: GetMessagePayload) {
		const message = await this.authService.generateMessage(publicKey)
		return plainToInstance(
			GetMessageResponse,
			{ message },
			{ excludeExtraneousValues: true }
		)
	}

	@Post("verify-signature")
	@ApiOperation({
		summary: "Verify wallet signature and get authentication token"
	})
	@ApiResponse({
		status: 200,
		description: "Successfully verified signature and generated token",
		type: VerifySignatureResponse
	})
	@ApiResponse({ status: 400, description: "Invalid signature or message" })
	@ApiResponse({ status: 401, description: "Authentication failed" })
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
