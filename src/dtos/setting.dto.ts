import { ApiProperty } from "@nestjs/swagger"
import { Expose } from "class-transformer"

export class Setting {
	@ApiProperty({
		description: "Unique key of the setting",
		example: "homepage_title"
	})
	@Expose()
	key: string

	@ApiProperty({
		description: "Value associated with the setting key",
		example: "Welcome to Ponz!"
	})
	@Expose()
	value: string

	@ApiProperty({
		description: "Timestamp when the setting was created",
		example: "2024-03-20T12:00:00Z"
	})
	@Expose()
	createdAt: string

	@ApiProperty({
		description: "Timestamp when the setting was last updated",
		example: "2024-03-21T15:30:00Z"
	})
	@Expose()
	updatedAt?: string

	constructor(partial: Partial<Setting>) {
		Object.assign(this, partial)
	}
}
