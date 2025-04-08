import { BN, web3 } from "@coral-xyz/anchor"
import { Injectable } from "@nestjs/common"
import { Network, Prisma, TransactionType } from "@prisma/client"
import { Claims } from "@root/auth/auth.service"
import { DateTime } from "luxon"
import { PrismaService } from "../prisma.service"

type CreateTokenTransactionParams = {
	signer: web3.PublicKey
	address: web3.PublicKey
	date: DateTime
	amount: BN
	lamports: BN
	type: TransactionType
	signature: string
	price: number
	newPrice: number
	network: Network
}

@Injectable()
export class TokenTransactionRepository {
	constructor(private prisma: PrismaService) {}

	create(params: CreateTokenTransactionParams) {
		return this.prisma.tokenTransaction.create({
			data: {
				amount: params.amount.toString(),
				date: params.date.toJSDate(),
				type: params.type,
				lamports: params.lamports.toString(),
				tokenAddress: params.address.toBase58(),
				signature: params.signature,
				signer: params.signer.toBase58(),
				price: params.price,
				newPrice: params.newPrice,
				network: params.network
			}
		})
	}

	findBySignature(signature: string) {
		return this.prisma.tokenTransaction.findUnique({
			where: {
				signature
			}
		})
	}

	getLatest() {
		return this.prisma.tokenTransaction.findFirst({
			orderBy: { createdAt: "desc" },
			select: {
				id: true,
				signature: true,
				tokenAddress: true,
				type: true,
				token: true,
				createdBy: true
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
