import {
	Body,
	ClassSerializerInterceptor,
	Controller,
	Param,
	Post,
	SerializeOptions,
	UseInterceptors
} from "@nestjs/common"
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger"
import { Auth } from "@root/_shared/utils/decorators"
import { User } from "@root/users/user.decorator"
import { CreateTokenReportDto } from "./dtos/payload.dto"
import { CreateTokenReportResponse } from "./dtos/response.dto"
import { TokenReportsService } from "./token-reports.service"

@Controller("token-reports")
@ApiTags("token-reports")
@ApiResponse({ status: 400, description: "Invalid token report data" })
@ApiResponse({ status: 401, description: "Unauthorized" })
@ApiResponse({ status: 403, description: "Forbidden" })
@ApiResponse({ status: 500, description: "Internal server error" })
@Auth()
@UseInterceptors(ClassSerializerInterceptor)
export class TokenReportsController {
	constructor(private readonly tokenReportsService: TokenReportsService) {}

	@Post("/tokens/:tokenAddress/reports")
	@ApiOperation({ summary: "Create a new token report" })
	@ApiResponse({
		status: 201,
		description: "Token report created successfully",
		type: CreateTokenReportResponse
	})
	@SerializeOptions({
		type: CreateTokenReportResponse,
		excludeExtraneousValues: true
	})
	async createReport(
		@User("id") userId: string,
		@Param("tokenAddress") tokenAddress: string,
		@Body() body: CreateTokenReportDto
	) {
		return this.tokenReportsService.createReport({
			description: body.description,
			tokenAddress,
			userId
		})
	}
}
