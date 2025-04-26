import {
	ForbiddenException,
	Injectable,
	InternalServerErrorException,
	NotFoundException
} from "@nestjs/common"
import { StickerRepository } from "@root/_database/repositories/sticker.repository"
import { S3Service } from "@root/file/file.service"
import { v4 as uuidv4 } from "uuid"
import { CreateStickerPayload } from "./dtos/payload.dto"
@Injectable()
export class StickersService {
	constructor(
		private sticker: StickerRepository,
		private s3Service: S3Service
	) {}

	async getByUserAddress(userAddress: string) {
		return this.sticker.find({ userAddress })
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
			user: { connect: { address: userAddress } }
		})
		return {
			sticker,
			attachment: { fields, url }
		}
	}

	async delete(id: string, userAddress: string) {
		const sticker = await this.sticker.findById(id)
		if (!sticker) throw new NotFoundException("Not found sticker")

		if (sticker.userAddress !== userAddress)
			throw new ForbiddenException("Not allow delete")

		await this.sticker.delete(id)
		await this.s3Service.deleteFile(sticker.uri)
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
