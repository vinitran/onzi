import { Injectable, NestMiddleware } from "@nestjs/common"
import { JwtService } from "@nestjs/jwt"
import { Env, InjectEnv } from "@root/_env/env.module"
import { NextFunction, Request, Response } from "express"
import { Claims } from "./auth.service"

interface RequestWithUser extends Request {
	user?: Claims
}

@Injectable()
export class AuthMiddleware implements NestMiddleware {
	constructor(
		private jwtService: JwtService,
		@InjectEnv() private env: Env
	) {}

	async use(req: RequestWithUser, _res: Response, next: NextFunction) {
		const token = this.extractTokenFromHeader(req)

		if (token) {
			try {
				const payload = await this.jwtService.verify(token, {
					secret: this.env.JWT_SECRET
				})
				req.user = payload
			} catch (_error) {
				// Ignore invalid token
			}
		}

		next()
	}

	private extractTokenFromHeader(request: Request): string | undefined {
		const [type, token] = request.headers.authorization?.split(" ") ?? []
		return type === "Bearer" ? token : undefined
	}
}
