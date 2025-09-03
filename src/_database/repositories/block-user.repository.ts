import { Injectable } from "@nestjs/common"
import { BlockUserType, Prisma } from "@prisma/client"
import { PrismaService } from "../prisma.service"

@Injectable()
export class BlockUserRepository {
	constructor(private prisma: PrismaService) {}

	create(data: Prisma.BlockUserCreateInput) {
		return this.prisma.blockUser.create({
			data
		})
	}

	createMany(data: Prisma.BlockUserCreateManyInput[]) {
		return this.prisma.blockUser.createMany({ data })
	}

	findByUserId(userId: string) {
		return this.prisma.blockUser.findMany({
			where: { userId }
		})
	}

	findByType(userId: string, type: BlockUserType) {
		return this.prisma.blockUser.findFirst({
			where: { userId, type }
		})
	}

	deleteById(id: string) {
		return this.prisma.blockUser.delete({
			where: { id }
		})
	}

	async isBlockedPermanentUserBy(userId: string, type: BlockUserType) {
		const blockUser = await this.prisma.blockUser.findFirst({
			where: { userId, type, isPermanent: true }
		})
		return !!blockUser
	}
}
