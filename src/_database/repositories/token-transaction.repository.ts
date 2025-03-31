import { Injectable } from "@nestjs/common"
import { Prisma } from "@prisma/client"
import { Claims } from "@root/auth/auth.service"
import { PrismaService } from "../prisma.service"
@Injectable()
export class TokenTransactionRepository {
	constructor(private prisma: PrismaService) {}

	getLatest() {
		return this.prisma.tokenTransaction.findFirst({
			orderBy: { createdAt: "desc" },
			select: {
				id: true,
				signature: true,
				tokenAddress: true,
				type: true,
				token: {
					select: {
						address: true,
						name: true,
						network: true,
						marketCapacity: true
					}
				},
				createdBy: {
					select: { username: true, address: true, avatarUrl: true }
				}
			}
		})
	}

	async paginate(payload: {
		tokenAddress: string
		filterBy?: "following" | "own"
		minimumLamports?: number
		page: number
		take: number
		user: Claims
	}) {
		const where: Prisma.TokenTransactionWhereInput = {
			tokenAddress: payload.tokenAddress,
			lamports: {
				gt: payload.minimumLamports
			}
		}

		if (payload.filterBy === "own") {
			where.signer = payload.user.address
		} else if (payload.filterBy === "following") {
			where.createdBy = {
				following: {
					some: {
						followerId: payload.user.id
					}
				}
			}
		}

		return this.prisma.tokenTransaction.findMany({
			where,
			orderBy: { createdAt: "desc" },
			skip: (payload.page - 1) * payload.take,
			take: payload.take,
			include: {
				token: {
					select: {
						address: true,
						name: true,
						network: true,
						marketCapacity: true
					}
				},
				createdBy: {
					select: { username: true, address: true, avatarUrl: true }
				}
			}
		})
	}

	count(payload: {
		tokenAddress: string
		filterBy?: "following" | "own"
		minimumLamports?: number
		user: Claims
	}) {
		const where: Prisma.TokenTransactionWhereInput = {
			tokenAddress: payload.tokenAddress,
			lamports: {
				gt: payload.minimumLamports
			}
		}

		if (payload.filterBy === "own") {
			where.signer = payload.user.address
		} else if (payload.filterBy === "following") {
			where.createdBy = {
				following: {
					some: {
						followerId: payload.user.id
					}
				}
			}
		}

		return this.prisma.tokenTransaction.count({ where })
	}
}
