import { Injectable } from "@nestjs/common"
import { PaginateStickerParams } from "@root/stickers/dtos/payload.dto"
import { PrismaService } from "../prisma.service"

@Injectable()
export class StickerOwnerRepository {
	constructor(private prisma: PrismaService) {}

	//   Paginate by user id
	async paginateByUserId(payload: { userId: string } & PaginateStickerParams) {
		const { userId, page = 1, take = 12 } = payload
		const skip = (page - 1) * take
		const [data, total] = await Promise.all([
			this.prisma.stickerOwner.findMany({
				where: { owner: { id: userId } },
				include: { sticker: true },
				take,
				skip,
				orderBy: { createdAt: "desc" }
			}),
			this.prisma.stickerOwner.count({
				where: { owner: { id: userId } }
			})
		])
		return {
			total,
			maxPage: Math.ceil(total / take),
			data
		}
	}

	//   Get list sticker user own them
	findAllByUserId(userId: string) {
		return this.prisma.stickerOwner.findMany({
			where: { owner: { id: userId } }
		})
	}

	findOne(data: { ownerAddress: string; stickerId: string }) {
		return this.prisma.stickerOwner.findUnique({
			where: { ownerAddress_stickerId: data },
			include: { sticker: true }
		})
	}

	findOneByOwnerId(data: { userId: string; stickerId: string }) {
		return this.prisma.stickerOwner.findFirst({
			where: {
				owner: { id: data.userId },
				stickerId: data.stickerId
			}
		})
	}

	create(data: { ownerAddress: string; stickerId: string }) {
		return this.prisma.stickerOwner.create({
			data
		})
	}

	delete(data: { ownerAddress: string; stickerId: string }) {
		return this.prisma.stickerOwner.delete({
			where: { ownerAddress_stickerId: data }
		})
	}
}
