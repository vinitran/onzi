import {
	ForbiddenException,
	Injectable,
	InternalServerErrorException,
	NotFoundException
} from "@nestjs/common"
import { Reel } from "@prisma/client"
import { ReelRepository } from "@root/_database/repositories/reel.repository"
import { TokenRepository } from "@root/_database/repositories/token.repository"
import { Paginate } from "@root/dtos/common.dto"
import { S3Service } from "@root/file/file.service"
import { v4 as uuidv4 } from "uuid"
import { CreateReelPayload, PaginateListReelParams } from "./dtos/payload.dto"

type CreateReel = CreateReelPayload & {
	userId: string
	tokenId: string
}

@Injectable()
export class ReelsService {
	constructor(
		private reel: ReelRepository,
		private s3Service: S3Service,
		private token: TokenRepository
	) {}

	async create(payload: CreateReel) {
		const { caption, tokenId, userId } = payload

		const token = await this.token.findById(tokenId)

		if (!token) throw new NotFoundException("Not found token")
		if (token.creator.id !== userId)
			throw new ForbiddenException(
				"Only creator token just allow to create reel"
			)

		const reelId = uuidv4()
		const { fields, url, videoUri } = await this.getVideoPresignedUrl(reelId)
		const reel = await this.reel.create({
			caption,
			videoUri,
			creator: { connect: { id: userId } },
			token: { connect: { id: tokenId } }
		})

		return { reel, attachment: { fields, url } }
	}

	async updateView(reelId: string) {
		const reel = await this.reel.findById(reelId)
		if (!reel) throw new NotFoundException("Not found reel")
		return this.reel.increaseView(reelId)
	}

	async paginate(
		payload: PaginateListReelParams & { tokenId: string }
	): Promise<Paginate<Reel>> {
		const { tokenId, take } = payload
		const [data, total] = await Promise.all([
			this.reel.paginateByTokenId(payload),
			this.reel.getTotalByTokenId(tokenId)
		])

		return {
			data,
			total,
			maxPage: Math.ceil(total / take)
		}
	}

	//   Get video url & authorize data to push video Aws3
	async getVideoPresignedUrl(reelId: string) {
		const key = `token-reel-${reelId}`
		const { fields, url } = await this.s3Service.postPresignedSignedUrl(
			key,
			"video/mp4"
		)
		if (!url || !fields)
			throw new InternalServerErrorException("Can not post presigned url")
		const videoUri = `${url}${fields.key}`
		return {
			videoUri,
			url,
			fields
		}
	}
}
