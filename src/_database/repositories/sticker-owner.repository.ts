import { Injectable } from "@nestjs/common"
import {
	GetFrequentlyUsedStickersParams,
	PaginateStickerParams
} from "@root/stickers/dtos/payload.dto"
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

	// Get frequently used in comment
	async getFrequentlyUsedInComment(
		payload: { ownerId: string } & GetFrequentlyUsedStickersParams
	) {
		const { ownerId, take = 5 } = payload
		const topStickers = await this.prisma.comment.groupBy({
			by: ["stickerId"],
			where: {
				stickerId: {
					not: null
				},
				authorId: ownerId
			},
			_count: {
				stickerId: true
			},
			orderBy: {
				_count: {
					stickerId: "desc"
				}
			},

			take
		})

		const listStickerId = topStickers
			.map(i => i.stickerId)
			.filter((id): id is string => id !== null)

		const listOwnedSticker = await this.prisma.stickerOwner.findMany({
			where: {
				owner: { id: ownerId },
				stickerId: { in: listStickerId }
			},
			include: {
				sticker: true
			}
		})

		return listOwnedSticker.sort((a, b) => {
			const countA =
				topStickers.find(i => i.stickerId === a.stickerId)?._count.stickerId ||
				0
			const countB =
				topStickers.find(i => i.stickerId === b.stickerId)?._count.stickerId ||
				0
			return countB - countA
		})
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
