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
import {
	encodeTransaction,
	keypairFromPrivateKey
} from "@root/_shared/helpers/encode-decode-tx"
import { Claims } from "@root/auth/auth.service"
import { S3Service } from "@root/file/file.service"
import { Ponz } from "@root/programs/ponz/program"
import { InjectConnection } from "@root/programs/programs.module"
import {
	CreateTokenPayload,
	FindTokenParams,
	ListTransactionParams
} from "@root/tokens/dtos/payload.dto"
import { FindTokenResponse } from "@root/tokens/dtos/response.dto"
import { PublicKey } from "@solana/web3.js"
import { plainToInstance } from "class-transformer"

@Injectable()
export class TokensService {
	constructor(
		private token: TokenRepository,
		private tokenKey: TokenKeyRepository,
		private tokenOwner: TokenOwnerRepository,
		private comment: CommentRepository,
		private user: UserRepository,
		private s3Service: S3Service,
		private tokenTransaction: TokenTransactionRepository,
		private ponz: Ponz,
		@InjectConnection() private connection: web3.Connection
	) {}

	// Create token
	async createToken(creatorAddress: string, payload: CreateTokenPayload) {
		const { description, name, ticker } = payload

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
			tokenKey: { connect: { publicKey: tokenKey.publicKey } },
			creator: { connect: { address: creatorAddress } }
		}

		// Create token
		return this.token.create({
			dataCreate: data,
			tokenKeyId: tokenKey.id,
			getImagePresignedUrl: this.getImagePresignedUrl.bind(this),
			postMetadataToS3: this.postMetadateToS3.bind(this)
		})
	}

	async broadcastCreateOnChain(payload: ICreateTokenOnchainPayload) {
		const token = await this.token.findWithPrivateKey(payload.tokenID)
		if (!token) throw new NotFoundException("not found token")

		if (token.bump)
			throw new InternalServerErrorException("token already create")

		const tokenKeypair = keypairFromPrivateKey(token.tokenKey.privateKey)
		const transferFeeBasisPoints = 1000 // 1% = 100
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
			tx = await this.ponz.createTokenAndBuyTx(
				tokenMetadata,
				new PublicKey(token.address),
				new PublicKey(payload.creatorAddress),
				tokenKeypair,
				payload.minSol,
				payload.maxSol
			)
		} catch (error) {
			console.log("err: ", error)
			throw new InternalServerErrorException("Failed to create transaction")
		}

		return encodeTransaction(tx)
	}

	find(
		params: FindTokenParams
	): Promise<{ tokens: FindTokenResponse[]; total: number; maxPage: number }> {
		return this.token.find(params).then(result => ({
			tokens: plainToInstance(FindTokenResponse, result.tokens, {
				excludeExtraneousValues: true,
				enableImplicitConversion: true
			}),
			total: result.total,
			maxPage: result.maxPage
		}))
	}

	//   Get image url & authorize data to push image Aws3
	async getImagePresignedUrl(tokenId: string) {
		const key = `token-image-${tokenId}`
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

	//   Get image url & authorize data to push image Aws3
	async postMetadateToS3(tokenId: string, metadata: Object) {
		const key = `token-metadata-${tokenId}`
		const { success } = await this.s3Service.uploadJsonFile(key, metadata)
		if (!success)
			throw new InternalServerErrorException("Can not post metadata")
		return success
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
					token,
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
	async getTransactions(
		address: string,
		query: ListTransactionParams,
		user: Claims
	) {
		const { filterBy, minimumLamports, page, take } = query
		const token = await this.token.findByAddress(address)
		if (!token) throw new NotFoundException("Not found token")

		const getListTransaction = this.tokenTransaction.paginate({
			tokenAddress: address,
			filterBy,
			minimumLamports,
			page,
			take,
			user
		})

		const getTotal = this.tokenTransaction.count({
			tokenAddress: address,
			filterBy,
			minimumLamports,
			user
		})

		const [listTransaction, total] = await Promise.all([
			getListTransaction,
			getTotal
		])

		return {
			data: listTransaction,
			total,
			maxPage: Math.ceil(total / take)
		}
	}
}
