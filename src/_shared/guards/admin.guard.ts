import {
	CanActivate,
	ExecutionContext,
	Injectable,
	UnauthorizedException
} from "@nestjs/common"
import { JwtService } from "@nestjs/jwt"
import { UserRepository } from "@root/_database/repositories/user.repository"
import { Env, InjectEnv } from "@root/_env/env.module"
import { Claims } from "@root/auth/auth.service"
import { Request } from "express"

@Injectable()
export class AdminGuard implements CanActivate {
	constructor(
		@InjectEnv() private env: Env,
		private jwtService: JwtService,
		private user: UserRepository
	) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const request = context.switchToHttp().getRequest()
		const token = this.extractTokenFromHeader(request)

		if (!token) throw new UnauthorizedException()

		try {
			const payload: Claims = await this.jwtService.verifyAsync(token, {
				secret: this.env.JWT_SECRET
			})

			const user = await this.user.findById(payload.id)
			if (!user || user.role !== "Admin") return false

			request.user = payload
		} catch (error) {
			throw new UnauthorizedException(JSON.stringify(error))
		}

		return true
	}

	private extractTokenFromHeader(request: Request): string | undefined {
		const [type, token] = request.headers.authorization?.split(" ") ?? []
		return type === "Bearer" ? token : undefined
	}
}
