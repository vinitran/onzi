import { Injectable } from "@nestjs/common"
import { PrismaService } from "../prisma.service"

@Injectable()
export class TokenOwnerRepository {
	constructor(private prisma: PrismaService) {}

	findListHolder(data: { tokenAddress: string; take?: number }) {
		const { take = 20, tokenAddress } = data
		return this.prisma.tokenOwner.findMany({ where: { tokenAddress }, take })
	}
}
