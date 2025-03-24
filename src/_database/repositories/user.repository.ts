import { Injectable } from "@nestjs/common"
import { Prisma } from "@prisma/client"
import { PrismaService } from "@root/_database/prisma.service"

type CreateUserIfNotExistParams = {
	address: string
}

@Injectable()
export class UserRepository {
	constructor(private prisma: PrismaService) {}

	async createIfNotExist(params: CreateUserIfNotExistParams) {
		const user = await this.findByAddress(params.address)

		if (!user) {
			return this.prisma.user.create({
				data: {
					address: params.address
				}
			})
		}

		return user
	}

	async update(id: string, payload: Prisma.UserUpdateInput) {
		return this.prisma.user.update({
			where: {
				id
			},
			data: payload
		})
	}

	findByAddress(address: string) {
		return this.prisma.user.findFirst({
			where: {
				address
			}
		})
	}

	findByUsername(username: string) {
		return this.prisma.user.findFirst({
			where: {
				username
			}
		})
	}

	findById(id: string) {
		return this.prisma.user.findUnique({
			where: {
				id
			},
			include: {
				follower: true,
				following: true
			}
		})
	}
}
