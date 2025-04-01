import { Global, Inject, Module, Provider } from "@nestjs/common"
import { ConfigModule, ConfigService } from "@nestjs/config"

export const ENV_TOKEN = Symbol("ENV")

export type Env = {
	JWT_SECRET: string
	S3_REGION: string
	S3_BUCKET_NAME: string
	HELIUS_API_KEY: string
	CONTRACT_ADDRESS: string
	RPC_URL: string
}

export const InjectEnv = () => Inject(ENV_TOKEN)

const provider: Provider = {
	provide: ENV_TOKEN,
	useFactory: (configService: ConfigService) => {
		const DATABASE_URL = configService.get<string>("DATABASE_URL")
		const JWT_SECRET = configService.get<string>("JWT_SECRET")
		const S3_REGION = configService.get<string>("S3_REGION")
		const S3_BUCKET_NAME = configService.get<string>("S3_BUCKET_NAME")
		const HELIUS_API_KEY = configService.get<string>("HELIUS_API_KEY")
		const CONTRACT_ADDRESS = configService.get<string>("CONTRACT_ADDRESS")
		const RPC_URL = configService.get<string>("RPC_URL")

		if (!DATABASE_URL) throw new Error("missing DATABASE_URL env")
		if (!JWT_SECRET) throw new Error("missing JWT_SECRET env")
		if (!S3_REGION) throw new Error("missing S3_REGION env")
		if (!S3_BUCKET_NAME) throw new Error("missing S3_BUCKET_NAME env")
		if (!HELIUS_API_KEY) throw new Error("missing HELIUS_API_KEY env")
		if (!CONTRACT_ADDRESS) throw new Error("missing CONTRACT_ADDRESS env")
		if (!RPC_URL) throw new Error("missing RPC_URL env")

		return {
			JWT_SECRET,
			S3_REGION,
			S3_BUCKET_NAME,
			HELIUS_API_KEY,
			CONTRACT_ADDRESS,
			RPC_URL
		} satisfies Env
	},
	inject: [ConfigService]
}

@Global()
@Module({
	providers: [provider],
	imports: [
		ConfigModule.forRoot({
			isGlobal: true
		})
	],
	exports: [provider]
})
export class EnvModule {}
