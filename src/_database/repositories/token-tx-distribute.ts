import { Injectable } from "@nestjs/common"
import { Prisma } from "@prisma/client"
import { RedisService } from "@root/_redis/redis.service"
import { PrismaService } from "../prisma.service"

@Injectable()
export class TokenTransactionDistributeRepository {
	constructor(
		private prisma: PrismaService,
		private redis: RedisService
	) {}

	async insert(data: Prisma.TokenTransactionDistributeCreateInput) {
		return this.prisma.tokenTransactionDistribute.create({ data })
	}

	async insertManyWithSign(
		data: Prisma.TokenTransactionDistributeCreateInput[]
	) {
		return this.prisma.tokenTransactionDistribute.createMany({ data })
	}
}
