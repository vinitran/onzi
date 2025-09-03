import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common"
import { Reflector } from "@nestjs/core"
import { Role } from "@prisma/client"
import { Claims } from "@root/auth/auth.service"
import { ROLES_KEY } from "../constants/decorator-key"

@Injectable()
export class RolesGuard implements CanActivate {
	constructor(private reflector: Reflector) {}

	canActivate(context: ExecutionContext): boolean {
		const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
			context.getHandler(),
			context.getClass()
		])

		if (!requiredRoles) {
			return true
		}
		const request = context.switchToHttp().getRequest()
		const user = request.user as Claims

		if (!user) return false

		return requiredRoles.includes(user.role)
	}
}
