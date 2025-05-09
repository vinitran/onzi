import {
	Body,
	Controller,
	Get,
	Param,
	ParseUUIDPipe,
	Post,
	Put,
	Query
} from "@nestjs/common"
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
	ChartParams,
	CreateTokenOnchainPayload,
	CreateTokenPayload,
	FindListTokenFavoriteParams,
	FindTokenByTextParams,
	FindTokenParams,
	ListTransactionParams,
	SickoModeParams,
	UpdateTokenPayload
} from "@root/tokens/dtos/payload.dto"
import {
	ChartResponse,
	CreateTokenInCacheResponse,
	CreateTokenOffchainResponse,
	CreateTokenOnchainResponse,
	FindFavoriteTokenResponse,
	FindSimilarTokenResponse,
	FindTokenResponse,
	ListTransactionResponse,
	SickoModeResponse,
	SimilarTokenResponse,
	ToggleFavoriteTokenResponse,
	TokenHolderResponse,
	TrendingTopicResponse,
	UpdateBannerResponse
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
	@ApiOperation({ summary: "Create a new token in cache" })
	@ApiResponse({
		status: 201,
		description: "Token created successfully in cache",
		type: CreateTokenInCacheResponse
	})
	async createInCache(@User() user: Claims, @Body() body: CreateTokenPayload) {
		const result = await this.tokensService.createTokenInCache(
			user.address,
			body
		)

		return plainToInstance(CreateTokenInCacheResponse, result, {
			excludeExtraneousValues: true
		})
	}

	// get token in cache
	// check
	@Post(":id/offchain")
	@Auth()
	@ApiOperation({ summary: "Create a new token" })
	@ApiResponse({
		status: 201,
		description: "Token created successfully",
		type: CreateTokenOffchainResponse
	})
	async createOffchain(@Param("id") tokenId: string) {
		const result = await this.tokensService.createTokenOffchain(tokenId)

		return plainToInstance(CreateTokenOffchainResponse, result, {
			excludeExtraneousValues: true
		})
	}

	@Get()
	@ApiBearerAuth()
	@ApiPaginatedResponse(FindTokenResponse)
	@ApiOperation({ summary: "List token" })
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

	@Get("similar")
	@ApiPaginatedResponse(FindSimilarTokenResponse)
	@ApiOperation({ summary: "List token by text (name, ticker)" })
	async pagninateSimliar(@Query() query: FindTokenByTextParams) {
		const { data, maxPage, total } =
			await this.tokensService.paginateSimilar(query)

		return plainToInstance(
			PaginatedResponse<FindSimilarTokenResponse>,
			new PaginatedResponse(data, total, maxPage),
			{
				excludeExtraneousValues: true
			}
		)
	}

	@Get("/sicko-mode")
	@ApiBearerAuth()
	@ApiPaginatedResponse(SickoModeResponse)
	@ApiOperation({ summary: "Latest token in Sicko mode" })
	async findManySickoMode(
		@User() user: Claims | undefined,
		@Query() query: SickoModeParams
	) {
		const {
			tokens: data,
			total,
			maxPage
		} = await this.tokensService.findSickoMode(user?.address, query)

		return plainToInstance(
			PaginatedResponse<SickoModeResponse>,
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

	@Get(":id/chart")
	@ApiResponse({
		status: 200,
		description: "Get chart price token successfully",
		type: ChartResponse
	})
	@ApiOperation({ summary: "Get token price chart" })
	async getChart(@Param("id") id: string, @Query() params: ChartParams) {
		const data = await this.tokensService.getChart(id, params)

		return plainToInstance(
			ChartResponse,
			{ data },
			{
				excludeExtraneousValues: true,
				enableImplicitConversion: true
			}
		)
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

	@Post(":id/onchain")
	@Auth()
	@ApiOperation({ summary: "Create token on blockchain" })
	@ApiResponse({
		status: 201,
		description: "Token created on blockchain successfully",
		type: CreateTokenOnchainResponse
	})
	async createTokenOnchain(
		@Param("id") tokenId: string,
		@Body() payload: CreateTokenOnchainPayload,
		@User() user: Claims
	) {
		const transaction = await this.tokensService.broadcastCreateOnChain({
			creatorAddress: user.address,
			tokenID: tokenId,
			data: payload
		})

		return plainToInstance(
			CreateTokenOnchainResponse,
			{ transaction },
			{
				excludeExtraneousValues: true
			}
		)
	}

	@Put(":id")
	@Auth()
	@ApiOperation({ summary: "Update token" })
	@ApiResponse({
		status: 200,
		description: "Token updated on blockchain successfully",
		type: UpdateBannerResponse
	})
	async updateBanner(
		@Param("id", ParseUUIDPipe) tokenId: string,
		@Body() body: UpdateTokenPayload,
		@User() user: Claims
	) {
		const result = await this.tokensService.updateTokenBanner({
			contentTypeBanner: body.contentTypeBanner,
			tokenId,
			userAddress: user.address
		})
		return plainToInstance(UpdateBannerResponse, result)
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

	@Get(":id/list-holder")
	@ApiOperation({ summary: "Get list of token holders" })
	@ApiResponse({
		status: 200,
		description: "List of token holders retrieved successfully",
		type: TokenHolderResponse
	})
	async getListHolder(@Param("id") address: string) {
		const data = await this.tokensService.getListHolder(address)
		return plainToInstance(TokenHolderResponse, data, {
			excludeExtraneousValues: true
		})
	}

	@Get(":id/transactions")
	@ApiPaginatedResponse(ListTransactionResponse)
	@ApiOperation({ summary: "Get paginated list of token transactions" })
	async getListTransaction(
		@Param("id") id: string,
		@Query() query: ListTransactionParams
	) {
		const { data, total, maxPage } = await this.tokensService.getTransactions(
			id,
			query
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
	@ApiBearerAuth()
	@ApiResponse({
		status: 200,
		description: "Token details retrieved successfully",
		type: FindTokenResponse
	})
	@ApiOperation({ summary: "Get token detail" })
	async find(
		@Param("address") address: string,
		@User() user: Claims | undefined
	) {
		const data = await this.tokensService.getByAddress(address, user?.address)
		return plainToInstance(FindTokenResponse, data, {
			excludeExtraneousValues: true
		})
	}
}
