import {
	ExecutionContext,
	UseGuards,
	applyDecorators,
	createParamDecorator
} from "@nestjs/common"
import { JwtService } from "@nestjs/jwt"
import {
	ApiBearerAuth,
	ApiProperty,
	ApiPropertyOptional,
	ApiPropertyOptions
} from "@nestjs/swagger"
import { AuthGuard } from "@root/auth/auth.guard"
import { Transform, Type } from "class-transformer"
import { IsBoolean, IsInt, IsNotEmpty, IsOptional } from "class-validator"

export const IsBool = (target: object, propertyKey: string | symbol) => {
	Transform(({ value }) => [true, "enabled", "true"].includes(value))(
		target,
		propertyKey
	)
	IsBoolean()(target, propertyKey)
}

export const IsInterger = (target: object, propertyKey: string | symbol) => {
	Type(() => Number)(target, propertyKey)
	IsInt()(target, propertyKey)
}

export const OptionalProp =
	(options?: ApiPropertyOptions, ignoreEmpry = true): PropertyDecorator =>
	(target: object, propertyKey: string | symbol) => {
		ApiPropertyOptional(options)(target, propertyKey)
		if (ignoreEmpry)
			Transform(({ value }) => (value === "" ? undefined : value))(
				target,
				propertyKey
			)
		IsOptional()(target, propertyKey)
	}

export const Prop =
	(options?: ApiPropertyOptions): PropertyDecorator =>
	(target: object, propertyKey: string | symbol) => {
		ApiProperty(options)(target, propertyKey)
		IsNotEmpty()(target, propertyKey)
	}

export const Auth = () => applyDecorators(UseGuards(AuthGuard), ApiBearerAuth())

// Get data "authorization" from header without guard
export const JwtDecoded = createParamDecorator(
	(_data: unknown, ctx: ExecutionContext) => {
		const request = ctx.switchToHttp().getRequest()
		const authHeader = request.headers.authorization

		if (!authHeader || !authHeader.startsWith("Bearer ")) {
			return null
		}

		const token = authHeader.split(" ")[1]
		try {
			const jwtService = new JwtService()
			return jwtService.decode(token)
		} catch (_error) {
			return null
		}
	}
)
