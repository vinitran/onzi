import { Injectable, UnauthorizedException } from "@nestjs/common"
import { JwtService } from "@nestjs/jwt"
import { Env, InjectEnv } from "@root/_env/env.module"
import { Claims } from "@root/auth/auth.service"
import { Socket } from "socket.io"

@Injectable()
export class AuthWebSocketService {
	constructor(
		private readonly jwtService: JwtService,
		@InjectEnv() private env: Env
	) {}

	async authenticate(client: Socket): Promise<Claims> {
		try {
			const token = this.extractTokenFromHeader(client)
			if (!token) {
				throw new UnauthorizedException("Token is missing")
			}

			const payload: Claims = await this.jwtService.verify(token, {
				secret: this.env.JWT_SECRET
			})

			return payload // Return user data
		} catch {
			client.disconnect() // Reject unauthorized clients
			throw new UnauthorizedException("Invalid token")
		}
	}

	private extractTokenFromHeader(client: Socket): string | null {
		const token =
			client.handshake.auth?.token || client.handshake.headers.authorization
		if (!token) return null
		return token.startsWith("Bearer ") ? token.slice(7) : token
	}
}
