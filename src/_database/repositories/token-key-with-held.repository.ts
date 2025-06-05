import { Wallet, web3 } from "@coral-xyz/anchor"
import { Injectable } from "@nestjs/common"
import { RedisService } from "@root/_redis/redis.service"
import { privateKeyFromKeypair } from "@root/_shared/helpers/encode-decode-tx"
import { PrismaService } from "../prisma.service"

@Injectable()
export class TokenKeyWithHeldRepository {
	constructor(
		private prisma: PrismaService,
		private redis: RedisService
	) {}

	async createIfNotExist(tokenId: string) {
		const key = await this.prisma.tokenKeyWithHeld.findFirst({
			where: { tokenId }
		})

		if (key) {
			return key
		}

		const randomWallet = new Wallet(web3.Keypair.generate())
		const publicKey = randomWallet.publicKey.toBase58()
		const privateKey = privateKeyFromKeypair(randomWallet.payer)

		return await this.prisma.tokenKeyWithHeld.create({
			data: {
				publicKey,
				privateKey,
				tokenId
			}
		})
	}

	async find(tokenId: string) {
		return this.redis.getOrSet(
			`token-key-with-held:${tokenId}`,
			() => {
				return this.prisma.tokenKeyWithHeld.findFirst({
					where: { tokenId }
				})
			},
			10
		)
	}
}
