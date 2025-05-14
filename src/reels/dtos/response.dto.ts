import { ApiProperty } from "@nestjs/swagger"
import { Paginate } from "@root/dtos/common.dto"
import { S3Upload } from "@root/dtos/file.dto"
import { Reel } from "@root/dtos/reel.dto"
import { Expose, Type } from "class-transformer"

export class CreateReelResponse {
	@ApiProperty({
		description: "Reel created"
	})
	@Expose()
	reel: Reel

	@ApiProperty({
		description: "Presigned URL data for attachment upload",
		required: false
	})
	@Expose()
	attachment: S3Upload
}

export class PaginateReelResponse extends Paginate<Reel> {
	@ApiProperty({ type: [Reel] })
	@Type(() => Reel)
	@Expose()
	data: Reel[]
}
