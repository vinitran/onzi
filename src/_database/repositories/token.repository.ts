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
	ICreateTokenOffchain,
	IGetRealHolderPayload
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

	// async sickoMode(query: SickoModeParams, userAddress?: string) {
	// 	// Validate pagination parameters
	// 	const page = Math.max(1, query.page)
	// 	const take = Math.min(100, Math.max(1, query.take))
	//
	// 	const skip = (page - 1) * take
	// 	let orderBy: Prisma.TokenOrderByWithRelationInput[] = []
	// 	let where: Prisma.TokenWhereInput = {}
	// 	where = {
	// 		AND: [
	// 			{ isDeleted: false },
	// 			{ bump: true },
	// 			...(query.volumnFrom ? [{ volumn: { gte: query.volumnFrom } }] : []),
	// 			...(query.volumnTo ? [{ volumn: { lte: query.volumnTo } }] : []),
	// 			...(query.marketCapFrom
	// 				? [{ marketCapacity: { gte: query.marketCapFrom } }]
	// 				: []),
	// 			...(query.marketCapTo
	// 				? [{ marketCapacity: { lte: query.marketCapTo } }]
	// 				: []),
	// 			...(query.holderFrom
	// 				? [{ tokenOwners: { some: { amount: { gte: query.holderFrom } } } }]
	// 				: []),
	// 			...(query.holderTo
	// 				? [{ tokenOwners: { some: { amount: { lte: query.holderTo } } } }]
	// 				: []),
	// 			...(query.excludeKeywords && query.excludeKeywords.length > 0
	// 				? [
	// 						{
	// 							AND: query.excludeKeywords.map(keyword => ({
	// 								NOT: {
	// 									OR: [
	// 										{
	// 											name: {
	// 												contains: keyword,
	// 												mode: Prisma.QueryMode.insensitive
	// 											}
	// 										},
	// 										{
	// 											ticker: {
	// 												contains: keyword,
	// 												mode: Prisma.QueryMode.insensitive
	// 											}
	// 										}
	// 									]
	// 								}
	// 							}))
	// 						}
	// 					]
	// 				: []),
	// 			...(query.includeKeywords && query.includeKeywords.length > 0
	// 				? [
	// 						{
	// 							OR: query.includeKeywords.map(keyword => ({
	// 								OR: [
	// 									{
	// 										name: {
	// 											contains: keyword,
	// 											mode: Prisma.QueryMode.insensitive
	// 										}
	// 									},
	// 									{
	// 										ticker: {
	// 											contains: keyword,
	// 											mode: Prisma.QueryMode.insensitive
	// 										}
	// 									}
	// 								]
	// 							}))
	// 						}
	// 					]
	// 				: [])
	// 		]
	// 	}
	//
	// 	switch (query.sort) {
	// 		case SickoModeType.NEWEST:
	// 			orderBy = [...[{ createdAt: Prisma.SortOrder.desc }]]
	// 			break
	//
	// 		case SickoModeType.GRADUATING:
	// 			orderBy = [...[{ marketCapacity: Prisma.SortOrder.desc }]]
	// 			where.isCompletedBondingCurve = false
	// 			break
	//
	// 		case SickoModeType.FAVORITE:
	// 			if (!userAddress)
	// 				throw new InternalServerErrorException(
	// 					"Need login to search by favorite"
	// 				)
	// 			where.tokenFavorite = {
	// 				some: {
	// 					userAddress: userAddress
	// 				}
	// 			}
	// 			orderBy = [...[{ createdAt: Prisma.SortOrder.desc }]]
	// 			break
	// 		default:
	// 			throw new InternalServerErrorException("Sort can not be empty")
	// 	}
	//
	// 	const [tokens, total] = await Promise.all([
	// 		this.prisma.token.findMany({
	// 			skip,
	// 			take: query.take,
	// 			where: {
	// 				...where
	// 			},
	// 			orderBy,
	// 			select: {
	// 				id: true,
	// 				name: true,
	// 				address: true,
	// 				price: true,
	// 				imageUri: true,
	// 				ticker: true,
	// 				network: true,
	// 				bondingCurveTarget: true,
	// 				isCompletedBondingCurve: true,
	// 				isCompletedKingOfHill: true,
	// 				createdAtKingOfHill: true,
	// 				bump: true,
	// 				creatorAddress: true,
	// 				marketCapacity: true,
	// 				volumn: true,
	// 				hallOfFame: true,
	// 				tax: true,
	// 				rewardTax: true,
	// 				jackpotTax: true,
	// 				jackpotAmount: true,
	// 				burnTax: true,
	// 				jackpotPending: true,
	// 				lockAmount: true,
	// 				totalSupply: true,
	// 				unlockAt: true,
	// 				taxPending: true,
	// 				createdAt: true,
	// 				updatedAt: true,
	// 				raydiumStatus: true,
	// 				_count: {
	// 					select: {
	// 						tokenTransaction: true
	// 					}
	// 				}
	// 			}
	// 		}),
	// 		this.prisma.token.count({ where })
	// 	])
	//
	// 	return { tokens, total }
	// }

	async findSickoMode(query: SickoModeParams, userAddress?: string) {
		const data: { tokens: RawSickoModeType[]; total: number } =
			await this.sickoMode(query, userAddress)

		const tokenData = await Promise.all(
			data.tokens.map(async token => {
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

				return {
					...token,
					isFavorite
				}
			})
		)

		return {
			data: tokenData,
			total: data.total,
			maxPage: Math.ceil(data.total / query.take)
		}
	}

	//   Exclude wallets: bondingCurve, vault, system
	async getRealTokenOwners({
		excludeAddresses,
		tokenAddress,
		take = 10
	}: IGetRealHolderPayload) {
		return this.prisma.tokenOwner.findMany({
			where: {
				tokenAddress,
				userAddress: {
					notIn: excludeAddresses
				}
			},
			take,
			orderBy: {
				amount: "desc"
			}
		})
	}

	async findTokenWithLatestTransaction(
		query: FindTokenParams,
		userAddress?: string,
		type?: "Sell" | "Buy"
	) {
		const [data, total] = await Promise.all([
			this.prisma.$queryRawUnsafe(
				this.queryGetLastTrade(query, userAddress, type)
			),
			this.prisma.$queryRawUnsafe(
				this.queryCountLastTrade(query, userAddress, type)
			)
		])
		return {
			data,
			// @ts-ignore
			total: Number(total[0].count),
			// @ts-ignore
			maxPage: Math.ceil(Number(total[0].count) / query.take)
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
			...(query.approachingJackpot && {
				AND: [{ jackpotTax: { gt: 0 } }, { jackpotTax: { not: 0 } }]
			}),
			...(query.burn && {
				burnTax: { gt: 0 }
			}),
			...(query.jackpot && {
				jackpotTax: { gt: 0 }
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
				? [{ jackpotPercent: query.approachingJackpot }]
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
			5
		)
	}

	async updateJackpotPercent(id: string) {
		return this.prisma.$executeRaw`
		UPDATE token
		SET jackpot_percent = 
			CASE 
				WHEN COALESCE(jackpot_amount, 0) = 0 THEN 0
				ELSE COALESCE(jackpot_pending, 0)::double precision / COALESCE(jackpot_amount, 1)::double precision
			END
		WHERE id = ${id}::uuid
	`
	}

	async getAllTokenAddressForUnlock() {
		return this.redis.getOrSet(
			"get-all-token-for-unlock",
			() => {
				return this.prisma.token.findMany({
					select: {
						id: true,
						address: true,
						lockAmount: true,
						unlockAt: true,
						creatorAddress: true
					},
					where: {
						isDeleted: false
					},
					orderBy: {
						unlockAt: Prisma.SortOrder.desc
					}
				})
			},
			30
		)
	}

	async updateUnlockToken(address: string) {
		return this.prisma.token.update({
			where: { address },
			data: {
				lockAmount: null,
				unlockAt: null
			}
		})
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

	async findHallOfFame(take = 10) {
		const data = await this.prisma.token.findMany({
			where: {
				bump: true,
				isCompletedBondingCurve: false,
				isDeleted: false
			},
			orderBy: {
				marketCapacity: "desc"
			},
			take: take
		})

		return data
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

	async getDistributionPending(address: string) {
		return this.prisma.token.findFirst({
			where: { address },
			select: {
				distributionPending: true
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
				jackpotQueue: {
					increment: -1
				}
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

	async sickoMode(query: SickoModeParams, userAddress?: string) {
		const [tokens, total] = await Promise.all([
			this.prisma.$queryRawUnsafe<RawSickoModeType[]>(
				this.queryFindSickoMode(query, userAddress)
			),
			this.prisma.$queryRawUnsafe<number>(
				this.queryCountCookingSickoMode(query)
			)
		])
		return { tokens, total }
	}

	private querySickoModeWhere(query: SickoModeParams, userAddress?: string) {
		return `t.is_deleted = false
		AND t.bump = true
				${
					query.volumnFrom
						? `
				AND t.volumn >= ${query.volumnFrom}
				`
						: " "
				}
				${
					query.volumnTo
						? `
				AND t.volumn <= ${query.volumnTo}
				`
						: " "
				}
				${
					query.marketCapFrom
						? `
				AND t.market_capacity >= ${query.marketCapFrom}
				`
						: " "
				}
				${
					query.marketCapTo
						? `
				AND t.market_capacity <= ${query.marketCapTo}
				`
						: " "
				}
				${
					query.volumnFrom
						? `
				AND t.volumn >= ${query.volumnFrom}
				`
						: " "
				}
				${
					query.sort === SickoModeType.FAVORITE && userAddress
						? `
					AND EXISTS (
							SELECT 1
							FROM token_favorite tf
							WHERE tf.token_address = t.address
								AND tf.user_address = '${userAddress}'
					)
			`
						: " "
				}
				${query.sort === SickoModeType.GRADUATING ? " AND t.is_completed_bonding_curve = FALSE " : " "}	
				${
					query.holderFrom
						? `AND (
					SELECT COUNT(*)
					FROM token_owner o
					WHERE o.token_address = t.address
				) >= ${query.holderFrom}
				`
						: " "
				}
				${
					query.holderTo
						? `AND (
					SELECT COUNT(*)
					FROM token_owner o
					WHERE o.token_address = t.address
				) <= ${query.holderTo}
				`
						: ""
				}
				${
					query.excludeKeywords
						? `AND NOT EXISTS (
          SELECT 1 FROM unnest(array[${query.excludeKeywords.map(k => `'${k}'`).join(",")}]::text[]) keyword
          WHERE LOWER(t.name) LIKE '%' || LOWER(keyword) || '%'
             OR LOWER(t.ticker) LIKE '%' || LOWER(keyword) || '%'
        )
        `
						: " "
				}
				${
					query.includeKeywords
						? `AND EXISTS (
          SELECT 1 FROM unnest(array[${query.includeKeywords.map(k => `'${k}'`).join(",")}]::text[]) keyword
          WHERE LOWER(t.name) LIKE '%' || LOWER(keyword) || '%'
             OR LOWER(t.ticker) LIKE '%' || LOWER(keyword) || '%'
        )
        `
						: " "
				}`
	}

	private queryFindSickoMode(query: SickoModeParams, userAddress?: string) {
		return `
			SELECT
		t.id,
		t.name,
		t.address,
		t.price,
		t."imageUri",
		t.ticker,
		t.network,
		t.bonding_curve_target AS "bondingCurveTarget",
		t.is_completed_bonding_curve AS "isCompletedBondingCurve",
		t.is_completed_king_of_hill AS "isCompletedKingOfHill",
		t.created_at_king_of_hill AS "createdAtKingOfHill",
		t.bump,
		t.creator_address AS "creatorAddress",
		t.market_capacity AS "marketCapacity",
		t.volumn,
		t.hall_of_fame AS "hallOfFame",
		t.tax,
		t.reward_tax AS "rewardTax",
		t.jackpot_tax AS "jackpotTax",
		t.jackpot_amount AS "jackpotAmount",
		t.burn_tax AS "burnTax",
		t.jackpot_pending AS "jackpotPending",
		t.lock_amount AS "lockAmount",
		t.total_supply AS "totalSupply",
		t.unlock_at AS "unlockAt",
		t.tax_pending AS "taxPending",
		t.created_at AS "createdAt",
		t.updated_at AS "updatedAt",
		t."raydiumStatus",
		(
			SELECT COUNT(*) FROM token_transaction tx
			WHERE tx.token_address = t.address
		) AS "transactionCount"
	
		FROM token t

		${
			query.sort === SickoModeType.FAVORITE
				? `JOIN LATERAL (
				SELECT tx.date
				FROM token_transaction tx
				WHERE tx.token_address = t.address AND tx.type = 'Buy'
				ORDER BY tx.date DESC
				LIMIT 1
				) tx_latest ON true
				`
				: " "
		}    
				
    LEFT JOIN token_favorite f 
		  ON f.token_address = t.address${userAddress ? ` AND f.user_address = '${userAddress}'` : ""}
		
		WHERE ${this.querySickoModeWhere(query, userAddress)}
		
		${
			query.sort === SickoModeType.FAVORITE
				? `
			ORDER BY tx_latest.date DESC
		`
				: ""
		}
		${
			query.sort === SickoModeType.GRADUATING
				? `
			ORDER BY t.market_capacity DESC
		`
				: ""
		}
		${
			query.sort === SickoModeType.NEWEST
				? `
			ORDER BY t.created_at DESC
		`
				: ""
		}
		
		LIMIT ${query.take} OFFSET ${(query.page - 1) * query.take};
		`
	}

	private queryCountCookingSickoMode(query: SickoModeParams) {
		return `
      SELECT COUNT(*)
      FROM token t
      WHERE ${this.querySickoModeWhere(query)}
    `
	}

	queryCountLastTrade(
		query: FindTokenParams,
		userAddress?: string,
		type?: "Sell" | "Buy"
	) {
		return `
			SELECT COUNT(*) FROM token t 
			JOIN LATERAL (
					SELECT tx.date
					FROM token_transaction tx
					WHERE tx.token_address = t.address
						${type ? `AND tx.type = '${type}'` : ""}

				ORDER BY tx.date DESC
						LIMIT 1
      ) tx_latest ON true
					LEFT JOIN "user" u ON u.address = t.creator_address
					LEFT JOIN token_favorite f ON f.token_address = t.address${userAddress ? ` AND f.user_address = '${userAddress}'` : ""}
				WHERE t.is_deleted = false 
					${query.burn ? "AND t.burn_tax > 0" : " "}
					${query.lock ? "AND t.lock_amount > 0" : " "}
					${query.lightning ? "AND t.isCompletedBondingCurve = TRUE" : " "}
					${query.reward ? "AND t.reward_tax > 0" : " "}
					${
						query.searchText
							? `
						AND (
							t.name ILIKE '%${query.searchText}%'
							OR t.ticker ILIKE '%${query.searchText}%'
						)
					`
							: ""
					}
		`
	}

	queryGetLastTrade(
		query: FindTokenParams,
		userAddress?: string,
		type?: "Sell" | "Buy"
	) {
		const offset = (query.page - 1) * query.take

		const orderDirection = query.lastTrade === "asc" ? "ASC" : "DESC"

		return `
				SELECT
					t.id,
					t.name,
					t.address,
					t.price,
					t.uri,
					t."imageUri",
					t.banner_uri AS "bannerUri",
					t.ticker,
					t.metadata,
					t.description,
					t.is_highlight AS "isHighlight",
					t.network,
					t.bonding_curve_target AS "bondingCurveTarget",
					t.is_completed_bonding_curve AS "isCompletedBondingCurve",
					t.created_at_bonding_curve AS "createdAtBondingCurve",
					t.is_completed_king_of_hill AS "isCompletedKingOfHill",
					t.created_at_king_of_hill AS "createdAtKingOfHill",
					t.bump,
					t.creator_address AS "creatorAddress",
					t.market_capacity AS "marketCapacity",
					t.volumn,
					t.total_supply AS "totalSupply",
					t.hall_of_fame AS "hallOfFame",
					t.tax,
					t.reward_tax AS "rewardTax",
					t.jackpot_tax AS "jackpotTax",
					t.jackpot_amount AS "jackpotAmount",
					t.burn_tax AS "burnTax",
					t.distribution_pending AS "distributionPending",
					t.jackpot_pending AS "jackpotPending",
					t.jackpot_percent AS "jackpotPercent",
					t.jackpot_queue AS "jackpotQueue",
					t.tax_pending AS "taxPending",
					t.lock_amount AS "lockAmount",
					t.unlock_at AS "unlockAt",
					t.telegram_link AS "telegramLink",
					t.twitter_link AS "twitterLink",
					t.website_link AS "websiteLink",
					t.instagram_link AS "instagramLink",
					t.youtube_link AS "youtubeLink",
					t.tiktok_link AS "tiktokLink",
					t.only_fans_link AS "onlyFansLink",
					t.highlight_order AS "highlightOrder",
					t.headline,
					t.pump_at AS "bumpAt",
					t."1h_change" AS "token1hChange",
					t."24h_change" AS "token24hChange",
					t."7d_change" AS "token7dChange",
					t.is_deleted AS "isDeleted",
					t.created_at AS "createdAt",
					t.updated_at AS "updatedAt",
					t."raydiumStatus",
					u.id AS "creatorId",
					json_build_object(
						'id', u.id,
						'username', u.username,
						'address', u.address,
						'avatarUrl', u.avatar_url
					) AS creator,
					u.username AS "creatorUsername",
					u.avatar_url AS "creatorAvatarUrl",
					CASE WHEN f.user_address IS NOT NULL THEN true ELSE false END AS "tokenFavorite",
					tx_latest.date AS "latestTxDate"                        
				FROM token t
				JOIN LATERAL (
					SELECT tx.date
					FROM token_transaction tx
					WHERE tx.token_address = t.address
						${type ? `AND tx.type = '${type}'` : ""}

				ORDER BY tx.date DESC
						LIMIT 1
      ) tx_latest ON true
					LEFT JOIN "user" u ON u.address = t.creator_address
					LEFT JOIN token_favorite f ON f.token_address = t.address${userAddress ? ` AND f.user_address = '${userAddress}'` : ""}
				WHERE t.is_deleted = false 
					${query.burn ? "AND t.burn_tax > 0" : " "}
					${query.jackpot ? "AND t.jackpot_tax > 0" : " "}
					${query.lock ? "AND t.lock_amount > 0" : " "}
					${query.lightning ? "AND t.isCompletedBondingCurve = TRUE" : " "}
					${query.reward ? "AND t.reward_tax > 0" : " "}
					${
						query.searchText
							? `
						AND (
							t.name ILIKE '%${query.searchText}%'
							OR t.ticker ILIKE '%${query.searchText}%'
						)
					`
							: ""
					}
				ORDER BY tx_latest.date ${orderDirection}
					LIMIT ${query.take} OFFSET ${offset};
			`
	}
}

export interface RawSickoModeType {
	id: string
	name: string
	address: string
	price: string // Decimal -> string
	imageUri: string
	ticker: string
	network: "Solana" // enum Network
	bondingCurveTarget: string // BigInt -> string
	isCompletedBondingCurve: boolean
	isCompletedKingOfHill: boolean
	createdAtKingOfHill: string | null // DateTime -> ISO string
	bump: boolean | null
	creatorAddress: string
	marketCapacity: number
	volumn: string
	hallOfFame: boolean
	tax: number
	rewardTax: number
	jackpotTax: number
	jackpotAmount: string
	burnTax: number
	jackpotPending: string
	lockAmount: string | null
	totalSupply: string
	unlockAt: string | null
	taxPending: number
	createdAt: string
	updatedAt: string | null
	raydiumStatus: "NotListed" | "Listed" | "Pending" // enum RaydiumStatusType

	_count: {
		tokenTransaction: number
	}
}
