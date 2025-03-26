import { Injectable } from "@nestjs/common"
import { PrismaService } from "@root/_database/prisma.service"
import { PaginatedParams } from "@root/_shared/utils/parsers"

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

	async find(followerId: string, followingId: string) {
		return this.prisma.userConnection.findFirst({
			where: {
				followerId,
				followingId
			}
		})
	}

	async getConnection(
		userId: string,
		type: "follower" | "following",
		query: PaginatedParams
	) {
		const whereCondition =
			type === "follower" ? { followingId: userId } : { followerId: userId }

		const { page, take } = query

		const getTotal = this.prisma.userConnection.count({
			where: whereCondition
		})

		const getConnections = this.prisma.userConnection.findMany({
			where: whereCondition,
			orderBy: {
				updatedAt: "desc"
			},
			skip: (page - 1) * take,
			take
		})

		const [total, connections] = await Promise.all([getTotal, getConnections])

		return {
			total,
			maxPage: Math.ceil(total / take),
			connections
		}
	}
}
