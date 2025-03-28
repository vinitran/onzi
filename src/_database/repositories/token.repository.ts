import { Injectable } from "@nestjs/common"
import { ICreateToken } from "@root/_shared/types/token"
import { GetCoinCreatedParams } from "@root/users/dto/user.dto"
import { PrismaService } from "../prisma.service"

@Injectable()
export class TokenRepository {
	constructor(private prisma: PrismaService) {}

	findById(tokenId: string) {
		return this.prisma.token.findFirst({
			where: {
				id: tokenId
			}
		})
	}

	async getCoinCreated(query: GetCoinCreatedParams) {
		const { page, take, creatorAddress } = query

		const getTotal = this.prisma.token.count({
			where: {
				creatorAddress
			}
		})

		const getCoins = this.prisma.token.findMany({
			where: {
				creatorAddress
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
			coinCreated
		}
	}

	/**  Create token
	 * - Create token
	 * - Get image uri from Aws3
	 * - Update metadata & uri
	 * - Update status (picked) for selected tokenKey
	 */
	create(data: ICreateToken) {
		const { dataCreate, tokenKeyId, getImagePresignedUrl } = data
		return this.prisma.$transaction(async tx => {
			let token = await tx.token.create({ data: { ...dataCreate } })

			// Get image uri
			const { imageUri, fields, url } = await getImagePresignedUrl(token.id)

			// Update new metadata & uri (image url)
			const newMetadata = {
				ticker: token.ticker,
				name: token.name,
				uri: imageUri
			}

			//   Update token & status picked of token key
			const [updatedToken] = await Promise.all([
				tx.token.update({
					where: { id: token.id },
					data: {
						uri: imageUri,
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
}
