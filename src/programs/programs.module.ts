import { web3 } from "@coral-xyz/anchor"
import { DynamicModule, Inject, Module, Provider } from "@nestjs/common"
import { ENV_TOKEN, Env } from "@root/_env/env.module"

const CONNECTION_TOKEN = Symbol("CONNECTION")

export const InjectConnection = () => Inject(CONNECTION_TOKEN)

const ConnectionProvider: Provider = {
	provide: CONNECTION_TOKEN,
	useFactory: (env: Env) =>
		new web3.Connection(
			env.IS_TEST === "true"
				? `https://devnet.helius-rpc.com/?api-key=${env.HELIUS_API_KEY}`
				: `https://mainnet.helius-rpc.com/?api-key=${env.HELIUS_API_KEY}`
		),
	inject: [ENV_TOKEN]
}

@Module({})
export class ProgramsModule {
	static register(...programs: Provider[]): DynamicModule {
		const providers = [ConnectionProvider, ...programs]
		return {
			module: ProgramsModule,
			providers,
			exports: providers
		}
	}
}
