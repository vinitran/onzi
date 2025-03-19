import { Global, Inject, Module, Provider } from "@nestjs/common"
import { ConfigModule, ConfigService } from "@nestjs/config"

export const ENV_TOKEN = Symbol("ENV")

export type Env = {
	JWT_SECRET: string
}

export const InjectEnv = () => Inject(ENV_TOKEN)

const provider: Provider = {
	provide: ENV_TOKEN,
	useFactory: (configService: ConfigService) => {
		const DATABASE_URL = configService.get<string>("DATABASE_URL")
		const JWT_SECRET = configService.get<string>("JWT_SECRET")

		if (!DATABASE_URL) throw new Error("missing DATABASE_URL env")
		if (!JWT_SECRET) throw new Error("missing JWT_SECRET env")

		return {
			JWT_SECRET
		} satisfies Env
	},
	inject: [ConfigService]
}

@Global()
@Module({
	providers: [provider],
	imports: [ConfigModule.forRoot()],
	exports: [provider]
})
export class EnvModule {}
