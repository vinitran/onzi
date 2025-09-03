import {
	Body,
	ClassSerializerInterceptor,
	Controller,
	Delete,
	Get,
	Param,
	ParseUUIDPipe,
	Post,
	Put,
	Query,
	SerializeOptions,
	UseInterceptors
} from "@nestjs/common"
import {
	ApiBearerAuth,
	ApiOperation,
	ApiResponse,
	ApiTags
} from "@nestjs/swagger"
import { Auth } from "@root/_shared/utils/decorators"
import { GetSummaryTokensDto } from "@root/admin/dtos/payload.dto"
import { Claims } from "@root/auth/auth.service"
import {
	ApiPaginatedResponse,
	Paginate as PaginatedResponse
} from "@root/dtos/common.dto"
import { TokenKeyWithHeld } from "@root/dtos/token-key-with-held.dto"
import {
	ChartParams,
	CreateTokenOnchainPayload,
	CreateTokenPayload,
	FindListTokenFavoriteParams,
	FindTokenByTextParams,
	FindTokenParams,
	ListTransactionParams,
	PaginateDistributionPayload,
	SickoModeParams,
	SignedTxPayload,
	UpdateTokenPayload
} from "@root/tokens/dtos/payload.dto"
import {
	ChartResponse,
	CreateTokenInCacheResponse,
	CreateTokenOffchainResponse,
	CreateTokenOnchainResponse,
	FindSimilarTokenResponse,
	FindTokenResponse,
	GetSummaryTokensResponse,
	ListTransactionResponse,
	PaginateFavoriteTokenResponse,
	PaginateSickoModeResponse,
	PaginateTokenResponse,
	PaginateTransactionDistributeResponse,
	SimilarTokenResponse,
	ToggleFavoriteTokenResponse,
	TokenHolderResponse,
	TokenResponse,
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
	async createOffchain(
		@Param("id", new ParseUUIDPipe({ version: "4" })) tokenId: string
	) {
		const result = await this.tokensService.createTokenOffchain(tokenId)

		return plainToInstance(CreateTokenOffchainResponse, result, {
			excludeExtraneousValues: true
		})
	}

	@Delete(":id/offchain")
	@Auth()
	@ApiOperation({ summary: "Delete an off-chain token" })
	@ApiResponse({
		status: 204,
		description: "Delete token off-chain successfully"
	})
	async deleteOffchain(
		@Param("id", new ParseUUIDPipe({ version: "4" })) tokenId: string,
		@User("address") userAddress: string
	) {
		await this.tokensService.deleteTokenOffchain(tokenId, userAddress)
		return {
			message: "Delete token successfully"
		}
	}

	@Get()
	@ApiBearerAuth()
	@ApiOperation({ summary: "List token" })
	@ApiResponse({
		status: 200,
		description: "Paginate tokens successfully",
		type: PaginateTokenResponse
	})
	@UseInterceptors(ClassSerializerInterceptor)
	@SerializeOptions({
		type: PaginateTokenResponse,
		enableImplicitConversion: true,
		excludeExtraneousValues: true
	})
	async findMany(
		@User() user: Claims | undefined,
		@Query() query: FindTokenParams
	) {
		return this.tokensService.find(user?.address, query)
	}

	@Get("/summary")
	@ApiOperation({ summary: "Get summary tokens" })
	@ApiResponse({
		status: 200,
		description: "Get summary tokens successfully",
		type: GetSummaryTokensResponse,
		isArray: true
	})
	async getSummary(@Query() query: GetSummaryTokensDto) {
		const result = await this.tokensService.getSummaryTokens(query)
		return plainToInstance(GetSummaryTokensResponse, result, {
			excludeExtraneousValues: true
		})
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
	@ApiOperation({ summary: "Latest token in Sicko mode" })
	@ApiResponse({
		status: 200,
		type: PaginateSickoModeResponse,
		description: "Paginate sicko mode tokens successfully"
	})
	@UseInterceptors(ClassSerializerInterceptor)
	@SerializeOptions({
		type: PaginateSickoModeResponse,
		enableImplicitConversion: true,
		excludeExtraneousValues: true
	})
	async findManySickoMode(
		@User() user: Claims | undefined,
		@Query() query: SickoModeParams
	) {
		return this.tokensService.findSickoMode(user?.address, query)
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

	@Get("/:id/token-with-held")
	@ApiOperation({ summary: "Get token keyHeld" })
	@ApiResponse({
		status: 200,
		description: "Get token keyHeld successfully",
		type: TokenKeyWithHeld
	})
	async getTokenWithHeld(
		@Param("id", new ParseUUIDPipe({ version: "4" })) tokenId: string
	) {
		const result = await this.tokensService.getTokenWithHeld(tokenId)
		return plainToInstance(TokenKeyWithHeld, result, {
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
	async getChart(
		@Param("id", new ParseUUIDPipe({ version: "4" })) id: string,
		@Query() params: ChartParams
	) {
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
	@Get("favorite")
	@ApiOperation({ summary: "Paginate list favorite token" })
	@ApiResponse({
		status: 200,
		type: PaginateFavoriteTokenResponse,
		description: "Paginate favorite tokens successfully"
	})
	@UseInterceptors(ClassSerializerInterceptor)
	@SerializeOptions({
		type: PaginateFavoriteTokenResponse,
		enableImplicitConversion: true,
		excludeExtraneousValues: true
	})
	async paginateFavouriteToken(
		@Query() query: FindListTokenFavoriteParams,
		@User() user: Claims
	) {
		return this.tokensService.getListFavorite(user.address, query)
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
		@Param("id", new ParseUUIDPipe({ version: "4" })) tokenId: string,
		@Body() payload: CreateTokenOnchainPayload,
		@User() user: Claims
	) {
		const transaction = await this.tokensService.createTxTokenCreation({
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

	@Post(":id/broadcast")
	@Auth()
	@ApiOperation({ summary: "broadcast token on blockchain" })
	@ApiResponse({
		status: 201,
		description: "broadcast Token on blockchain successfully",
		type: CreateTokenOnchainResponse
	})
	async broadcastOnchain(
		@Param("id", new ParseUUIDPipe({ version: "4" })) tokenId: string,
		@Body() payload: SignedTxPayload,
		@User() user: Claims
	) {
		const transaction = await this.tokensService.submitSignedTxAndSign({
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
		@Param("id", new ParseUUIDPipe({ version: "4" })) tokenId: string,
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
	async getListHolder(
		@Param("id", new ParseUUIDPipe({ version: "4" })) id: string
	) {
		const data = await this.tokensService.getListHolder(id)
		return plainToInstance(TokenHolderResponse, data, {
			excludeExtraneousValues: true
		})
	}

	@Get(":id/transactions")
	@ApiPaginatedResponse(ListTransactionResponse)
	@ApiOperation({ summary: "Get paginated list of token transactions" })
	async getListTransaction(
		@Param("id", new ParseUUIDPipe({ version: "4" })) id: string,
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

	@Get(":id/jackpot-progress")
	@ApiOperation({ summary: "Get paginated list of token transactions" })
	async getJackpotProgress(
		@Param("id", new ParseUUIDPipe({ version: "4" })) id: string
	) {
		const data = await this.tokensService.getJackpotProgress(id)

		return plainToInstance(TokenResponse, data, {
			excludeExtraneousValues: true
		})
	}

	@Get(":id/distribute-transactions")
	@ApiOperation({
		summary: "Get paginated list of token distributed transactions"
	})
	@ApiResponse({
		status: 200,
		description: "Get list reel reports in a reel successfully",
		type: PaginateTransactionDistributeResponse
	})
	@UseInterceptors(ClassSerializerInterceptor)
	@SerializeOptions({
		type: PaginateTransactionDistributeResponse,
		excludeExtraneousValues: true,
		enableImplicitConversion: true
	})
	async getListDistributeTransaction(
		@Param("id", new ParseUUIDPipe({ version: "4" })) id: string,
		@Query() query: PaginateDistributionPayload
	) {
		return this.tokensService.paginateTxDistribute(id, query)
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

	@Delete(":id/banner")
	@Auth()
	@ApiOperation({ summary: "Delete banner of token" })
	@ApiResponse({
		status: 204,
		description: "Banner deleted successfully"
	})
	async deleteBanner(
		@Param("id", new ParseUUIDPipe({ version: "4" })) tokenId: string,
		@User() user: Claims
	) {
		await this.tokensService.deleteBanner(tokenId, user.address)
		return {
			message: "Delete banner successfully"
		}
	}

	@Get(":id")
	@ApiBearerAuth()
	@ApiResponse({
		status: 200,
		description: "Token details retrieved successfully",
		type: FindTokenResponse
	})
	@ApiOperation({ summary: "Get token detail" })
	async find(
		@Param("id", new ParseUUIDPipe({ version: "4" })) id: string,
		@User() user: Claims | undefined
	) {
		const data = await this.tokensService.getById(id, user?.address)
		return plainToInstance(FindTokenResponse, data, {
			excludeExtraneousValues: true
		})
	}
}
