import {
	Injectable,
	InternalServerErrorException,
	NotFoundException
} from "@nestjs/common"
import { Prisma, RaydiumStatusType } from "@prisma/client"
import { DefaultArgs } from "@prisma/client/runtime/library"
import { RedisService } from "@root/_redis/redis.service"
import {
	ICreateTokenInCache,
	ICreateTokenOffchain
} from "@root/_shared/types/token"
import {
	PaginateReportedTokensDto,
	UpdateTokenItemDto
} from "@root/admin/dtos/payload.dto"
import {
	FindTokenParams,
	SickoModeParams,
	SickoModeType
} from "@root/tokens/dtos/payload.dto"
import { GetCoinCreatedParams } from "@root/users/dtos/payload.dto"
import { v4 as uuidv4 } from "uuid"
import { PrismaService } from "../prisma.service"
import { TokenTransactionRepository } from "./token-transaction.repository"

@Injectable()
export class TokenRepository {
	constructor(
		private prisma: PrismaService,
		private tokenTransaction: TokenTransactionRepository,
		private redis: RedisService
	) {}

	private cacheCreateToken(id: string): string {
		return `token-create-${id}`
	}

	async exist(address: string) {
		return this.redis.getOrSet(
			`token-exist:${address}`,
			() => {
				return this.prisma.token.findFirst({
					where: { address }
				})
			},
			5
		)
	}

	findLatest(take: number) {
		return this.prisma.token.findMany({
			where: { isDeleted: false },
			orderBy: {
				createdAt: Prisma.SortOrder.desc
			},
			take
		})
	}

	async findSickoMode(userAddress: string | undefined, query: SickoModeParams) {
		// Validate pagination parameters
		const page = Math.max(1, query.page)
		const take = Math.min(100, Math.max(1, query.take))

		const skip = (page - 1) * take
		let orderBy: Prisma.TokenOrderByWithRelationInput[] = []
		let where: Prisma.TokenWhereInput = {}
		where = {
			AND: [
				{ isDeleted: false },
				{ bump: true },
				...(query.volumnFrom ? [{ volumn: { gte: query.volumnFrom } }] : []),
				...(query.volumnTo ? [{ volumn: { lte: query.volumnFrom } }] : []),
				...(query.marketCapFrom
					? [{ marketCapacity: { gte: query.marketCapFrom } }]
					: []),
				...(query.marketCapTo
					? [{ marketCapacity: { lte: query.marketCapTo } }]
					: []),
				...(query.holderFrom
					? [{ tokenOwners: { some: { amount: { gte: query.holderFrom } } } }]
					: []),
				...(query.holderTo
					? [{ tokenOwners: { some: { amount: { lte: query.holderTo } } } }]
					: []),
				...(query.excludeKeywords && query.excludeKeywords.length > 0
					? [
							{
								AND: query.excludeKeywords.map(keyword => ({
									NOT: {
										OR: [
											{
												name: {
													contains: keyword,
													mode: Prisma.QueryMode.insensitive
												}
											},
											{
												ticker: {
													contains: keyword,
													mode: Prisma.QueryMode.insensitive
												}
											}
										]
									}
								}))
							}
						]
					: []),
				...(query.includeKeywords && query.includeKeywords.length > 0
					? [
							{
								OR: query.includeKeywords.map(keyword => ({
									OR: [
										{
											name: {
												contains: keyword,
												mode: Prisma.QueryMode.insensitive
											}
										},
										{
											ticker: {
												contains: keyword,
												mode: Prisma.QueryMode.insensitive
											}
										}
									]
								}))
							}
						]
					: [])
			]
		}

		switch (query.sort) {
			case SickoModeType.NEWEST:
				orderBy = [...[{ createdAt: Prisma.SortOrder.desc }]]
				break

			case SickoModeType.SUGGESTED:
				orderBy = [...[{ marketCapacity: Prisma.SortOrder.desc }]]
				break

			case SickoModeType.GRADUATING:
				orderBy = [...[{ marketCapacity: Prisma.SortOrder.desc }]]
				where.isCompletedBondingCurve = false
				break

			case SickoModeType.FAVORITE:
				if (!userAddress)
					throw new InternalServerErrorException(
						"Need login to search by favorite"
					)
				where.tokenFavorite = {
					some: {
						userAddress: userAddress
					}
				}
				orderBy = [...[{ createdAt: Prisma.SortOrder.desc }]]
				break
			default:
				throw new InternalServerErrorException("Sort can not be empty")
		}

		const [tokens, total] = await Promise.all([
			this.prisma.token.findMany({
				skip,
				take: query.take,
				where: {
					...where
				},
				orderBy,
				select: {
					id: true,
					name: true,
					address: true,
					price: true,
					imageUri: true,
					ticker: true,
					network: true,
					bondingCurveTarget: true,
					isCompletedBondingCurve: true,
					isCompletedKingOfHill: true,
					createdAtKingOfHill: true,
					bump: true,
					creatorAddress: true,
					marketCapacity: true,
					volumn: true,
					hallOfFame: true,
					tax: true,
					rewardTax: true,
					jackpotTax: true,
					jackpotAmount: true,
					burnTax: true,
					jackpotPending: true,
					lockAmount: true,
					totalSupply: true,
					unlockAt: true,
					taxPending: true,
					createdAt: true,
					updatedAt: true,
					raydiumStatus: true,
					tokenOwners: {
						select: {
							userAddress: true,
							amount: true
						},
						take: 10,
						orderBy: {
							amount: Prisma.SortOrder.desc
						}
					},
					_count: {
						select: {
							tokenTransaction: true,
							tokenOwners: true
						}
					}
				}
			}),
			this.prisma.token.count({ where })
		])

		const tokenData = await Promise.all(
			tokens.map(async token => {
				const top10Total = token.tokenOwners.reduce(
					(sum, owner) => sum + owner.amount,
					BigInt(0)
				)

				const top10Percentage =
					token.marketCapacity > 0
						? top10Total / token.totalSupply / BigInt(100)
						: BigInt(0)

				let isFavorite = false

				if (userAddress) {
					isFavorite = !!(await this.prisma.tokenFavorite.findUnique({
						where: {
							tokenAddress_userAddress: {
								tokenAddress: token.address,
								userAddress
							}
						}
					}))
				}

				if (token.tokenOwners.length === 0) {
					return {
						...token,
						tokenOwners: undefined,
						top10HoldersPercentage: top10Percentage,
						isFavorite,
						devHoldPersent: 0
					}
				}

				let creatorAmount = BigInt(0)
				const creatorInTop10 = token.tokenOwners.find(
					owner => owner.userAddress === token.creatorAddress
				)

				if (creatorInTop10) {
					creatorAmount = creatorInTop10.amount
				} else {
					const creator = await this.prisma.tokenOwner.findFirst({
						where: {
							userAddress: token.creatorAddress,
							tokenAddress: token.address
						},
						select: {
							userAddress: true,
							amount: true
						}
					})

					creatorAmount = creator ? creator.amount : BigInt(0)
				}

				const devHoldPersent = creatorAmount / token.totalSupply

				return {
					...token,
					tokenOwners: undefined,
					top10HoldersPercentage: top10Percentage,
					isFavorite,
					devHoldPersent
				}
			})
		)

		return {
			data: tokenData,
			total,
			maxPage: Math.ceil(total / query.take)
		}
	}

	async getSickoModeItem(tokenAddress: string) {
		const token = await this.prisma.token.findUnique({
			where: {
				address: tokenAddress,
				bump: true,
				isDeleted: false
			},
			select: {
				id: true,
				name: true,
				address: true,
				price: true,
				imageUri: true,
				ticker: true,
				network: true,
				bondingCurveTarget: true,
				isCompletedBondingCurve: true,
				isCompletedKingOfHill: true,
				createdAtKingOfHill: true,
				bump: true,
				creatorAddress: true,
				marketCapacity: true,
				volumn: true,
				hallOfFame: true,
				tax: true,
				rewardTax: true,
				jackpotTax: true,
				jackpotAmount: true,
				burnTax: true,
				jackpotPending: true,
				lockAmount: true,
				totalSupply: true,
				unlockAt: true,
				taxPending: true,
				createdAt: true,
				updatedAt: true,
				raydiumStatus: true,
				tokenOwners: {
					select: {
						userAddress: true,
						amount: true
					},
					take: 10,
					orderBy: {
						amount: Prisma.SortOrder.desc
					}
				},
				_count: {
					select: {
						tokenTransaction: true,
						tokenOwners: true
					}
				}
			}
		})

		if (!token) return null

		const top10Total = token.tokenOwners.reduce(
			(sum, owner) => sum + owner.amount,
			BigInt(0)
		)

		const top10Percentage =
			token.marketCapacity > 0
				? top10Total / token.totalSupply / BigInt(100)
				: BigInt(0)

		const isFavorite = false

		if (token.tokenOwners.length === 0) {
			return {
				...token,
				tokenOwners: undefined,
				top10HoldersPercentage: top10Percentage,
				isFavorite,
				devHoldPersent: 0
			}
		}

		let creatorAmount = BigInt(0)
		const creatorInTop10 = token.tokenOwners.find(
			owner => owner.userAddress === token.creatorAddress
		)

		if (creatorInTop10) {
			creatorAmount = creatorInTop10.amount
		} else {
			const creator = await this.prisma.tokenOwner.findFirst({
				where: {
					userAddress: token.creatorAddress,
					tokenAddress: token.address
				},
				select: {
					userAddress: true,
					amount: true
				}
			})

			creatorAmount = creator ? creator.amount : BigInt(0)
		}

		const devHoldPersent = creatorAmount / token.totalSupply

		return {
			...token,
			tokenOwners: undefined,
			top10HoldersPercentage: top10Percentage,
			isFavorite,
			devHoldPersent
		}
	}

	async find(userAddress: string | undefined, query: FindTokenParams) {
		const skip = (query.page - 1) * query.take

		const where: Prisma.TokenWhereInput = {
			...(query.searchText && {
				OR: [
					{ name: { contains: query.searchText, mode: "insensitive" } },
					{ ticker: { contains: query.searchText, mode: "insensitive" } }
				]
			}),
			...(query.hallOfFame && {
				hallOfFame: true
			}),
			...(query.reward && {
				rewardTax: { gt: 0 }
			}),
			...(query.jackpot && {
				jackpotTax: { gt: 0 }
			}),
			...(query.burn && {
				burnTax: { gt: 0 }
			}),
			...(query.lock && {
				lockAmount: { gt: 0 }
			}),
			...(query.lightning && {
				isCompletedBondingCurve: true
			}),

			...(query.popular && {
				highlightOrder: {
					not: null,
					gt: 0
				}
			}),
			isDeleted: false
		}

		const include: Prisma.TokenInclude = {}
		if (query.detail) {
			include.creator = {
				select: {
					id: true,
					address: true,
					username: true,
					avatarUrl: true
				}
			}
			include.tokenOwners = {
				select: {
					user: {
						select: {
							id: true,
							username: true,
							address: true,
							avatarUrl: true
						}
					},
					amount: true
				},
				orderBy: { amount: Prisma.SortOrder.desc },
				take: 10
			}
		}

		const countSelect: { tokenTransaction?: boolean; tokenOwners?: boolean } = {
			...(query.tx && { tokenTransaction: true }),
			...(query.holders && { tokenOwners: true })
		}
		if (Object.keys(countSelect).length > 0) {
			include._count = { select: countSelect }
		}

		const orderBy: Prisma.TokenOrderByWithRelationInput[] = [
			...(query.marketCap ? [{ marketCapacity: query.marketCap }] : []),
			...(query.price ? [{ price: query.price }] : []),
			...(query.tx ? [{ tokenTransaction: { _count: query.tx } }] : []),
			...(query.volumn ? [{ volumn: query.volumn }] : []),
			...(query.holders ? [{ tokenOwners: { _count: query.holders } }] : []),
			...(query.lastTrade ? [{ updatedAt: query.lastTrade }] : []),
			...(query.approachingJackpot
				? [{ jackpotPending: query.approachingJackpot }]
				: []),
			...(query.priceChange1h ? [{ token1hChange: query.priceChange1h }] : []),
			...(query.priceChange24h
				? [{ token24hChange: query.priceChange24h }]
				: []),
			...(query.priceChange7d ? [{ token7dChange: query.priceChange7d }] : []),
			...(query.latest ? [{ createdAt: query.latest }] : []),
			...(query.popular ? [{ highlightOrder: Prisma.SortOrder.asc }] : [])
		]

		const [tokens, total] = await Promise.all([
			this.prisma.token.findMany({
				skip,
				take: query.take,
				orderBy,
				include,
				where
			}),
			this.prisma.token.count({ where })
		])

		if (!tokens || tokens.length === 0) {
			return {
				data: [],
				total: 0,
				maxPage: 1
			}
		}
		let favoriteTokens: string[] = []
		if (userAddress) {
			const favorites = await this.prisma.tokenFavorite.findMany({
				select: { tokenAddress: true },
				where: { userAddress }
			})
			favoriteTokens = favorites.map(
				(fav: { tokenAddress: string }) => fav.tokenAddress
			)
		}

		return {
			data: tokens.map(token => ({
				...token,
				isFavorite: userAddress ? favoriteTokens.includes(token.address) : false
			})),
			total,
			maxPage: Math.ceil(total / query.take)
		}
	}

	async getAllTokenAddress() {
		return this.redis.getOrSet(
			"get-all-token",
			() => {
				return this.prisma.token.findMany({
					select: { id: true, address: true, raydiumStatus: true },
					where: {
						isDeleted: false,
						bump: true,
						OR: [
							{
								raydiumStatus: RaydiumStatusType.Listed
							},
							{
								raydiumStatus: RaydiumStatusType.NotListed
							}
						]
					},
					orderBy: {
						createdAt: Prisma.SortOrder.desc
					}
				})
			},
			30
		)
	}

	async getTaxByID(id: string) {
		return this.redis.getOrSet(
			`token-getTaxByID: ${id}`,
			() => {
				return this.prisma.token.findFirst({
					where: { id },
					select: {
						rewardTax: true,
						jackpotTax: true,
						burnTax: true,
						totalSupply: true,
						creatorAddress: true,
						lockAmount: true
					}
				})
			},
			10
		)
	}

	async getTotalSupply(id: string) {
		return this.prisma.token.findFirst({
			select: {
				totalSupply: true
			},
			where: {
				isDeleted: false,
				raydiumStatus: RaydiumStatusType.Listed,
				id
			}
		})
	}

	async findOneByAddress(address: string) {
		return this.prisma.token.findUnique({
			where: {
				address,
				isDeleted: false
			},
			select: {
				id: true,
				address: true,
				bondingCurveTarget: true,
				volumn: true
			}
		})
	}

	findById(tokenId: string, include?: Prisma.TokenInclude<DefaultArgs>) {
		return this.prisma.token.findFirst({
			where: {
				id: tokenId,
				isDeleted: false
			},
			include: { ...include, creator: true }
		})
	}

	findByIds(ids: string[]) {
		return this.prisma.token.findMany({
			where: {
				id: { in: ids },
				isDeleted: false
			}
		})
	}

	findWithPrivateKey(id: string) {
		return this.prisma.token.findFirst({
			where: {
				id,
				isDeleted: false
			},
			include: {
				tokenKey: {
					select: {
						id: true,
						privateKey: true
					}
				}
			}
		})
	}

	async getCoinCreated(userId: string, params: GetCoinCreatedParams) {
		const { page, take } = params
		const skip = (page - 1) * take
		const where: Prisma.TokenWhereInput = {
			creator: {
				id: userId
			},
			isDeleted: false
		}

		const [total, coinCreated] = await Promise.all([
			this.prisma.token.count({
				where
			}),
			this.prisma.token.findMany({
				where,
				orderBy: {
					updatedAt: Prisma.SortOrder.desc
				},
				skip,
				take,
				include: {
					creator: {
						select: {
							address: true,
							id: true,
							avatarUrl: true,
							username: true
						}
					}
				}
			})
		])

		return {
			total,
			maxPage: Math.ceil(total / take),
			data: coinCreated
		}
	}

	findPopular() {
		return this.prisma.token.findMany({
			where: {
				highlightOrder: {
					not: null,
					gt: 0
				},
				isDeleted: false
			},
			orderBy: {
				highlightOrder: "asc"
			}
		})
	}

	findHallOfFame(take = 100) {
		return this.prisma.token.findMany({
			where: {
				hallOfFame: true,
				isDeleted: false
			},
			orderBy: {
				createdAt: "desc"
			},
			take: take
		})
	}

	async updateKingOfCoin(id: string) {
		return this.prisma.token.update({
			where: {
				id
			},
			data: {
				isCompletedKingOfHill: true,
				createdAtKingOfHill: new Date()
			}
		})
	}

	async updateDistributionPending(
		address: string,
		amount: bigint,
		tx?: Prisma.TransactionClient
	) {
		const client = tx ?? this.prisma

		return client.token.update({
			where: { address },
			data: {
				distributionPending: {
					increment: amount
				}
			},
			select: {
				distributionPending: true,
				raydiumStatus: true
			}
		})
	}

	async resetDistributionPending(
		address: string,
		tx?: Prisma.TransactionClient
	) {
		const client = tx ?? this.prisma

		return client.token.update({
			where: { address },
			data: {
				distributionPending: 0
			},
			select: {
				distributionPending: true,
				raydiumStatus: true
			}
		})
	}

	async updateTokenOnchain(
		address: string,
		data: Prisma.TokenUpdateInput,
		tx?: Prisma.TransactionClient
	) {
		const client = tx ?? this.prisma
		const token = await client.token.update({
			where: { address },
			data,
			include: {
				tokenKey: true
			}
		})

		if (token.tokenKey) {
			await client.tokenKey.update({
				where: { id: token.tokenKey.id },
				data: {
					privateKey: `cleared_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
				}
			})
		}

		return token
	}

	async findMaxMarketCap() {
		return this.redis.getOrSet(
			"token-max-market-cap",
			() => {
				return this.prisma.token.findFirst({
					where: {
						isCompletedBondingCurve: false,
						isDeleted: false
					},
					orderBy: {
						marketCapacity: Prisma.SortOrder.desc
					}
				})
			},
			5
		)
	}

	async update(
		address: string,
		payload: Prisma.TokenUpdateInput,
		tx?: Prisma.TransactionClient
	) {
		const client = tx ?? this.prisma
		return client.token.update({
			where: {
				address
			},
			data: payload
		})
	}

	async createOffchain(data: ICreateTokenOffchain) {
		const tokenCache = await this.redis.get(this.cacheCreateToken(data.id))
		if (!tokenCache)
			throw new NotFoundException("Dont have token data in cache")

		const tokenData = JSON.parse(tokenCache) as Prisma.TokenCreateInput

		const fileExist = await data.checkFileExist(tokenData.imageUri)
		if (!fileExist) throw new NotFoundException("File doesn't exist")

		const uploadMetadata = await data.postMetadataToS3(
			data.id,
			tokenData.metadata
		)
		if (!uploadMetadata) {
			throw new NotFoundException(
				"Failed to upload metadata to S3. Token creation aborted."
			)
		}

		tokenData.uri = `${tokenData.uri}token-metadata-${tokenData.id}.json`

		const token = await this.prisma.token.create({
			data: tokenData,
			include: {
				creator: {
					select: {
						id: true,
						address: true,
						username: true
					}
				}
			}
		})

		await this.redis.del(this.cacheCreateToken(data.id))
		return token
	}

	/**  Create token
	 * - Create token
	 * - Get image uri from Aws3
	 * - Update metadata & uri
	 * - Update status (picked) for selected tokenKey
	 */
	async createInCache(data: ICreateTokenInCache) {
		const { dataCreate, tokenKeyId, contentType, getTickerPresignedUrl } = data
		const tokenId = uuidv4()

		const { imageUri, fields, url } = await getTickerPresignedUrl(
			tokenId,
			contentType
		)

		const newMetadata: Record<string, string> = {
			ticker: dataCreate.ticker,
			name: dataCreate.name,
			description: dataCreate.description,
			image: imageUri
		}

		if (dataCreate.telegramLink)
			newMetadata.telegramLink = dataCreate.telegramLink
		if (dataCreate.twitterLink) newMetadata.twitterLink = dataCreate.twitterLink
		if (dataCreate.websiteLink) newMetadata.websiteLink = dataCreate.websiteLink
		if (dataCreate.instagramLink)
			newMetadata.instagramLink = dataCreate.instagramLink
		if (dataCreate.youtubeLink) newMetadata.youtubeLink = dataCreate.youtubeLink
		if (dataCreate.tiktokLink) newMetadata.tiktokLink = dataCreate.tiktokLink
		if (dataCreate.onlyFansLink)
			newMetadata.onlyFansLink = dataCreate.onlyFansLink

		const token: Prisma.TokenCreateInput = {
			...dataCreate,
			metadata: newMetadata,
			id: tokenId,
			imageUri,
			uri: url
		}

		await this.prisma.tokenKey.update({
			where: { id: tokenKeyId },
			data: { isPicked: true }
		})

		//save 300s in cache redis
		await this.redis.set(
			this.cacheCreateToken(tokenId),
			JSON.stringify(token),
			300
		)

		return {
			token,
			attachment: {
				fields,
				url
			}
		}
	}

	//   Find token is King of hill (not ever bonding curve & highest marketcap)
	findKingOfHill() {
		return this.prisma.token.findFirst({
			where: {
				isCompletedBondingCurve: false,
				isCompletedKingOfHill: true,
				isDeleted: false
			},
			orderBy: { marketCapacity: Prisma.SortOrder.desc }
		})
	}

	//   Find token by address
	findByAddress(address: string, include?: Prisma.TokenInclude) {
		return this.prisma.token.findUnique({
			where: { address, isDeleted: false },
			include: {
				...include,
				creator: true
			}
		})
	}

	//   Get 20 silimar market cap tokens
	findSimilar(marketCapacity: bigint) {
		return this.prisma.token.findMany({
			where: { marketCapacity: { lte: marketCapacity }, isDeleted: false },
			orderBy: { createdAt: Prisma.SortOrder.desc },
			take: 20
		})
	}

	// Get latest on chain token
	getLatestOnChain() {
		return this.prisma.token.findFirst({
			where: { bump: true, bumpAt: { not: null }, isDeleted: false },
			orderBy: { bumpAt: Prisma.SortOrder.desc },
			select: {
				id: true,
				address: true,
				uri: true,
				creator: true
			}
		})
	}

	async paginateSimilar(payload: {
		searchText: string
		page: number
		take: number
	}) {
		const { page, searchText, take = 20 } = payload
		const skip = (page - 1) * take
		const whereCondition: Prisma.TokenWhereInput = {
			isDeleted: false,
			OR: [
				{
					name: {
						contains: searchText,
						mode: "insensitive"
					}
				},
				{
					ticker: {
						contains: searchText,
						mode: "insensitive"
					}
				}
			]
		}
		const [data, total] = await Promise.all([
			this.prisma.token.findMany({
				where: whereCondition,
				skip,
				take,
				select: {
					id: true,
					address: true,
					name: true,
					ticker: true,
					marketCapacity: true,
					imageUri: true,
					createdAt: true,
					volumn: true,
					price: true,
					totalSupply: true
				},
				orderBy: {
					createdAt: "desc"
				}
			}),

			this.prisma.token.count({
				where: whereCondition
			})
		])

		return {
			data,
			total,
			maxPage: Math.ceil(total / take)
		}
	}

	//   Add banner
	async addBanner(tokenId: string, value: string) {
		return this.prisma.token.update({
			where: {
				id: tokenId
			},
			data: {
				bannerUri: value
			}
		})
	}

	// Delete banner
	async deleteBanner(tokenId: string) {
		return this.prisma.token.update({
			where: {
				id: tokenId
			},
			data: {
				bannerUri: null
			}
		})
	}

	async updateByAdmin(id: string, payload: Omit<UpdateTokenItemDto, "id">) {
		return this.prisma.token.update({
			where: {
				id
			},
			data: {
				headline: payload.headline,
				highlightOrder: payload.order
			},
			select: {
				id: true,
				headline: true,
				highlightOrder: true,
				imageUri: true,
				name: true,
				address: true
			}
		})
	}

	async paginateReportedTokens(payload: PaginateReportedTokensDto) {
		const { page, take } = payload
		const skip = (page - 1) * take

		const [tokens, total] = await Promise.all([
			this.prisma.token.findMany({
				where: {
					isDeleted: false,
					tokenReports: { some: {} }
				},
				skip,
				take,
				orderBy: {
					//   tokenReports: {
					//     _count: Prisma.SortOrder.desc,
					//   },
					createdAt: "desc"
				},
				include: {
					creator: {
						select: {
							id: true,
							address: true,
							username: true,
							avatarUrl: true
						}
					},
					_count: {
						select: { tokenReports: true }
					},
					tokenReports: true
				}
			}),
			this.prisma.token.count({
				where: {
					isDeleted: false,
					tokenReports: { some: {} }
				}
			})
		])

		return {
			data: tokens.map(token => ({
				...token,
				totalReport: token._count.tokenReports
			})),
			total,
			maxPage: Math.ceil(total / take)
		}
	}

	async softDelete(id: string) {
		return this.prisma.token.update({
			where: { id },
			data: { isDeleted: true }
		})
	}

	async getTokenWithJackpot() {
		return this.prisma.token.findMany({
			where: {
				jackpotQueue: {
					gt: 0
				},
				isDeleted: false
			},
			select: {
				id: true,
				address: true,
				jackpotAmount: true,
				jackpotQueue: true
			}
		})
	}

	async resetJackpotQueue(id: string) {
		return this.prisma.token.update({
			where: {
				id
			},
			data: {
				jackpotQueue: 0
			}
		})
	}

	async updateJackpotPending(
		id: string,
		amount: string,
		tx?: Prisma.TransactionClient
	) {
		const amountBigInt = BigInt(amount)
		if (amountBigInt < 0) {
			throw new InternalServerErrorException("Amount must be positive")
		}

		const client = tx ?? this.prisma

		return client.$queryRaw`
			UPDATE "token"
			SET 
				"jackpot_pending" = CASE 
					WHEN "jackpot_amount" != 0 AND ("jackpot_pending" + ${amountBigInt}) >= "jackpot_amount"
					THEN ("jackpot_pending" + ${amountBigInt}) % "jackpot_amount"
					ELSE "jackpot_pending" + ${amountBigInt}
				END,
				"jackpot_queue" = CASE 
					WHEN "jackpot_amount" != 0 AND ("jackpot_pending" + ${amountBigInt}) >= "jackpot_amount"
					THEN "jackpot_queue" + FLOOR(("jackpot_pending" + ${amountBigInt}) / "jackpot_amount")
					ELSE "jackpot_queue"
				END
			WHERE id = ${id}::uuid
			RETURNING "jackpot_pending", "jackpot_amount", "jackpot_queue"
		`
	}

	async deleteOffChain(id: string) {
		return this.prisma.token.delete({
			where: {
				id,
				bump: false
			}
		})
	}
}
