import { ApiProperty } from "@nestjs/swagger"
import { TokenTransaction } from "@root/dtos/token-transaction.dto"
import { Token } from "@root/dtos/token.dto"
import { Expose, Type } from "class-transformer"

export class NotificationResponse {
	@ApiProperty({ type: () => Token, nullable: true })
	@Expose()
	@Type(() => Token)
	token: Token | null

	@ApiProperty({ type: () => TokenTransaction, nullable: true })
	@Expose()
	@Type(() => TokenTransaction)
	transaction: TokenTransaction | null
}
