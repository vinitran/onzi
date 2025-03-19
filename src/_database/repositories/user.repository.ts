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
			return this.prisma.users.create({
				data: {
					address: params.address
				}
			})
		}

		return user
	}

	async update(id: string, payload: Prisma.usersUpdateInput) {
		return this.prisma.users.update({
			where: {
				id
			},
			data: payload
		})
	}

	findByAddress(address: string) {
		return this.prisma.users.findFirst({
			where: {
				address
			}
		})
	}

	findById(id: string) {
		return this.prisma.users.findUnique({
			where: {
				id
			}
		})
	}
}
