import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common"
import {
	ApiBearerAuth,
	ApiOperation,
	ApiResponse,
	ApiTags
} from "@nestjs/swagger"
import { Auth } from "@root/_shared/utils/decorators"
import { Claims } from "@root/auth/auth.service"
import {
	ApiPaginatedResponse,
	Paginate as PaginatedResponse
} from "@root/dtos/common.dto"
import {
	CreateTokenOnchainPayload,
	CreateTokenPayload,
	FindListTokenFavoriteParams,
	FindTokenParams,
	ListTransactionParams
} from "@root/tokens/dtos/payload.dto"
import {
	CreateTokenOnchainResponse,
	CreateTokenResponse,
	FindFavoriteTokenResponse,
	FindTokenResponse,
	ListTransactionResponse,
	SimilarTokenResponse,
	ToggleFavoriteTokenResponse,
	TokenHolderResponse,
	TrendingTopicResponse
} from "@root/tokens/dtos/response.dto"
import { TokensService } from "@root/tokens/tokens.service"
import { User } from "@root/users/user.decorator"
import { plainToInstance } from "class-transformer"

@Controller("tokens")
@ApiTags("tokens")
@ApiResponse({ status: 400, description: "Invalid token data" })
@ApiResponse({ status: 401, description: "Unauthorized" })
@ApiResponse({ status: 500, description: "Internal server error" })
export class TokensController {
	constructor(private readonly tokensService: TokensService) {}

	@Post()
	@Auth()
	@ApiOperation({ summary: "Create a new token" })
	@ApiResponse({
		status: 201,
		description: "Token created successfully",
		type: CreateTokenResponse
	})
	async create(@User() user: Claims, @Body() body: CreateTokenPayload) {
		const result = await this.tokensService.createToken(user.address, body)

		return plainToInstance(CreateTokenResponse, result, {
			excludeExtraneousValues: true
		})
	}

	@Get()
	@ApiBearerAuth()
	@ApiPaginatedResponse(FindTokenResponse)
	@ApiOperation({ summary: "Latest token" })
	async findMany(
		@User() user: Claims | undefined,
		@Query() query: FindTokenParams
	) {
		const {
			tokens: data,
			total,
			maxPage
		} = await this.tokensService.find(user?.address, query)

		return plainToInstance(
			PaginatedResponse<FindTokenResponse>,
			new PaginatedResponse(data, total, maxPage),
			{
				excludeExtraneousValues: true
			}
		)
	}

	@Get("trending-topics")
	@ApiResponse({
		status: 200,
		description: "Get trending topics successfully",
		type: TrendingTopicResponse
	})
	@ApiOperation({ summary: "Get trending topics" })
	async getTrendingTopics() {
		const data = await this.tokensService.getTrendingTopics()
		return plainToInstance(TrendingTopicResponse, data, {
			excludeExtraneousValues: true
		})
	}

	@Auth()
	@ApiPaginatedResponse(FindFavoriteTokenResponse)
	@Get("favorite")
	@ApiOperation({ summary: "Paginate list favorite token" })
	async paginateFavouriteToken(
		@Query() query: FindListTokenFavoriteParams,
		@User() user: Claims
	) {
		const { maxPage, tokens, total } = await this.tokensService.getListFavorite(
			user.address,
			query
		)
		const res = plainToInstance(
			PaginatedResponse<FindFavoriteTokenResponse>,
			new PaginatedResponse(tokens, total, maxPage),
			{
				excludeExtraneousValues: true
			}
		)

		return res
	}

	@Post(":id")
	@Auth()
	@ApiOperation({ summary: "Create token on blockchain" })
	@ApiResponse({
		status: 201,
		description: "Token created on blockchain successfully",
		type: CreateTokenOnchainResponse
	})
	async createTokenOnchain(
		@Param("id") tokenId: string,
		@Body() body: CreateTokenOnchainPayload,
		@User() user: Claims
	) {
		const data = await this.tokensService.broadcastCreateOnChain({
			creatorAddress: user.address,
			tokenID: tokenId,
			minSol: body.minSol,
			maxSol: body.maxSol
		})

		return plainToInstance(CreateTokenOnchainResponse, data, {
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
		type: [SimilarTokenResponse]
	})
	async getListSimilar(@Param("address") address: string) {
		const data = await this.tokensService.getListSimilar(address)
		return data.map(item =>
			plainToInstance(SimilarTokenResponse, item, {
				excludeExtraneousValues: true
			})
		)
	}

	@Get(":address/list-holder")
	@ApiOperation({ summary: "Get list of token holders" })
	@ApiResponse({
		status: 200,
		description: "List of token holders retrieved successfully",
		type: [TokenHolderResponse]
	})
	async getListHolder(@Param("address") address: string) {
		const data = await this.tokensService.getListHolder(address)
		return data.map(item =>
			plainToInstance(TokenHolderResponse, item, {
				excludeExtraneousValues: true
			})
		)
	}

	@Get(":address/list-transaction")
	@ApiPaginatedResponse(ListTransactionResponse)
	@ApiOperation({ summary: "Get paginated list of token transactions" })
	async getListTransaction(
		@Param("address") address: string,
		@Query() query: ListTransactionParams,
		@User() user: Claims
	) {
		const { data, total, maxPage } = await this.tokensService.getTransactions(
			address,
			query,
			user
		)

		return plainToInstance(
			PaginatedResponse<ListTransactionResponse>,
			new PaginatedResponse(data, total, maxPage),
			{
				excludeExtraneousValues: true
			}
		)
	}

	@Auth()
	@Post(":address/favorite")
	@ApiOperation({ summary: "Toggle favorite token" })
	@ApiResponse({
		status: 200,
		description: "Toggle favorite token successfully",
		type: ToggleFavoriteTokenResponse
	})
	async toggleFavoriteToken(
		@Param("address") address: string,
		@User() user: Claims
	) {
		const data = await this.tokensService.toggleFavorite(address, user.address)
		return plainToInstance(ToggleFavoriteTokenResponse, data, {
			excludeExtraneousValues: true
		})
	}

	@Get(":address")
	@ApiOperation({ summary: "Get token details" })
	@ApiResponse({
		status: 200,
		description: "Token details retrieved successfully",
		type: [FindTokenResponse]
	})
	async find(@Param("address") address: string) {
		const data = await this.tokensService.getByAddress(address)

		return plainToInstance(FindTokenResponse, data, {
			excludeExtraneousValues: true
		})
	}
}
