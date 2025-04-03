import { Injectable } from "@nestjs/common"
import { Prisma } from "@prisma/client"
import { PrismaService } from "../prisma.service"

@Injectable()
export class TokenKeyRepository {
	constructor(private prisma: PrismaService) {}

	findOneUnPicked() {
		return this.prisma.tokenKey.findFirst({
			where: {
				isPicked: false
			}
		})
	}

	create(data: Prisma.TokenKeyCreateInput) {
		return this.prisma.tokenKey.create({ data })
	}

	delete(id: string) {
		return this.prisma.tokenKey.delete({
			where: {
				id
			}
		})
	}

	findByPublicKey(publicKey: string) {
		return this.prisma.tokenKey.findUnique({ where: { publicKey } })
	}
}
