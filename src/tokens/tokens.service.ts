import {
	Injectable,
	InternalServerErrorException,
	NotFoundException
} from "@nestjs/common"
import { Decimal } from "@prisma/client/runtime/library"
import { CommentRepository } from "@root/_database/repositories/comment.repository"
import { TokenKeyRepository } from "@root/_database/repositories/token-key.repository"
import { TokenOwnerRepository } from "@root/_database/repositories/token-owner.repository"
import { TokenRepository } from "@root/_database/repositories/token.repository"
import { UserRepository } from "@root/_database/repositories/user.repository"
import { TOKEN_TOTAL_SUPPLY_DEFAULT } from "@root/_shared/constants/token"
import {
	ICreateTokenPayload,
	ICreateTokenResponse
} from "@root/_shared/types/token"
import { S3Service } from "@root/file/file.service"

@Injectable()
export class TokensService {
	constructor(
		private token: TokenRepository,
		private tokenKey: TokenKeyRepository,
		private tokenOwner: TokenOwnerRepository,
		private comment: CommentRepository,
		private user: UserRepository,
		private s3Service: S3Service
	) {}

	// Create token
	async createToken(
		payload: ICreateTokenPayload
	): Promise<ICreateTokenResponse> {
		const { description, name, ticker, creatorAddress } = payload

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

		const metadata = {
			ticker,
			name
		}

		const data = {
			description,
			name,
			ticker,
			metadata,
			uri: "",
			address: tokenKey.publicKey,
			creator: { connect: { address: creatorAddress } }
		}

		// Create token
		return this.token.create({
			dataCreate: data,
			tokenKeyId: tokenKey.id,
			getImagePresignedUrl: this.getImagePresignedUrl.bind(this)
		})
	}

	//   Get image url & authorize data to push image Aws3
	async getImagePresignedUrl(tokenId: string) {
		const key = `token-${tokenId}`
		const { fields, url } = await this.s3Service.postPresignedSignedUrl(key)
		if (!url || !fields)
			throw new InternalServerErrorException("Can not post presigned url")
		const imageUri = `${url}${key}`
		return {
			imageUri,
			url,
			fields
		}
	}

	/*  Get detail token by address (public key)
    - percent of King of Hill: its marketCap / highest marketcap of token (is not bonding curve)
    - percent of Bonding Curve: its marketCap / bondingCurve
  */
	async getByAddress(address: string) {
		const token = await this.token.findByAddress(address)
		if (!token) throw new NotFoundException("Not found token")

		const [tokenKingOfHill, totalReplies] = await Promise.all([
			this.token.findKingOfHill(),
			this.comment.countByTokenId({ where: { tokenId: token.id } })
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
			totalReplies,
			percentOfBondingCurve,
			percentOfKingOfHill
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
}
