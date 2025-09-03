import { ExecutionContext, createParamDecorator } from "@nestjs/common"
import { Claims } from "@root/auth/auth.service"

export const User = createParamDecorator(
	(data: keyof Claims, ctx: ExecutionContext) => {
		const request = ctx.switchToHttp().getRequest()
		const user = request.user
		return data ? user?.[data] : user
	}
)
