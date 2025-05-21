import { ApiProperty } from "@nestjs/swagger"
import { Expose } from "class-transformer"

export class TokenReport {
	@Expose()
	@ApiProperty({ description: "Unique identifier for the token report" })
	id: string

	@Expose()
	@ApiProperty({ description: "Address of the token being reported" })
	tokenAddress: string

	@Expose()
	@ApiProperty({ description: "Identifier of the user who reported the token" })
	reporterId: string

	@Expose()
	@ApiProperty({ description: "Description of the report" })
	description: string

	@Expose()
	@ApiProperty({ description: "Date when the report was created" })
	createdAt: Date
}
