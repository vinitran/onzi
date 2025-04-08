import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common"
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger"
import { Auth } from "@root/_shared/utils/decorators"
import {
	ApiPaginatedResponse,
	PaginatedResponse
} from "@root/_shared/utils/parsers"
import { Claims } from "@root/auth/auth.service"
import { BuyTokenOnchainDto } from "@root/tokens/dtos/buy-token.dto"
import { CreateTokenDto } from "@root/tokens/dtos/create-token.dto"
import { PaginateListTransactionDto } from "@root/tokens/dtos/paginate-list-transaction.dto"
import {
	CreateTokenResponseDto,
	CreateTokenTxResponseDto,
	SimilarTokenResponseDto,
	TokenDto,
	TokenHolderResponseDto
} from "@root/tokens/dtos/token.dto"
import { TokenTransactionResponseDto } from "@root/tokens/dtos/transactions.dto"
import { TokensService } from "@root/tokens/tokens.service"
import { User } from "@root/users/user.decorator"
import { plainToInstance } from "class-transformer"

@Auth()
@Controller("tokens")
@ApiTags("tokens")
@ApiResponse({ status: 400, description: "Invalid token data" })
@ApiResponse({ status: 401, description: "Unauthorized" })
@ApiResponse({ status: 500, description: "Internal server error" })
export class TokensController {
	constructor(private readonly tokensService: TokensService) {}

	@Post()
	@ApiOperation({ summary: "Create a new token" })
	@ApiResponse({
		status: 201,
		description: "Token created successfully",
		type: CreateTokenResponseDto
	})
	async create(@Body() body: CreateTokenDto, @User() user: Claims) {
		const result = await this.tokensService.createToken({
			...body,
			creatorAddress: user.address
		})
		return plainToInstance(CreateTokenResponseDto, result, {
			excludeExtraneousValues: true
		})
	}

	@Post(":id")
	@ApiOperation({ summary: "Create token on blockchain" })
	@ApiResponse({
		status: 201,
		description: "Token created on blockchain successfully",
		type: CreateTokenTxResponseDto
	})
	async createTokenOnchain(
		@Param("id") tokenId: string,
		@Body() body: BuyTokenOnchainDto,
		@User() user: Claims
	) {
		const data = await this.tokensService.broadcastCreateOnChain({
			creatorAddress: user.address,
			tokenID: tokenId,
			minSol: body.minSol,
			maxSol: body.maxSol
		})

		return plainToInstance(CreateTokenTxResponseDto, data, {
			excludeExtraneousValues: true
		})
	}

	@Get(":address/similar")
	@ApiOperation({
		summary:
			"Get list of 20 similar tokens (with market cap less than or equal to the given token)"
	})
	@ApiResponse({
		status: 200,
		description: "List of similar tokens retrieved successfully",
		type: [SimilarTokenResponseDto]
	})
	async getListSimilar(@Param("address") address: string) {
		const data = await this.tokensService.getListSimilar(address)
		return data.map(item =>
			plainToInstance(SimilarTokenResponseDto, item, {
				excludeExtraneousValues: true
			})
		)
	}

	@Get(":address/list-holder")
	@ApiOperation({ summary: "Get list of token holders" })
	@ApiResponse({
		status: 200,
		description: "List of token holders retrieved successfully",
		type: [TokenHolderResponseDto]
	})
	async getListHolder(@Param("address") address: string) {
		const data = await this.tokensService.getListHolder(address)
		return data.map(item =>
			plainToInstance(TokenHolderResponseDto, item, {
				excludeExtraneousValues: true
			})
		)
	}

	@Get(":address/list-transaction")
	@ApiPaginatedResponse(TokenTransactionResponseDto)
	@ApiOperation({ summary: "Get paginated list of token transactions" })
	@ApiResponse({
		status: 200,
		description: "List of transactions retrieved successfully",
		type: [TokenTransactionResponseDto]
	})
	async getListTransaction(
		@Param("address") address: string,
		@Query() query: PaginateListTransactionDto,
		@User() user: Claims
	) {
		const { data, total, maxPage } = await this.tokensService.getTransactions(
			address,
			query,
			user
		)

		return plainToInstance(
			PaginatedResponse<TokenTransactionResponseDto>,
			new PaginatedResponse(data, total, maxPage),
			{
				excludeExtraneousValues: true
			}
		)
	}

	@Get(":address")
	@ApiOperation({ summary: "Get token details" })
	@ApiResponse({
		status: 200,
		description: "Token details retrieved successfully",
		type: [TokenDto]
	})
	async getDetail(@Param("address") address: string) {
		const data = await this.tokensService.getByAddress(address)

		return plainToInstance(TokenDto, data, {
			excludeExtraneousValues: true
		})
	}
}
