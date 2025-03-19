import { Module } from "@nestjs/common"
import { JwtModule } from "@nestjs/jwt"
import { ENV_TOKEN, Env } from "@root/_env/env.module"
import { AuthController } from "./auth.controller"
import { AuthService } from "./auth.service"

@Module({
	imports: [
		JwtModule.registerAsync({
			inject: [ENV_TOKEN],
			useFactory: (env: Env) => ({
				global: true,
				secret: env.JWT_SECRET,
				signOptions: { expiresIn: "7d" }
			})
		})
	],
	controllers: [AuthController],
	providers: [AuthService]
})
export class AuthModule {}
