import { Injectable } from "@nestjs/common"
import { Prisma } from "@prisma/client"
import { PrismaService } from "@root/_database/prisma.service"
import { RedisService } from "@root/_redis/redis.service"

type CreateUserIfNotExistParams = {
	address: string
}

@Injectable()
export class UserRepository {
	constructor(
		private prisma: PrismaService,
		private redis: RedisService
	) {}

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
			include: {
				social: true
			},
			data: payload
		})
	}

	async updateSocial(id: string, payload: Prisma.UserSocialUpdateInput) {
		return this.prisma.user.update({
			where: {
				id
			},
			data: payload
		})
	}

	findByAddress(address: string) {
		return this.redis.getOrSet(
			`findUserByUsername:${address}`,
			async () => {
				return this.prisma.user.findFirst({
					where: {
						address
					},
					include: {
						social: true
					}
				})
			},
			3
		)
	}

	async findByUsername(username: string) {
		return this.redis.getOrSet(
			`findUserByUsername:${username}`,
			async () => {
				return this.prisma.user.findFirst({
					where: {
						username
					},
					include: {
						social: true
					}
				})
			},
			3
		)
	}

	async findById(id: string) {
		return this.redis.getOrSet(
			`findUserById:${id}`,
			async () => {
				return this.prisma.user.findUnique({
					where: {
						id
					},
					include: {
						social: true
					}
				})
			},
			3
		)
	}
}
