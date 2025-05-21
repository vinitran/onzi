import {
	ForbiddenException,
	Injectable,
	InternalServerErrorException,
	NotFoundException
} from "@nestjs/common"
import { StickerOwnerRepository } from "@root/_database/repositories/sticker-owner.repository"
import { StickerRepository } from "@root/_database/repositories/sticker.repository"
import { S3Service } from "@root/file/file.service"
import { v4 as uuidv4 } from "uuid"
import {
	CreateStickerPayload,
	GetFrequentlyUsedStickersParams,
	PaginateStickerParams
} from "./dtos/payload.dto"
@Injectable()
export class StickersService {
	constructor(
		private sticker: StickerRepository,
		private stickerOwner: StickerOwnerRepository,
		private s3Service: S3Service
	) {}

	async getByUserId(
		payload: { ownerId: string; userAddress?: string } & PaginateStickerParams
	) {
		const { ownerId, page, take, userAddress } = payload
		const {
			data: ownerStickers,
			maxPage,
			total
		} = await this.stickerOwner.paginateByUserId({
			userId: ownerId,
			page,
			take
		})

		const formatData = await Promise.all(
			ownerStickers.map(async ownerSticker => {
				let isOwned = false
				if (userAddress)
					isOwned = !!(await this.stickerOwner.findOne({
						ownerAddress: userAddress,
						stickerId: ownerSticker.stickerId
					}))

				return {
					...ownerSticker,
					isOwned
				}
			})
		)

		return {
			data: formatData,
			maxPage,
			total
		}
	}

	getFrequentlyUsed(
		payload: { ownerId: string } & GetFrequentlyUsedStickersParams
	) {
		return this.stickerOwner.getFrequentlyUsedInComment(payload)
	}

	//   Create sticker
	async create(payload: CreateStickerPayload & { userAddress: string }) {
		const { contentType, userAddress } = payload
		const stickerId = uuidv4()

		const { attachmentUrl, fields, url } = await this.getAttachmentPresignedUrl(
			{
				contentType: contentType,
				userAddress,
				stickerId
			}
		)

		const sticker = await this.sticker.create({
			uri: attachmentUrl,
			creator: { connect: { address: userAddress } }
		})

		return {
			sticker,
			attachment: { fields, url }
		}
	}

	// Delete sticker by creator
	async delete(id: string, userAddress: string) {
		const sticker = await this.sticker.findById(id)
		if (!sticker) throw new NotFoundException("Not found sticker")

		if (sticker.creatorAddress !== userAddress)
			throw new ForbiddenException("Not allow delete")

		await this.sticker.delete(id)
		await this.s3Service.deleteFile(this.s3Service.getKeyS3(sticker.uri))
	}

	// Add sticker to become owner
	async addStickerOnwer(payload: { ownerAddress: string; stickerId: string }) {
		const stickerOwner = await this.stickerOwner.findOne(payload)
		if (stickerOwner) throw new ForbiddenException("Owned this sticker!")
		return this.stickerOwner.create(payload)
	}

	// Remove sticker
	async removeStickerOwner(payload: {
		ownerAddress: string
		stickerId: string
	}) {
		const stickerOwner = await this.stickerOwner.findOne(payload)
		if (!stickerOwner) throw new ForbiddenException("Not own this sticker!")
		// Creator not allow to remove owned permission
		if (stickerOwner.ownerAddress === stickerOwner.sticker.creatorAddress) {
			throw new ForbiddenException("Not permission!")
		}
		return this.stickerOwner.delete(payload)
	}

	//   Get uri
	async getAttachmentPresignedUrl(payload: {
		userAddress: string
		stickerId: string
		contentType: string
	}) {
		const { stickerId, userAddress, contentType } = payload

		const key = `sticker-${userAddress}-${stickerId}`
		const { fields, url } = await this.s3Service.postPresignedSignedUrl(
			key,
			contentType
		)
		if (!url || !fields)
			throw new InternalServerErrorException("Can not post presigned url")

		const attachmentUrl = `${url}${fields.key}` //fields.key contains .png, .gif, ....
		return {
			attachmentUrl,
			url,
			fields
		}
	}
}
