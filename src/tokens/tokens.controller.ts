import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common"
import { ApiOperation, ApiTags } from "@nestjs/swagger"
import { Auth } from "@root/_shared/utils/decorators"
import { Claims } from "@root/auth/auth.service"
import { BuyTokenOnchainDto } from "@root/tokens/dtos/buy-token.dto"
import { CreateTokenDto } from "@root/tokens/dtos/create-token.dto"
import { PaginateListTransactionDto } from "@root/tokens/dtos/paginate-list-transaction.dto"
import { TokensService } from "@root/tokens/tokens.service"
import { User } from "@root/users/user.decorator"

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

	@Post(":id")
	@ApiOperation({ summary: "Create token" })
	createTokenOnchain(
		@Param("id") tokenId: string,
		@Body() body: BuyTokenOnchainDto,
		@User() user: Claims
	) {
		return this.tokensService.broadcastCreateOnChain({
			creatorAddress: user.address,
			tokenID: tokenId,
			minSol: body.minSol,
			maxSol: body.maxSol
		})
	}

	@Get(":address/similar")
	@ApiOperation({ summary: "Get list 20 similar tokens (lte its market cap)" })
	getListSimilar(@Param("address") address: string) {
		return this.tokensService.getListSimilar(address)
	}

	@Get(":address/list-holder")
	@ApiOperation({ summary: "Get list holder (list user own token)" })
	getListHolder(@Param("address") address: string) {
		return this.tokensService.getListHolder(address)
	}

	@Get(":address/list-transaction")
	@ApiOperation({ summary: "Get list transaction of token" })
	getListTransaction(
		@Param("address") address: string,
		@Query() query: PaginateListTransactionDto,
		@User() user: Claims
	) {
		return this.tokensService.paginateListTransaction(address, query, user)
	}

	@Get(":address")
	@ApiOperation({ summary: "Get detail token" })
	getDetail(@Param("address") address: string) {
		return this.tokensService.getByAddress(address)
	}
}
