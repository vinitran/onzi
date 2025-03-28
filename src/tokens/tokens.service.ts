import {
	Injectable,
	InternalServerErrorException,
	NotFoundException
} from "@nestjs/common"
import { TokenKeyRepository } from "@root/_database/repositories/token-key.repository"
import { TokenRepository } from "@root/_database/repositories/token.repository"
import { UserRepository } from "@root/_database/repositories/user.repository"
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
		private user: UserRepository,
		private s3Service: S3Service
	) {}

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
}
