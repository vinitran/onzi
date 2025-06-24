import { ApiProperty } from "@nestjs/swagger"
import { IsString, Length } from "class-validator"

export class CreateTokenReportDto {
	@ApiProperty({ description: "Reason for reporting the token" })
	@IsString()
	@Length(1, 500)
	description: string
}
