import { Injectable } from "@nestjs/common"
import { Prisma } from "@prisma/client"
import { ICreateToken } from "@root/_shared/types/token"
import { FindTokenParams } from "@root/tokens/dtos/payload.dto"
import { GetCoinCreatedParams } from "@root/users/dtos/payload.dto"
import { PrismaService } from "../prisma.service"
import { TokenTransactionRepository } from "./token-transaction.repository"

@Injectable()
export class TokenRepository {
	constructor(
		private prisma: PrismaService,
		private tokenTransaction: TokenTransactionRepository
	) {}

	async find(query: FindTokenParams) {
		const skip = (query.page - 1) * query.take
		let where: Prisma.TokenWhereInput = {}

		if (query.searchText) {
			where = {
				OR: [
					{
						name: {
							contains: query.searchText,
							mode: "insensitive"
						}
					},
					{
						ticker: {
							contains: query.searchText,
							mode: "insensitive"
						}
					}
				]
			}
		}

		const include: Prisma.TokenInclude = {
			...(query.detail && {
				creator: {
					select: { address: true, username: true }
				},
				tokenOwners: {
					select: { userAddress: true, amount: true },
					orderBy: { amount: Prisma.SortOrder.desc }
				}
			}),
			...(query.tx && {
				_count: { select: { TokenTransaction: true } }
			}),
			...(query.holders && {
				_count: { select: { tokenOwners: true } }
			})
		}

		const orderBy: Prisma.TokenOrderByWithRelationInput[] = [
			...(query.marketCap ? [{ marketCapacity: query.marketCap }] : []),
			...(query.price ? [{ price: query.price }] : []),
			...(query.tx ? [{ TokenTransaction: { _count: query.tx } }] : []),
			...(query.volumn ? [{ volumn: query.volumn }] : []),
			...(query.holders ? [{ tokenOwners: { _count: query.holders } }] : []),
			...(query.latest ? [{ createdAt: query.latest }] : [])
		]

		// Execute queries in parallel
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

		// Get price changes for all tokens
		const priceChanges = await Promise.all(
			tokens.map(token =>
				this.tokenTransaction.getPriceChangePercentages(token.address)
			)
		)

		// Transform response
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
				priceChange: priceChanges[index]
			}
		})

		// Sort by price change if specified
		if (query.priceChange1h || query.priceChange24h || query.priceChange7d) {
			transformedTokens.sort((a, b) => {
				if (query.priceChange1h) {
					const changeA = a.priceChange["1h"] || 0
					const changeB = b.priceChange["1h"] || 0
					return query.priceChange1h === "desc"
						? changeB - changeA
						: changeA - changeB
				}
				if (query.priceChange24h) {
					const changeA = a.priceChange["24h"] || 0
					const changeB = b.priceChange["24h"] || 0
					return query.priceChange24h === "desc"
						? changeB - changeA
						: changeA - changeB
				}
				if (query.priceChange7d) {
					const changeA = a.priceChange["7d"] || 0
					const changeB = b.priceChange["7d"] || 0
					return query.priceChange7d === "desc"
						? changeB - changeA
						: changeA - changeB
				}
				return 0
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
					}
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

		const getTotal = this.prisma.token.count({
			where: {
				address
			}
		})

		const getCoins = this.prisma.token.findMany({
			where: {
				address
			},
			orderBy: {
				updatedAt: "desc"
			},
			skip: (page - 1) * take,
			take
		})

		const [total, coinCreated] = await Promise.all([getTotal, getCoins])

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

	/**  Create token
	 * - Create token
	 * - Get image uri from Aws3
	 * - Update metadata & uri
	 * - Update status (picked) for selected tokenKey
	 */
	create(data: ICreateToken) {
		const { dataCreate, tokenKeyId, getImagePresignedUrl, postMetadataToS3 } =
			data
		return this.prisma.$transaction(async tx => {
			let token = await tx.token.create({
				data: { ...dataCreate },
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

			// Get image uri
			const { imageUri, fields, url } = await getImagePresignedUrl(token.id)

			// Update new metadata & uri (image url)
			const newMetadata = {
				ticker: token.ticker,
				name: token.name,
				description: token.description,
				image: imageUri
			}

			const uploadMetadata = await postMetadataToS3(token.id, newMetadata)
			if (!uploadMetadata) {
				throw new Error(
					"Failed to upload metadata to S3. Token creation aborted."
				)
			}

			//   Update token & status picked of token key
			const [updatedToken] = await Promise.all([
				tx.token.update({
					where: { id: token.id },
					data: {
						uri: `${url}token-metadata-${token.id}`,
						metadata: newMetadata
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
				tx.tokenKey.update({
					where: { id: tokenKeyId },
					data: { isPicked: true }
				})
			])

			token = updatedToken

			return {
				token,
				attachment: {
					fields,
					url
				}
			}
		})
	}

	updateMarketCap(address: string, marketCapacity: number) {
		return this.prisma.token.update({
			where: {
				address
			},
			data: {
				marketCapacity
			}
		})
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

	async updatePrice(id: string, price: number) {
		return this.prisma.token.update({
			where: {
				id
			},
			data: {
				price
			}
		})
	}
}
