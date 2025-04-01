import { BN } from "@coral-xyz/anchor"
import { Injectable } from "@nestjs/common"
import { PrismaService } from "../prisma.service"

@Injectable()
export class TokenOwnerRepository {
	constructor(private prisma: PrismaService) {}

	findListHolder(data: { tokenAddress: string; take?: number }) {
		const { take = 20, tokenAddress } = data
		return this.prisma.tokenOwner.findMany({ where: { tokenAddress }, take })
	}

	async createTokenOwnerIfNotExist(
		userAddress: string,
		tokenAddress: string,
		amount: BN
	) {
		const tokenOwner = await this.prisma.tokenOwner.findUnique({
			where: {
				userAddress_tokenAddress: {
					userAddress,
					tokenAddress
				}
			}
		})

		if (tokenOwner) {
			return
		}

		return this.prisma.tokenOwner.create({
			data: {
				userAddress,
				tokenAddress,
				amount: amount.toString()
			}
		})
	}

	async findTokenOwner(userAddress: string, tokenAddress: string) {
		return this.prisma.tokenOwner.findUnique({
			where: {
				userAddress_tokenAddress: {
					userAddress,
					tokenAddress
				}
			}
		})
	}

	async createTokenOwner(
		userAddress: string,
		tokenAddress: string,
		amount: BN
	) {
		return this.prisma.tokenOwner.create({
			data: {
				userAddress,
				tokenAddress,
				amount: amount.toString()
			}
		})
	}

	async updateTokenOwner(
		userAddress: string,
		tokenAddress: string,
		amount: BN
	) {
		if (amount.toNumber() > 0) {
			return this.prisma.tokenOwner.update({
				where: {
					userAddress_tokenAddress: {
						userAddress,
						tokenAddress
					}
				},
				data: {
					amount: amount.toString()
				}
			})
		}

		return this.prisma.tokenOwner.delete({
			where: {
				userAddress_tokenAddress: {
					userAddress,
					tokenAddress
				}
			}
		})
	}

	async saveTokenOwner(data: {
		userAddress: string
		tokenAddress: string
		amount: BN
		type: string
	}) {
		const { userAddress, tokenAddress, amount, type } = data

		const tokenOwner = await this.findTokenOwner(userAddress, tokenAddress)

		if (!tokenOwner) {
			return this.createTokenOwner(userAddress, tokenAddress, amount)
		}
		const dbAmountBN = new BN(tokenOwner.amount.toString())

		const newAmount =
			type === "SELL" ? dbAmountBN.sub(amount) : dbAmountBN.add(amount)

		return this.updateTokenOwner(userAddress, tokenAddress, newAmount)
	}
}
