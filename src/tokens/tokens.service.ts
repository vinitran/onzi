import {
	BadRequestException,
	ForbiddenException,
	Injectable,
	InternalServerErrorException,
	NotFoundException
} from "@nestjs/common"
import { CommentRepository } from "@root/_database/repositories/comment.repository"
import { TokenKeyRepository } from "@root/_database/repositories/token-key.repository"
import { TokenTransactionRepository } from "@root/_database/repositories/token-transaction.repository"
import { TokenRepository } from "@root/_database/repositories/token.repository"
import { UserRepository } from "@root/_database/repositories/user.repository"
import {
	IBroadcastOnchainPayload,
	ICreateTokenOnchainPayload
} from "@root/_shared/types/token"

import { createHash } from "node:crypto"
import { BN, web3 } from "@coral-xyz/anchor"
import { Prisma, Token } from "@prisma/client"
import { Decimal } from "@prisma/client/runtime/library"
import { TokenChartRepository } from "@root/_database/repositories/token-candle.repository"
import { TokenFavoriteRepository } from "@root/_database/repositories/token-favorite.repository"
import { TokenKeyWithHeldRepository } from "@root/_database/repositories/token-key-with-held.repository"
import { TokenOwnerRepository } from "@root/_database/repositories/token-owner.repository"
import { TokenTransactionDistributeRepository } from "@root/_database/repositories/token-tx-distribute"
import { RabbitMQService } from "@root/_rabbitmq/rabbitmq.service"
import { RedisService } from "@root/_redis/redis.service"
import { STOP_WORDS, TOKEN_SUMMARY_OPTION } from "@root/_shared/constants/token"
import {
	encodeTransaction,
	keypairFromPrivateKey
} from "@root/_shared/helpers/encode-decode-tx"
import { GetSummaryTokensDto } from "@root/admin/dtos/payload.dto"
import { S3Service } from "@root/file/file.service"
import { REWARD_DISTRIBUTOR_EVENTS } from "@root/jobs/tokens/token.job"
import { Ponz } from "@root/programs/ponz/program"
import { PonzVault } from "@root/programs/vault/program"
import {
	ChartParams,
	CreateTokenPayload,
	FindListTokenFavoriteParams,
	FindTokenByTextParams,
	FindTokenParams,
	ListTransactionParams,
	PaginateDistributionPayload,
	SickoModeParams,
	UpdateTokenPayload
} from "@root/tokens/dtos/payload.dto"
import {
	FindSimilarTokenResponse,
	ListTransactionResponse
} from "@root/tokens/dtos/response.dto"
import { ChartGateway } from "@root/tokens/token.gateway"
import {
	ComputeBudgetProgram,
	Message,
	PublicKey,
	VersionedTransaction
} from "@solana/web3.js"
import bs58 from "bs58"
import { plainToInstance } from "class-transformer"
import nacl from "tweetnacl"

@Injectable()
export class TokensService {
	constructor(
		private token: TokenRepository,
		private tokenKey: TokenKeyRepository,
		private tokenOwner: TokenOwnerRepository,
		private tokenFavorite: TokenFavoriteRepository,
		private redis: RedisService,
		private comment: CommentRepository,
		private user: UserRepository,
		private s3Service: S3Service,
		private tokenTransaction: TokenTransactionRepository,
		private tokenChart: TokenChartRepository,
		private tokenTxDistribute: TokenTransactionDistributeRepository,
		private ponz: Ponz,
		private ponzVault: PonzVault,
		private chartSocket: ChartGateway,
		private readonly tokenKeyWithHeld: TokenKeyWithHeldRepository,
		private readonly rabbitMQService: RabbitMQService
	) {}

	private cacheInCreationTx(tokenAddress: string, userAddress: string) {
		return `creation-token:${tokenAddress}, ${userAddress}`
	}

	// Create token
	async createTokenInCache(
		creatorAddress: string,
		payload: CreateTokenPayload
	) {
		const {
			contentType,
			description = " ",
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
		await this.tokenKeyWithHeld.createIfNotExist(id)

		return this.token.createOffchain({
			id,
			postMetadataToS3: this.postMetadataToS3.bind(this),
			checkFileExist: this.checkFileExist.bind(this)
		})
	}

	async deleteTokenOffchain(id: string, userAddress: string) {
		const token = await this.token.findById(id)
		if (!token) throw new NotFoundException("Not found token")
		if (token.creatorAddress !== userAddress)
			throw new ForbiddenException("Only creator have permission to remove")
		await this.token.deleteOffChain(id)
		await this.s3Service.deleteFile(this.s3Service.getKeyS3(token.imageUri))
	}

	async checkFileExist(uri: string): Promise<boolean> {
		try {
			const response = await fetch(uri, { method: "HEAD" })
			return response.ok
		} catch (error) {
			throw new InternalServerErrorException(error)
		}
	}

	/**
	 * Fingerprint a legacy Message buffer by removing ComputeBudget instructions
	 * and hashing {recentBlockhash, instructions[{programId, accounts[], dataB58}]}
	 * Returns a short hex string for quick equality checks.
	 */
	private legacyMessageFingerprint(buf: Uint8Array): string {
		const msg = Message.from(buf)

		const items = msg.instructions
			.filter(
				ix =>
					!msg.accountKeys[ix.programIdIndex].equals(
						ComputeBudgetProgram.programId
					)
			)
			.map(ix => ({
				programId: msg.accountKeys[ix.programIdIndex].toBase58(),
				accounts: ix.accounts.map(i => msg.accountKeys[i].toBase58()),
				dataB58:
					typeof (ix as any).data === "string"
						? (ix as any).data
						: bs58.encode((ix as any).data as Uint8Array)
			}))
		const payload = JSON.stringify({
			recentBlockhash: msg.recentBlockhash,
			instructions: items
		})
		const hash = createHash("sha256").update(payload).digest("hex")
		return hash
	}

	ctEqual(a: Uint8Array, b: Uint8Array) {
		if (a.length !== b.length) return false
		let d = 0
		for (let i = 0; i < a.length; i++) d |= a[i] ^ b[i]
		return d === 0
	}

	async submitSignedTxAndSign(payload: IBroadcastOnchainPayload) {
		// 1) Retrieve and check cache (message built by the backend)
		const cacheKey = this.cacheInCreationTx(
			payload.tokenID,
			payload.creatorAddress
		)
		const cachedMsgBase58 = await this.redis.get(cacheKey)
		if (!cachedMsgBase58) {
			throw new InternalServerErrorException({
				code: "TX_EXPIRED",
				message: "Transaction has expired or was not found"
			})
		}
		const cachedMsg = bs58.decode(cachedMsgBase58)

		// 2) Parse the transaction sent by the frontend (VersionedTransaction signed by the frontend)
		let userTx: VersionedTransaction
		try {
			userTx = VersionedTransaction.deserialize(
				bs58.decode(payload.data.transaction)
			)
		} catch (_e) {
			throw new BadRequestException({
				code: "TX_PARSE_ERROR",
				message: "Failed to parse transaction encoding"
			})
		}
		const userMsg = userTx.message.serialize() // v0 message bytes

		// 3) Compare fingerprints (excluding ComputeBudget) to verify logic is unchanged
		try {
			const fUser = this.legacyMessageFingerprint(userMsg)
			const fCached = this.legacyMessageFingerprint(cachedMsg)
			if (fUser !== fCached) {
				throw new ForbiddenException({
					code: "TX_MISMATCH",
					message:
						"The submitted transaction does not match the server-built transaction"
				})
			}
		} catch (_e) {
			// If unable to parse legacy message, fallback to byte-to-byte comparison
			const same = this.ctEqual(userMsg, cachedMsg)
			if (!same) {
				throw new ForbiddenException({
					code: "TX_MISMATCH",
					message:
						"The submitted transaction does not match the server-built transaction"
				})
			}
		}

		// 4) Verify the creator's signature on userMsg
		const creatorPk = new PublicKey(payload.creatorAddress)
		const signerIndex = userTx.message.staticAccountKeys.findIndex(k =>
			k.equals(creatorPk)
		)
		if (signerIndex < 0) {
			throw new ForbiddenException({
				code: "SIG_MISSING",
				message: "Creator signature is missing from the transaction"
			})
		}
		const sig = userTx.signatures[signerIndex]
		if (!sig) {
			throw new ForbiddenException({
				code: "SIG_MISSING",
				message: "Creator signature is missing from the transaction"
			})
		}
		const ok = nacl.sign.detached.verify(userMsg, sig, creatorPk.toBytes())
		if (!ok) {
			throw new ForbiddenException({
				code: "SIG_INVALID",
				message: "Creator signature is invalid"
			})
		}

		// 5) Server applies its own signature (required signer)
		const token = await this.token.findWithPrivateKey(payload.tokenID)
		if (!token) {
			throw new NotFoundException({
				code: "TOKEN_NOT_FOUND",
				message: "Associated token not found"
			})
		}
		const tokenKeypair = keypairFromPrivateKey(token.tokenKey.privateKey)
		try {
			userTx.sign([tokenKeypair])
		} catch (_e) {
			throw new InternalServerErrorException({
				code: "SERVER_SIGN_FAILED",
				message: "Server failed to apply its signature"
			})
		}

		// 6) Delete cache to prevent replay attacks
		await this.redis.del(cacheKey)

		return bs58.encode(userTx.serialize())
	}

	async createTxTokenCreation(payload: ICreateTokenOnchainPayload) {
		const token = await this.token.findWithPrivateKey(payload.tokenID)
		if (!token) throw new NotFoundException("not found token")

		if (token.bump)
			throw new InternalServerErrorException("token already create")

		const maximumFee = new BN("1000000000000000")
		const tokenMetadata = {
			name: token.name,
			symbol: token.ticker,
			uri: token.uri,
			transferFeeBasisPoints: token.tax,
			maximumFee
		}

		const keyWithHeld = await this.tokenKeyWithHeld.createIfNotExist(
			payload.tokenID
		)

		let tx: web3.Transaction
		try {
			tx = await this.ponz.lauchToken(
				tokenMetadata,
				new PublicKey(token.address),
				new PublicKey(payload.creatorAddress),
				new PublicKey(keyWithHeld.publicKey),
				payload.data
			)
		} catch (error) {
			throw new InternalServerErrorException(
				`Failed to create transaction, ${error}`
			)
		}

		await this.rabbitMQService.emit(
			"distribute-reward-distributor",
			REWARD_DISTRIBUTOR_EVENTS.SEND_FEE_SOL,
			{
				to: keyWithHeld.publicKey.toString()
			}
		)

		const encodeTx = encodeTransaction(tx)
		const base58Message = bs58.encode(tx.serializeMessage())
		await this.redis.set(
			this.cacheInCreationTx(payload.tokenID, payload.creatorAddress),
			base58Message,
			20
		)

		return encodeTx
	}

	find(userAddress: string | undefined, params: FindTokenParams) {
		if (params.lastTrade) {
			return this.token.findTokenWithLatestTransaction(params, userAddress)
		}

		if (params.cooking) {
			return this.token.findTokenWithLatestTransaction(
				params,
				userAddress,
				"Buy"
			)
		}

		return this.token.find(userAddress, params)
	}

	async findSickoMode(
		userAddress: string | undefined,
		params: SickoModeParams
	) {
		const { data, maxPage, total } = await this.token.findSickoMode(
			params,
			userAddress
		)

		const finalData = await Promise.all(
			data.map(async token => {
				const creatorAddress = token.creatorAddress
				const listRealOwners = await this.token.getRealTokenOwners({
					excludeAddresses: [],
					tokenAddress: token.address
				})

				// Get percent hold of Top 10 holders
				const amountTokenOfTop10Holder = listRealOwners.reduce(
					(acc, holder) => {
						return new Decimal(holder.amount.toString()).add(acc).toNumber()
					},
					0
				)

				const top10HoldersPercentage =
					token.marketCapacity > 0
						? new Decimal(amountTokenOfTop10Holder)
								.div(token.totalSupply.toString())
								.mul(100)
								.toNumber()
						: 0

				// Get percent hold of creator
				const creatorHolder =
					listRealOwners.find(
						owner => owner.userAddress === token.creatorAddress
					) &&
					(await this.tokenOwner.findTokenOwner(creatorAddress, token.address))

				const devHolderPercentage = new Decimal(
					creatorHolder?.amount.toString() ?? 0
				)
					.div(token.totalSupply.toString())
					.mul(100)
					.toNumber()

				return {
					...token,
					totalOwner: listRealOwners.length,
					top10HoldersPercentage,
					devHolderPercentage
				}
			})
		)

		return {
			data: finalData,
			maxPage,
			total
		}
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

	async getByAddress(address: string, userAddress?: string) {
		const include: Prisma.TokenInclude = {
			_count: {
				select: {
					comments: true
				}
			},
			tokenOwners: userAddress
				? {
						select: {
							userAddress: true,
							amount: true
						},
						where: { userAddress }
					}
				: false,
			tokenFavorite: userAddress
				? {
						select: {
							userAddress: true
						},
						where: { userAddress }
					}
				: false
		}

		const token = await this.token.findByAddress(address, include)

		if (!token) throw new NotFoundException("Not found token")

		return {
			...token,
			tokenOwners: undefined,
			tokenFavorite: undefined,
			isFavorite: userAddress ? token.tokenFavorite.length > 0 : false,
			balance: userAddress ? token.tokenOwners[0].amount : 0
		}
	}

	async getById(id: string, userAddress?: string) {
		const include: Prisma.TokenInclude = {
			_count: {
				select: {
					comments: true
				}
			},
			tokenOwners: userAddress
				? {
						select: {
							userAddress: true,
							amount: true
						},
						where: { userAddress }
					}
				: false,
			tokenFavorite: userAddress
				? {
						select: {
							userAddress: true
						},
						where: { userAddress }
					}
				: false
		}

		const token = await this.token.findById(id, include)

		if (!token) throw new NotFoundException("Not found token")

		return {
			...token,
			tokenOwners: undefined,
			tokenFavorite: undefined,
			isFavorite: userAddress ? token.tokenFavorite.length > 0 : false,
			balance:
				userAddress && token.tokenOwners.length > 0
					? token.tokenOwners[0].amount
					: 0
		}
	}

	// Get list similar token (lte market cap)
	async getListSimilar(address: string) {
		const token = await this.token.findByAddress(address)
		if (!token) throw new NotFoundException("Not found token")

		const listToken = await this.token.findSimilar(token.marketCapacity)

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
	async getListHolder(id: string) {
		const token = await this.token.findById(id, {
			tokenOwners: {
				select: {
					amount: true,
					user: {
						select: {
							avatarUrl: true,
							address: true,
							username: true,
							id: true
						}
					}
				}
			}
		})
		if (!token) throw new NotFoundException("Not found token")

		return {
			address: token.address,
			totalSupply: token.totalSupply,
			tokenOwners: token.tokenOwners
		}
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
		return this.tokenChart.getChartData(id, params.step, params.from, params.to)
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
		return this.tokenFavorite.find({ ...query, userAddress })
	}

	async getTrendingTopics() {
		const listToken = await this.token.findLatest(100)
		if (!listToken || listToken.length === 0) return { data: [] }

		const wordCount: Record<string, number> = {}

		for (const token of listToken) {
			const content = `${token.name} ${token.ticker}`
			const words = content
				.toLowerCase()
				.replace(/[^a-z0-9\s]/g, "")
				.split(/\s+/)
				.filter(word => word.length > 2 && !STOP_WORDS.has(word))

			for (const word of words) {
				wordCount[word] = (wordCount[word] || 0) + 1
			}
		}

		const sorted = Object.entries(wordCount)
			.sort((a, b) => b[1] - a[1])
			.map(([word, count]) => ({ word, count }))

		if (sorted.length > 0) {
			return this.redis.getOrSet(
				"trending-topics",
				async () => {
					return { data: sorted.slice(0, 5).map(item => item.word) }
				},
				60
			)
		}
		return { data: sorted.slice(0, 5).map(item => item.word) }
	}

	//   Get tokens: name, ticker
	async paginateSimilar(payload: FindTokenByTextParams) {
		const { data, ...rest } = await this.token.paginateSimilar(payload)

		return {
			data: plainToInstance(FindSimilarTokenResponse, data, {
				excludeExtraneousValues: true,
				enableImplicitConversion: true
			}),
			...rest
		}
	}

	//   Update banner
	async updateTokenBanner(
		payload: { tokenId: string; userAddress: string } & UpdateTokenPayload
	) {
		const { contentTypeBanner, tokenId, userAddress } = payload
		const token = await this.token.findById(tokenId)
		if (!token) throw new NotFoundException("Not found token")

		if (token.creatorAddress !== userAddress)
			throw new ForbiddenException("Only token creator allows to add banner")

		const { bannerUri, fields, url } = await this.getBannerPresignedUrl(
			tokenId,
			contentTypeBanner
		)

		await this.token.addBanner(tokenId, bannerUri)

		return {
			fields,
			url
		}
	}

	// Delete banner
	async deleteBanner(tokenId: string, userAddress: string) {
		const token = await this.token.findById(tokenId)
		if (!token) throw new NotFoundException("Not found token")
		if (token.creatorAddress !== userAddress)
			throw new ForbiddenException("Only token creator allows to delete banner")
		if (!token.bannerUri) throw new NotFoundException("Not found banner uri")
		await this.token.deleteBanner(tokenId)
		// Delete image in s3
		await this.s3Service.deleteFile(this.s3Service.getKeyS3(token.bannerUri))
	}

	async getTokenWithHeld(id: string) {
		const keyWithHeld = await this.tokenKeyWithHeld.findAddress(id)
		if (!keyWithHeld) throw new NotFoundException("Not found token")

		return keyWithHeld
	}

	// Get latest max 100 tokens with
	/*
	- Popular: tokens are ordred highlight by admin
	- Hall of fame: tokens are sticked HOF
	*/
	async getSummaryTokens({ option }: GetSummaryTokensDto) {
		let tokens: Token[] = []
		switch (option) {
			case TOKEN_SUMMARY_OPTION.POPULAR:
				tokens = await this.token.findPopular()
				break
			case TOKEN_SUMMARY_OPTION.HALL_OF_FAME:
				tokens = await this.token.findHallOfFame()
				break
			default:
				return []
		}
		tokens = await Promise.all(
			tokens.map(async token => {
				const totalComment = await this.comment.getTotalByTokenId(token.id)
				return {
					...token,
					totalComment
				}
			})
		)

		return tokens
	}

	async paginateTxDistribute(
		tokenId: string,
		payload: PaginateDistributionPayload
	) {
		return this.tokenTxDistribute.paginateByToken(tokenId, payload)
	}

	//   Get image url & authorize data to push image Aws3
	async getBannerPresignedUrl(tokenId: string, contentType: string) {
		const key = `token-banner-${tokenId}`
		const { fields, url } = await this.s3Service.postPresignedSignedUrl(
			key,
			contentType
		)
		if (!url || !fields)
			throw new InternalServerErrorException("Can not post presigned url")
		const bannerUri = `${url}${fields.key}`
		return {
			bannerUri,
			url,
			fields
		}
	}

	async socketNewCandle(address: string, date: number) {
		const newCandle = await this.tokenChart.getLatestCandles(address, date)
		for (const candle of newCandle) {
			this.chartSocket.emitNewCandle({
				tokenId: candle.token.id,
				step: candle.step,
				date: candle.date.toString(),
				open: candle.open.toString(),
				high: candle.high.toString(),
				low: candle.low.toString(),
				close: candle.close.toString(),
				volume: candle.volume.toString()
			})
		}
	}
}
