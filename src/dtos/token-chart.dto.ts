import { ApiProperty } from "@nestjs/swagger"
import { Expose, Type } from "class-transformer"

export class TokenChart {
	@ApiProperty({
		description: "Token chart id",
		example: "123e4567-e89b-12d3-a456-426614174000"
	})
	@Expose()
	id: string

	@ApiProperty({
		description: "Token id",
		example: "123e4567-e89b-12d3-a456-426614174000"
	})
	@Expose()
	tokenId: string

	@ApiProperty({
		description: "Time step in milliseconds",
		example: 60000
	})
	@Expose()
	@Type(() => Number)
	step: number

	@ApiProperty({
		description: "Date timestamp in milliseconds",
		example: 1710892800
	})
	@Expose()
	@Type(() => Number)
	date: number

	@ApiProperty({
		description: "Opening price",
		example: 1.25
	})
	@Expose()
	@Type(() => Number)
	open: number

	@ApiProperty({
		description: "Highest price",
		example: 1.35
	})
	@Expose()
	@Type(() => Number)
	high: number

	@ApiProperty({
		description: "Lowest price",
		example: 1.15
	})
	@Expose()
	@Type(() => Number)
	low: number

	@ApiProperty({
		description: "Closing price",
		example: 1.3
	})
	@Expose()
	@Type(() => Number)
	close: number

	@ApiProperty({
		description: "Trading volume",
		example: 1000000
	})
	@Expose()
	@Type(() => Number)
	volume: number

	@ApiProperty({
		description: "Creation timestamp",
		example: "2024-03-19T10:15:00Z"
	})
	@Expose()
	createdAt: Date

	@ApiProperty({
		description: "Last update timestamp",
		example: "2024-03-23T14:20:00Z",
		required: false
	})
	@Expose()
	updatedAt?: Date

	constructor(partial: Partial<TokenChart>) {
		Object.assign(this, partial)
	}
}
