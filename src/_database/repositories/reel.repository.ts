import { Injectable } from "@nestjs/common"
import { Prisma } from "@prisma/client"
import { PaginateListReelParams } from "@root/reels/dtos/payload.dto"
import { PrismaService } from "../prisma.service"

@Injectable()
export class ReelRepository {
	constructor(private prisma: PrismaService) {}

	findById(id: string) {
		return this.prisma.reel.findUnique({ where: { id } })
	}

	getDetail(id: string) {
		return this.prisma.reel.findUnique({
			where: { id },
			include: {
				token: {
					select: {
						id: true,
						address: true,
						name: true,
						imageUri: true,
						marketCapacity: true,
						description: true
					}
				}
			}
		})
	}

	paginateByTokenId(
		payload: PaginateListReelParams & {
			tokenId: string
			orderBy?: Prisma.ReelOrderByWithRelationInput
		}
	) {
		const { page, take, tokenId, orderBy = { createdAt: "desc" } } = payload
		const skip = take * (page - 1)

		return this.prisma.reel.findMany({
			where: {
				tokenId
			},
			orderBy,
			skip,
			take
		})
	}

	getTotalByTokenId(tokenId: string) {
		return this.prisma.reel.count({ where: { tokenId } })
	}

	create(payload: Prisma.ReelCreateInput) {
		return this.prisma.reel.create({ data: payload })
	}

	increaseView(id: string) {
		return this.prisma.reel.update({
			where: { id },
			data: {
				viewAmount: {
					increment: 1
				}
			}
		})
	}

	delete(id: string) {
		return this.prisma.reel.delete({
			where: {
				id
			}
		})
	}
}
