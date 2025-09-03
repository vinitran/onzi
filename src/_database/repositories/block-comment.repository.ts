import { Injectable } from "@nestjs/common"
import { Prisma } from "@prisma/client"
import { PrismaService } from "../prisma.service"

@Injectable()
export class BlockCommentRepository {
	constructor(private prisma: PrismaService) {}

	async findOne(payload: { userId: string; tokenId: string }) {
		return this.prisma.blockComment.findUnique({
			where: { userId_tokenId: payload }
		})
	}

	async create(payload: Prisma.BlockCommentCreateInput) {
		return this.prisma.blockComment.create({
			data: payload
		})
	}

	async delete(payload: { userId: string; tokenId: string }) {
		return this.prisma.blockComment.delete({
			where: { userId_tokenId: payload }
		})
	}

	async getAllByTokenId(tokenId: string) {
		return this.prisma.blockComment.findMany({
			where: {
				tokenId
			},
			include: {
				user: {
					select: {
						id: true,
						username: true,
						address: true,
						avatarUrl: true
					}
				}
			}
		})
	}
}
