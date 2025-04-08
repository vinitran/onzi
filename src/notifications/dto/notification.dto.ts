import { ApiProperty } from "@nestjs/swagger"
import { TransactionType } from "@prisma/client"
import { Expose, Type } from "class-transformer"

export class CreatorDto {
	@ApiProperty()
	@Expose()
	id: string

	@ApiProperty()
	@Expose()
	address: string

	@ApiProperty({ nullable: true })
	@Expose()
	avatarUrl: string | null
}

export class TokenDto {
	@ApiProperty()
	@Expose()
	id: string

	@ApiProperty()
	@Expose()
	address: string

	@ApiProperty()
	@Expose()
	uri: string

	@ApiProperty({ type: () => CreatorDto, required: false })
	@Expose()
	@Type(() => CreatorDto)
	creator?: CreatorDto
}

export class TransactionDto {
	@ApiProperty()
	@Expose()
	id: string

	@ApiProperty()
	@Expose()
	signature: string

	@ApiProperty()
	@Expose()
	tokenAddress: string

	@ApiProperty({ enum: TransactionType })
	@Expose()
	type: TransactionType

	@ApiProperty()
	@Expose()
	createdBy: CreatorDto

	@ApiProperty()
	@Expose()
	token: TokenDto
}

export class NotificationDto {
	@ApiProperty({ type: () => TokenDto, nullable: true })
	@Expose()
	@Type(() => TokenDto)
	token: TokenDto | null

	@ApiProperty({ type: () => TransactionDto, nullable: true })
	@Expose()
	@Type(() => TransactionDto)
	transaction: TransactionDto | null
}
