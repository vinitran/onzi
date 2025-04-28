import { Injectable } from "@nestjs/common"
import { Prisma } from "@prisma/client"
import { PrismaService } from "../prisma.service"

@Injectable()
export class StickerRepository {
	constructor(private prisma: PrismaService) {}

	find(where: Prisma.StickerWhereInput) {
		return this.prisma.sticker.findMany({ where })
	}

	findById(id: string) {
		return this.prisma.sticker.findUnique({ where: { id } })
	}

	create(data: Prisma.StickerCreateInput) {
		return this.prisma.$transaction(async tx => {
			const sticker = await tx.sticker.create({ data })
			await tx.stickerOwner.create({
				data: {
					stickerId: sticker.id,
					ownerAddress: sticker.creatorAddress
				}
			})
			return sticker
		})
	}

	delete(id: string) {
		return this.prisma.sticker.delete({ where: { id } })
	}
}
