import { Global, Inject, Module, Provider } from "@nestjs/common"
import { ConfigModule, ConfigService } from "@nestjs/config"

export const ENV_TOKEN = Symbol("ENV")

export type Env = {
	JWT_SECRET: string
	S3_REGION: string
	S3_BUCKET_NAME: string
	HELIUS_API_KEY: string
	CONTRACT_ADDRESS: string
	REDIS_URL: string
	REWARD_VAULT_ADDRESS: string
	IS_TEST: string
	PONZ_DEPLOYED_SIGNATURE: string
	RABBITMQ_URL: string
	RABBITMQ_QUEUE: string
	TOKEN_MINT_AUTHORITY_WALLET: string
	SYSTEM_WALLET_PRIVATE_KEY: string
	CREATE_POOL_FEE_PUBLIC_KEY: string
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
		const REDIS_URL = configService.get<string>("REDIS_URL")
		const REWARD_VAULT_ADDRESS = configService.get<string>(
			"REWARD_VAULT_ADDRESS"
		)
		const IS_TEST = configService.get<string>("IS_TEST")
		const PONZ_DEPLOYED_SIGNATURE = configService.get<string>(
			"PONZ_DEPLOYED_SIGNATURE"
		)
		const RABBITMQ_URL = configService.get<string>("RABBITMQ_URL")
		const RABBITMQ_QUEUE = configService.get<string>("RABBITMQ_QUEUE")
		const TOKEN_MINT_AUTHORITY_WALLET = configService.get<string>(
			"TOKEN_MINT_AUTHORITY_WALLET"
		)
		const SYSTEM_WALLET_PRIVATE_KEY = configService.get<string>(
			"SYSTEM_WALLET_PRIVATE_KEY"
		)
		const CREATE_POOL_FEE_PUBLIC_KEY = configService.get<string>(
			"CREATE_POOL_FEE_PUBLIC_KEY"
		)

		if (!DATABASE_URL) throw new Error("missing DATABASE_URL env")
		if (!JWT_SECRET) throw new Error("missing JWT_SECRET env")
		if (!S3_REGION) throw new Error("missing S3_REGION env")
		if (!S3_BUCKET_NAME) throw new Error("missing S3_BUCKET_NAME env")
		if (!HELIUS_API_KEY) throw new Error("missing HELIUS_API_KEY env")
		if (!CONTRACT_ADDRESS) throw new Error("missing CONTRACT_ADDRESS env")
		if (!REDIS_URL) throw new Error("missing REDIS_URL env")
		if (!REWARD_VAULT_ADDRESS)
			throw new Error("missing REWARD_VAULT_ADDRESS env")
		if (!IS_TEST) throw new Error("missing IS_TEST env")
		if (!PONZ_DEPLOYED_SIGNATURE)
			throw new Error("missing PONZ_DEPLOYED_SIGNATURE env")
		if (!RABBITMQ_URL) throw new Error("missing RABBITMQ_URL env")
		if (!RABBITMQ_QUEUE) throw new Error("missing RABBITMQ_QUEUE env")
		if (!TOKEN_MINT_AUTHORITY_WALLET)
			throw new Error("missing TOKEN_MINT_AUTHORITY_WALLET env")
		if (!SYSTEM_WALLET_PRIVATE_KEY)
			throw new Error("missing SYSTEM_WALLET_PRIVATE_KEY env")
		if (!CREATE_POOL_FEE_PUBLIC_KEY)
			throw new Error("missing CREATE_POOL_FEE_PUBLIC_KEY env")

		return {
			JWT_SECRET,
			S3_REGION,
			S3_BUCKET_NAME,
			HELIUS_API_KEY,
			CONTRACT_ADDRESS,
			REDIS_URL,
			REWARD_VAULT_ADDRESS,
			IS_TEST,
			PONZ_DEPLOYED_SIGNATURE,
			RABBITMQ_URL,
			RABBITMQ_QUEUE,
			TOKEN_MINT_AUTHORITY_WALLET,
			SYSTEM_WALLET_PRIVATE_KEY,
			CREATE_POOL_FEE_PUBLIC_KEY
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
