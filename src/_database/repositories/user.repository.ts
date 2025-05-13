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
		const user = await this.exist(params.address)

		if (!user) {
			return this.redis.setFunc(
				`user-exist:${params.address}`,
				async () => {
					return this.prisma.user.create({
						data: {
							address: params.address,
							username: params.address.slice(0, 8)
						}
					})
				},
				5
			)
		}

		return user
	}

	async exist(address: string) {
		return this.redis.getOrSet(
			`user-exist:${address}`,
			async () => {
				return this.prisma.user.findFirst({
					where: {
						address
					}
				})
			},
			3
		)
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

	async findById(
		id: string,
		include?: Prisma.UserInclude,
		orderBy?: Prisma.UserOrderByWithRelationInput
	) {
		return this.redis.getOrSet(
			`findUserById:${id}, include: ${include}, orderBy: ${orderBy}`,
			async () => {
				return this.prisma.user.findFirst({
					where: {
						id
					},
					orderBy: orderBy ?? undefined,
					include: {
						...include,
						social: true
					}
				})
			},
			3
		)
	}
}
