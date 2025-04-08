import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common"
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger"
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
	@ApiOperation({ summary: "Create a new token" })
	@ApiResponse({
		status: 201,
		description: "Token created successfully",
		type: CreateTokenDto
	})
	@ApiResponse({ status: 400, description: "Invalid token data" })
	@ApiResponse({ status: 401, description: "Unauthorized" })
	create(@Body() body: CreateTokenDto, @User() user: Claims) {
		return this.tokensService.createToken({
			...body,
			creatorAddress: user.address
		})
	}

	@Post(":id")
	@ApiOperation({ summary: "Create token on blockchain" })
	@ApiResponse({
		status: 201,
		description: "Token created on blockchain successfully",
		type: BuyTokenOnchainDto
	})
	@ApiResponse({ status: 400, description: "Invalid token data" })
	@ApiResponse({ status: 401, description: "Unauthorized" })
	@ApiResponse({ status: 404, description: "Token not found" })
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
	@ApiOperation({
		summary:
			"Get list of 20 similar tokens (with market cap less than or equal to the given token)"
	})
	@ApiResponse({
		status: 200,
		description: "List of similar tokens retrieved successfully"
	})
	@ApiResponse({ status: 404, description: "Token not found" })
	getListSimilar(@Param("address") address: string) {
		return this.tokensService.getListSimilar(address)
	}

	@Get(":address/list-holder")
	@ApiOperation({ summary: "Get list of token holders" })
	@ApiResponse({
		status: 200,
		description: "List of token holders retrieved successfully"
	})
	@ApiResponse({ status: 404, description: "Token not found" })
	getListHolder(@Param("address") address: string) {
		return this.tokensService.getListHolder(address)
	}

	@Get(":address/list-transaction")
	@ApiOperation({ summary: "Get paginated list of token transactions" })
	@ApiResponse({
		status: 200,
		description: "List of transactions retrieved successfully"
	})
	@ApiResponse({ status: 400, description: "Invalid pagination parameters" })
	@ApiResponse({ status: 404, description: "Token not found" })
	getListTransaction(
		@Param("address") address: string,
		@Query() query: PaginateListTransactionDto,
		@User() user: Claims
	) {
		return this.tokensService.paginateListTransaction(address, query, user)
	}

	@Get(":address")
	@ApiOperation({ summary: "Get token details" })
	@ApiResponse({
		status: 200,
		description: "Token details retrieved successfully"
	})
	@ApiResponse({ status: 404, description: "Token not found" })
	getDetail(@Param("address") address: string) {
		return this.tokensService.getByAddress(address)
	}
}
