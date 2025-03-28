import { Body, Controller, Post } from "@nestjs/common"
import { ApiOperation, ApiTags } from "@nestjs/swagger"
import { Auth } from "@root/_shared/utils/decorators"
import { Claims } from "@root/auth/auth.service"
import { User } from "@root/users/user.decorator"
import { CreateTokenDto } from "./dtos/create-token.dto"
import { TokensService } from "./tokens.service"

@Auth()
@Controller("tokens")
@ApiTags("tokens")
export class TokensController {
	constructor(private readonly tokensService: TokensService) {}

	@Post()
	@ApiOperation({ summary: "Create token" })
	create(@Body() body: CreateTokenDto, @User() user: Claims) {
		return this.tokensService.createToken({
			...body,
			creatorAddress: user.address
		})
	}
}
