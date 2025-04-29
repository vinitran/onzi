import { Injectable } from "@nestjs/common"
import { PrismaService } from "../prisma.service"

@Injectable()
export class StickerOwnerRepository {
	constructor(private prisma: PrismaService) {}

	findAllByUserId(userId: string) {
		return this.prisma.stickerOwner.findMany({
			where: { owner: { id: userId } },
			include: { sticker: true }
		})
	}

	findOne(data: { ownerAddress: string; stickerId: string }) {
		return this.prisma.stickerOwner.findUnique({
			where: { ownerAddress_stickerId: data },
			include: { sticker: true }
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
