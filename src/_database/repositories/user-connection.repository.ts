import { Injectable } from "@nestjs/common"
import { PrismaService } from "@root/_database/prisma.service"

type CreateUserConnectionParams = {
	followerId: string
	followingId: string
}

@Injectable()
export class UserConnectionRepository {
	constructor(private prisma: PrismaService) {}

	async create(params: CreateUserConnectionParams) {
		return this.prisma.userConnection.create({
			data: {
				followerId: params.followerId,
				followingId: params.followingId
			}
		})
	}

	async delete(id: string) {
		return this.prisma.userConnection.delete({
			where: { id }
		})
	}

	async findById(id: string) {
		return this.prisma.userConnection.findUnique({
			where: { id }
		})
	}

	async find(id: string, followingId: string) {
		return this.prisma.userConnection.findFirst({
			where: {
				followerId: id,
				followingId: followingId
			}
		})
	}
}
