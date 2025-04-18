import { ApiProperty } from "@nestjs/swagger"
import { Token as TokenDto } from "@root/dtos/token.dto"
import { Expose } from "class-transformer"

export class TokenFavorite extends TokenDto {
	@ApiProperty({
		description: "Time to add favorite",
		example: "123e4567-e89b-12d3-a456-426614174000"
	})
	@Expose()
	favoriteCreatedAt: string
}
