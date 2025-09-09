import { Injectable } from "@nestjs/common"
import { Prisma } from "@prisma/client"
import { PrismaService } from "@root/_database/prisma.service"
import { RedisService } from "@root/_redis/redis.service"
import { randomAvatar } from "@root/_shared/helpers/random-avatar"
import { S3Service } from "@root/file/file.service"

type CreateUserIfNotExistParams = {
	address: string
}

@Injectable()
export class UserRepository {
	constructor(
		private prisma: PrismaService,
		private redis: RedisService,
		private s3Service: S3Service
	) {}

	async createIfNotExist(params: CreateUserIfNotExistParams) {
		return this.redis.setFunc(
			`user-exist:${params.address}`,
			async () => {
				return this.prisma.user.upsert({
					where: { address: params.address },
					create: {
						address: params.address,
						username: params.address.slice(0, 8),
						avatarUrl: this.s3Service.getPermanentFileUrl(randomAvatar())
					},
					update: {}
				})
			},
			5
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

	async findByUsername(username: string, notUserId?: string) {
		return this.redis.getOrSet(
			`findUserByUsername:${username.toLowerCase()}`,
			async () => {
				const rows: any[] = await this.prisma.$queryRaw<any[]>`
					SELECT *
					FROM "user"
					WHERE LOWER("username") = LOWER(${username})
						AND (${notUserId}::uuid IS NULL OR "id" <> ${notUserId}::uuid)
						LIMIT 1;
				`;

				const user = rows[0] ?? null;
				if (!user) return null;

				// Load related social records to mirror `include: { social: true }`
				const social = await this.prisma.userSocial.findMany({ where: { userId: user.id } });
				return { ...user, social };
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
