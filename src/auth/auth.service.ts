import { InjectRedis } from "@nestjs-modules/ioredis"
import { Injectable, UnauthorizedException } from "@nestjs/common"
import { JwtService } from "@nestjs/jwt"
import { UserRepository } from "@root/_database/repositories/user.repository"
import { Env, InjectEnv } from "@root/_env/env.module"
import { PublicKey } from "@solana/web3.js"
import Redis from "ioredis"
import randomstr from "randomstring"
import nacl from "tweetnacl"
import { decodeUTF8 } from "tweetnacl-util"
import { VerifySignaturePayload } from "./dto/verify-signature.dto"

export type Claims = {
	id: string
	address: string
}

@Injectable()
export class AuthService {
	constructor(
		private jwtService: JwtService,
		private userRepository: UserRepository,
		@InjectRedis() private redis: Redis,
		@InjectEnv() private env: Env
	) {}

	private authMessageKey(pubkey: string) {
		return `auth_message_${pubkey}`
	}

	async generateMessage(pubkey: string) {
		const message = randomstr.generate(12)

		await this.redis.set(this.authMessageKey(pubkey), message, "EX", 300)

		return message
	}

	async verifySignature(data: VerifySignaturePayload) {
		const { signature, message, publicKey } = data

		const storedMessage = await this.redis.get(this.authMessageKey(publicKey))

		if (storedMessage !== message)
			throw new UnauthorizedException("invalid message")

		const result = nacl.sign.detached.verify(
			decodeUTF8(message),
			Buffer.from(signature, "base64"),
			new PublicKey(publicKey).toBytes()
		)

		if (!result) throw new UnauthorizedException("Invalid signature")

		const user = await this.userRepository.createIfNotExist({
			address: publicKey
		})

		const claims: Claims = {
			id: user.id,
			address: user.address
		}

		return this.jwtService.signAsync(claims, {
			secret: this.env.JWT_SECRET
		})
	}
}
