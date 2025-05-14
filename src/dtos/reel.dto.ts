import { ApiProperty } from "@nestjs/swagger"
import { Expose, Transform } from "class-transformer"

export class Reel {
	@Expose()
	@ApiProperty({ description: "Unique identifier for the reel" })
	id: string

	@Expose()
	@ApiProperty({ description: "Caption or description of the reel" })
	caption: string

	@Expose()
	@ApiProperty({ description: "URI of the video associated with the reel" })
	videoUri: string

	@Expose()
	@Transform(({ value }) => Number(value))
	@ApiProperty({ description: "Number of views the reel has received" })
	viewAmount: number

	@Expose()
	@ApiProperty({ description: "Identifier of the creator of the reel" })
	creatorId: string

	@Expose()
	@ApiProperty({ description: "Token identifier associated with the reel" })
	tokenId: string

	@Expose()
	@ApiProperty({ description: "Timestamp when the reel was created" })
	createdAt: Date

	@Expose()
	@ApiProperty({ description: "Timestamp when the reel was last updated" })
	updatedAt: Date

	constructor(partial: Partial<Reel>) {
		Object.assign(this, partial)
	}
}
