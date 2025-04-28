import { Injectable } from "@nestjs/common"
import { PrismaService } from "../prisma.service"

@Injectable()
export class StickerOwnerRepository {
	constructor(private prisma: PrismaService) {}

	findAllByUserAddress(ownerAddress: string) {
		return this.prisma.stickerOwner.findMany({
			where: { ownerAddress },
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
