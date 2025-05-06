import {
	Injectable,
	InternalServerErrorException,
	NotFoundException
} from "@nestjs/common"
import { Decimal } from "@prisma/client/runtime/library"
import { CommentRepository } from "@root/_database/repositories/comment.repository"
import { TokenKeyRepository } from "@root/_database/repositories/token-key.repository"
import { TokenOwnerRepository } from "@root/_database/repositories/token-owner.repository"
import { TokenTransactionRepository } from "@root/_database/repositories/token-transaction.repository"
import { TokenRepository } from "@root/_database/repositories/token.repository"
import { UserRepository } from "@root/_database/repositories/user.repository"
import { TOKEN_TOTAL_SUPPLY_DEFAULT } from "@root/_shared/constants/token"
import { ICreateTokenOnchainPayload } from "@root/_shared/types/token"

import { BN, web3 } from "@coral-xyz/anchor"
import { TokenFavoriteRepository } from "@root/_database/repositories/token-favorite.repository"
import {
	encodeTransaction,
	keypairFromPrivateKey
} from "@root/_shared/helpers/encode-decode-tx"
import { S3Service } from "@root/file/file.service"
import { Ponz } from "@root/programs/ponz/program"
import { InjectConnection } from "@root/programs/programs.module"
import {
	ChartParams,
	CreateTokenPayload,
	FindListTokenFavoriteParams,
	FindTokenParams,
	ListTransactionParams,
	SickoModeParams
} from "@root/tokens/dtos/payload.dto"
import {
	FindFavoriteTokenResponse,
	FindTokenResponse,
	ListTransactionResponse,
	SickoModeResponse
} from "@root/tokens/dtos/response.dto"
import { PublicKey } from "@solana/web3.js"
import { plainToInstance } from "class-transformer"

@Injectable()
export class TokensService {
	constructor(
		private token: TokenRepository,
		private tokenKey: TokenKeyRepository,
		private tokenOwner: TokenOwnerRepository,
		private tokenFavorite: TokenFavoriteRepository,
		private comment: CommentRepository,
		private user: UserRepository,
		private s3Service: S3Service,
		private tokenTransaction: TokenTransactionRepository,
		private ponz: Ponz,
		@InjectConnection() private connection: web3.Connection
	) {}

	// Create token
	async createTokenInCache(
		creatorAddress: string,
		payload: CreateTokenPayload
	) {
		const {
			contentType,
			description,
			name,
			ticker,
			rewardTax,
			burnTax,
			jackpotTax,
			jackpotAmount,
			telegramLink,
			twitterLink,
			websiteLink,
			instagramLink,
			youtubeLink,
			tiktokLink,
			onlyFansLink
		} = payload

		const [tokenKey, user] = await Promise.all([
			this.tokenKey.findOneUnPicked(),
			this.user.findByAddress(creatorAddress)
		])

		if (!tokenKey) {
			throw new NotFoundException("Not found pair of key")
		}

		if (!user) {
			throw new NotFoundException("Not found user")
		}

		const data = {
			description,
			name,
			ticker,
			tax: rewardTax + jackpotTax + burnTax,
			metadata: {},
			rewardTax,
			burnTax,
			jackpotTax,
			jackpotAmount,
			telegramLink,
			twitterLink,
			websiteLink,
			instagramLink,
			youtubeLink,
			tiktokLink,
			onlyFansLink,
			uri: "",
			imageUri: "",
			tokenKey: { connect: { publicKey: tokenKey.publicKey } },
			creator: { connect: { address: creatorAddress } }
		}

		// Create token
		return this.token.createInCache({
			dataCreate: data,
			tokenKeyId: tokenKey.id,
			contentType,
			getTickerPresignedUrl: this.getTickerPresignedUrl.bind(this)
		})
	}

	async createTokenOffchain(id: string) {
		return this.token.createOffchain({
			id,
			postMetadataToS3: this.postMetadataToS3.bind(this),
			checkFileExist: this.checkFileExist.bind(this)
		})
	}

	async checkFileExist(uri: string): Promise<boolean> {
		try {
			const response = await fetch(uri, { method: "HEAD" })
			return response.ok
		} catch (error) {
			throw new InternalServerErrorException(error)
		}
	}

	async broadcastCreateOnChain(payload: ICreateTokenOnchainPayload) {
		const token = await this.token.findWithPrivateKey(payload.tokenID)
		if (!token) throw new NotFoundException("not found token")

		if (token.bump)
			throw new InternalServerErrorException("token already create")

		const tokenKeypair = keypairFromPrivateKey(token.tokenKey.privateKey)
		const transferFeeBasisPoints = (token.tax * 100) as number // 1% = 100
		const maximumFee = new BN("1000000000000000")
		const tokenMetadata = {
			name: token.name,
			symbol: token.ticker,
			uri: token.uri,
			transferFeeBasisPoints,
			maximumFee
		}

		let tx: web3.Transaction
		try {
			tx = await this.ponz.lauchToken(
				tokenMetadata,
				new PublicKey(token.address),
				new PublicKey(payload.creatorAddress),
				tokenKeypair,
				payload.data
			)
		} catch (error) {
			throw new InternalServerErrorException(
				`Failed to create transaction, ${error}`
			)
		}

		return encodeTransaction(tx)
	}

	find(
		userAddress: string | undefined,
		params: FindTokenParams
	): Promise<{ tokens: FindTokenResponse[]; total: number; maxPage: number }> {
		return this.token.find(userAddress, params).then(result => ({
			tokens: plainToInstance(FindTokenResponse, result.tokens, {
				excludeExtraneousValues: true,
				enableImplicitConversion: true
			}),
			total: result.total,
			maxPage: result.maxPage
		}))
	}

	findSickoMode(
		userAddress: string | undefined,
		params: SickoModeParams
	): Promise<{ tokens: SickoModeResponse[]; total: number; maxPage: number }> {
		return this.token.findSickoMode(userAddress, params).then(result => ({
			tokens: plainToInstance(SickoModeResponse, result.tokens, {
				excludeExtraneousValues: true,
				enableImplicitConversion: true
			}),
			total: result.total,
			maxPage: result.maxPage
		}))
	}

	//   Get image url & authorize data to push image Aws3
	async getTickerPresignedUrl(tokenId: string, contentType: string) {
		const key = `token-image-${tokenId}`
		const { fields, url } = await this.s3Service.postPresignedSignedUrl(
			key,
			contentType
		)
		if (!url || !fields)
			throw new InternalServerErrorException("Can not post presigned url")
		const imageUri = `${url}${fields.key}`
		return {
			imageUri,
			url,
			fields
		}
	}

	//   Get image url & authorize data to push image Aws3
	async postMetadataToS3(tokenId: string, metadata: Object): Promise<boolean> {
		const key = `token-metadata-${tokenId}.json`
		const { success } = await this.s3Service.uploadJsonFile(key, metadata)
		if (!success)
			throw new InternalServerErrorException("Can not post metadata")
		return success
	}

	/*  Get detail token by address (public key)
    - percent of King of Hill: its marketCap / highest marketcap of token (is not bonding curve)
    - percent of Bonding Curve: its marketCap / bondingCurve
  */
	async getByAddress(address: string, userAddress?: string) {
		const token = await this.token.findByAddress(address)
		if (!token) throw new NotFoundException("Not found token")

		const [tokenKingOfHill, totalReplies, favoriteToken] = await Promise.all([
			this.token.findKingOfHill(),
			this.comment.countByTokenId({ where: { tokenId: token.id } }),
			userAddress
				? this.tokenFavorite.findOne({ tokenAddress: address, userAddress })
				: Promise.resolve(null)
		])

		const VIRTUAL_DEFAULT_VALUE_OF_MARKETCAP = 28

		let percentOfBondingCurve: null | Decimal = null // Null is still off chain
		let percentOfKingOfHill: null | Decimal = null // Null is still off chain

		if (token.bondingCurveTarget) {
			percentOfBondingCurve = new Decimal(token.marketCapacity)
				.minus(VIRTUAL_DEFAULT_VALUE_OF_MARKETCAP)
				.div(token.bondingCurveTarget)
				.mul(100)
		}

		if (tokenKingOfHill && !token.isCompletedKingOfHill) {
			percentOfKingOfHill = new Decimal(token.marketCapacity)
				.div(tokenKingOfHill.marketCapacity)
				.mul(100)
		}

		if (token.isCompletedKingOfHill)
			percentOfKingOfHill = new Decimal(1).mul(100)

		return {
			...token,
			totalSupply: token.totalSupply.toNumber(),
			marketCapacity: token.marketCapacity.toNumber(),
			totalReplies,
			percentOfBondingCurve,
			percentOfKingOfHill,
			isFavorite: !!favoriteToken
		}
	}

	// Get list similar token (lte market cap)
	async getListSimilar(address: string) {
		const token = await this.token.findByAddress(address)
		if (!token) throw new NotFoundException("Not found token")

		const listToken = await this.token.findSimilar(
			token.marketCapacity.toNumber()
		)

		const data = await Promise.all(
			listToken.map(async token => {
				const totalReplies = await this.comment.countByTokenId({
					where: { tokenId: token.id }
				})
				return {
					...token,
					totalReplies
				}
			})
		)

		return data
	}

	// Get list holder
	async getListHolder(address: string) {
		const token = await this.token.findByAddress(address)
		if (!token) throw new NotFoundException("Not found token")
		let listHolder = await this.tokenOwner.findListHolder({
			tokenAddress: address
		})
		listHolder = listHolder.map(tokenOwner => {
			const percentOfKeeper = tokenOwner.amount
				.div(TOKEN_TOTAL_SUPPLY_DEFAULT)
				.mul(100)
			return {
				...tokenOwner,
				percentOfKeeper
			}
		})

		return listHolder
	}

	// Get list transaction
	async getTransactions(id: string, query: ListTransactionParams) {
		return this.tokenTransaction.paginate(id, query).then(result => ({
			data: plainToInstance(ListTransactionResponse, result.data, {
				excludeExtraneousValues: true,
				enableImplicitConversion: true
			}),
			total: result.total,
			maxPage: result.maxPage
		}))
	}

	async getChart(id: string, params: ChartParams) {
		const token = await this.token.findById(id)
		if (!token) throw new NotFoundException("not found token")

		const chartData = await this.tokenTransaction.getChart({
			pubkey: token.address,
			from: params.from,
			to: params.to,
			step: params.step
		})

		return chartData
	}

	//   Toggle (add or remove favourite token of user)
	async toggleFavorite(tokenAddress: string, userAddress: string) {
		const token = await this.token.findByAddress(tokenAddress)
		if (!token) throw new NotFoundException("Not found token")

		const favoriteToken = await this.tokenFavorite.findOne({
			tokenAddress,
			userAddress
		})

		if (favoriteToken) {
			await this.tokenFavorite.delete({ tokenAddress, userAddress })
			return { message: "Delete favorite token succesfully" }
		}
		await this.tokenFavorite.create({
			token: { connect: { address: tokenAddress } },
			user: { connect: { address: userAddress } }
		})

		return { message: "Add  favorite token succesfully" }
	}

	//   Paginate favorite tokens
	async getListFavorite(
		userAddress: string,
		query: FindListTokenFavoriteParams
	) {
		const result = await this.tokenFavorite.find({ ...query, userAddress })
		return {
			total: result.total,
			maxPage: result.maxPage,
			tokens: plainToInstance(FindFavoriteTokenResponse, result.tokens, {
				excludeExtraneousValues: true,
				enableImplicitConversion: true
			})
		}
	}

	async getTrendingTopics() {
		const listToken = await this.token.findLatest(100)
		const wordCount: Record<string, number> = {}

		for (const token of listToken) {
			const content = `${token.name} ${token.ticker} ${token.description}`
			const words = content
				.toLowerCase()
				.replace(/[^a-z0-9\s]/g, "") // loại bỏ ký tự đặc biệt
				.split(/\s+/)
				.filter(word => word.length > 2) // bỏ qua từ ngắn

			for (const word of words) {
				wordCount[word] = (wordCount[word] || 0) + 1
			}
		}

		// Sắp xếp theo số lần xuất hiện giảm dần
		const sorted = Object.entries(wordCount)
			.sort((a, b) => b[1] - a[1])
			.map(([word, count]) => ({ word, count }))

		return { data: sorted.slice(0, 5).map(item => item.word) }
	}
}
