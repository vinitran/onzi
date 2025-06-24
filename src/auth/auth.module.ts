import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common"
import { JwtModule } from "@nestjs/jwt"
import { ENV_TOKEN, Env } from "@root/_env/env.module"
import { AuthController } from "./auth.controller"
import { AuthGuard } from "./auth.guard"
import { AuthMiddleware } from "./auth.middleware"
import { AuthService } from "./auth.service"

@Module({
	imports: [
		JwtModule.registerAsync({
			inject: [ENV_TOKEN],
			useFactory: (env: Env) => ({
				global: true,
				secret: env.JWT_SECRET,
				signOptions: { expiresIn: "7d" }
			}),
			global: true
		})
	],
	controllers: [AuthController],
	providers: [AuthService, AuthGuard, AuthMiddleware]
})
export class AuthModule implements NestModule {
	configure(consumer: MiddlewareConsumer) {
		consumer.apply(AuthMiddleware).forRoutes("*")
	}
}
