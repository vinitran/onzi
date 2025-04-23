import {
	Injectable,
	InternalServerErrorException,
	NotFoundException
} from "@nestjs/common"
import { Prisma } from "@prisma/client"
import { RedisService } from "@root/_redis/redis.service"
import {
	ICreateTokenInCache,
	ICreateTokenOffchain
} from "@root/_shared/types/token"
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

	findLatest(take: number) {
		return this.prisma.token.findMany({
			orderBy: {
				createdAt: "desc"
			},
			take
		})
	}

	async findSickoMode(userAddress: string | undefined, query: SickoModeParams) {
		const skip = (query.page - 1) * query.take
		let orderBy: Prisma.TokenOrderByWithRelationInput[] = []
		let where: Prisma.TokenWhereInput = {}
		where = {
			AND: [
				...(query.volumnFrom ? [{ volumn: { gte: query.volumnFrom } }] : []),
				...(query.volumnTo ? [{ volumn: { lte: query.volumnFrom } }] : []),
				...(query.marketCapFrom
					? [{ marketCapacity: { gte: query.marketCapFrom } }]
					: []),
				...(query.marketCapTo
					? [{ marketCapacity: { lte: query.marketCapTo } }]
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
				where,
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
					taxPending: true,
					createdAt: true,
					updatedAt: true,
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

		return {
			tokens,
			total,
			maxPage: Math.ceil(total / query.take)
		}
	}

	async find(userAddress: string | undefined, query: FindTokenParams) {
		const skip = (query.page - 1) * query.take
		const where: Prisma.TokenWhereInput = {
			...(query.searchText && {
				OR: [
					{ name: { contains: query.searchText, mode: "insensitive" } },
					{ ticker: { contains: query.searchText, mode: "insensitive" } },
					{ description: { contains: query.searchText, mode: "insensitive" } }
				]
			}),
			...(query.hallOfFame && {
				hallOfFame: true
			})
		}

		const include: Prisma.TokenInclude = {
			...(query.detail && {
				creator: {
					select: { address: true, username: true, avatarUrl: true }
				},
				tokenOwners: {
					select: { userAddress: true, amount: true },
					orderBy: { amount: Prisma.SortOrder.desc },
					take: 10
				}
			}),
			...(query.tx && {
				_count: { select: { tokenTransaction: true } }
			}),
			...(query.holders && {
				_count: { select: { tokenOwners: true } }
			})
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
			...(query.latest ? [{ createdAt: query.latest }] : [])
		]

		const [tokens, total] = await Promise.all([
			this.prisma.token.findMany({
				skip,
				take: query.take,
				orderBy: orderBy.length ? orderBy : undefined,
				include: Object.keys(include).length ? include : undefined,
				where
			}),
			this.prisma.token.count({ where })
		])

		let favoriteTokens: string[] = []
		if (userAddress) {
			const favorites = await this.prisma.tokenFavorite.findMany({
				where: { userAddress }
			})
			favoriteTokens = favorites.map(
				(fav: { tokenAddress: string }) => fav.tokenAddress
			)
		}

		const priceChanges = await Promise.all(
			tokens.map(token =>
				this.tokenTransaction.getPriceChangePercentages(token.address)
			)
		)

		const transformedTokens = tokens.map((token, index) => {
			const { _count, ...rest } = token as Prisma.TokenGetPayload<{
				include: {
					_count: { select: { TokenTransaction: true; tokenOwners: true } }
				}
			}>

			return {
				...rest,
				...(query.tx && { amountTx: _count?.TokenTransaction || 0 }),
				amountHolders: _count?.tokenOwners || 0,
				priceChange: priceChanges[index],
				isFavorite: userAddress ? favoriteTokens.includes(token.address) : false
			}
		})

		if (query.priceChange1h || query.priceChange24h || query.priceChange7d) {
			const sortKey = query.priceChange1h
				? "1h"
				: query.priceChange24h
					? "24h"
					: "7d"
			const sortOrder =
				query.priceChange1h || query.priceChange24h || query.priceChange7d

			transformedTokens.sort((a, b) => {
				const changeA = a.priceChange[sortKey] || 0
				const changeB = b.priceChange[sortKey] || 0
				return sortOrder === "desc" ? changeB - changeA : changeA - changeB
			})
		}

		return {
			tokens: transformedTokens,
			total,
			maxPage: Math.ceil(total / query.take)
		}
	}

	async findAllByPage(page: number, take: number) {
		const skip = (page - 1) * take

		const [tokens, total] = await Promise.all([
			this.prisma.token.findMany({
				skip,
				take,
				orderBy: {
					createdAt: "desc"
				},
				include: {
					creator: {
						select: {
							id: true,
							address: true,
							username: true
						}
					}
				}
			}),
			this.prisma.token.count()
		])

		return {
			tokens,
			total,
			maxPage: Math.ceil(total / take)
		}
	}

	async findOneByAddress(address: string) {
		return this.prisma.token.findUnique({
			where: {
				address
			},
			include: {
				creator: true,
				tokenOwners: {
					include: {
						user: true
					},
					orderBy: {
						amount: "desc"
					},
					take: 20
				}
			}
		})
	}

	findById(tokenId: string) {
		return this.prisma.token.findFirst({
			where: {
				id: tokenId
			}
		})
	}

	findWithPrivateKey(id: string) {
		return this.prisma.token.findFirst({
			where: {
				id
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

	async getCoinCreated(address: string, params: GetCoinCreatedParams) {
		const { page, take } = params
		const skip = (page - 1) * take

		const [total, coinCreated] = await Promise.all([
			this.prisma.token.count({
				where: {
					address
				}
			}),
			this.prisma.token.findMany({
				where: {
					address
				},
				orderBy: {
					updatedAt: "desc"
				},
				skip,
				take
			})
		])

		return {
			total,
			maxPage: Math.ceil(total / take),
			data: coinCreated
		}
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

	async updateTokenOnchain(address: string, data: Prisma.TokenUpdateInput) {
		return this.prisma.$transaction(async tx => {
			const token = await tx.token.update({
				where: { address },
				data,
				include: {
					tokenKey: true
				}
			})

			if (token.tokenKey) {
				await tx.tokenKey.update({
					where: { id: token.tokenKey.id },
					data: {
						privateKey: `cleared_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
					}
				})
			}

			return token
		})
	}

	async findMaxMarketCap() {
		return this.prisma.token.findFirst({
			where: {
				isCompletedBondingCurve: false
			},
			orderBy: {
				marketCapacity: "desc"
			}
		})
	}

	async update(address: string, payload: Prisma.TokenUpdateInput) {
		return this.prisma.token.update({
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
				isCompletedKingOfHill: true
			},
			orderBy: { marketCapacity: "desc" }
		})
	}

	//   Find token by address
	findByAddress(address: string) {
		return this.prisma.token.findUnique({ where: { address } })
	}

	//   Get 20 silimar market cap tokens
	findSimilar(marketCapacity: number) {
		return this.prisma.token.findMany({
			where: { marketCapacity: { lte: marketCapacity } },
			orderBy: { createdAt: "desc" },
			take: 20
		})
	}

	// Get latest on chain token
	getLatestOnChain() {
		return this.prisma.token.findFirst({
			where: { bump: true, bumpAt: { not: null } },
			orderBy: { bumpAt: "desc" },
			select: {
				id: true,
				address: true,
				uri: true,
				creator: true
			}
		})
	}
}
