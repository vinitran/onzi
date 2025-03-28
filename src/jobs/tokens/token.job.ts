import { Injectable } from "@nestjs/common"
import { TokenKeyRepository } from "@root/_database/repositories/token-key.repository"
@Injectable()
export class TokenJobs {
	constructor(private tokenKey: TokenKeyRepository) {}

	// @Cron(CronExpression.EVERY_10_MINUTES)
	// async seedTokenKeys() {
	// 	const SURFIX = "onz"
	// 	const TOTAL_KEY_PAIR = 5

	// 	const listKeyPair = Array.from({ length: TOTAL_KEY_PAIR }).map(() =>
	// 		this.generateVanityKeypair(SURFIX)
	// 	)

	// 	await Promise.all(
	// 		listKeyPair.map(async keyPair => {
	// 			const privateKey = bs58.encode(keyPair.secretKey)
	// 			const isExisted = await this.tokenKey.findByPrivateKey(privateKey)
	// 			if (!isExisted) {
	// 				await this.tokenKey.create({
	// 					publicKey: keyPair.publicKey.toBase58(),
	// 					privateKey
	// 				})
	// 			}
	// 		})
	// 	)
	// }

	// generateVanityKeypair(suffix: string): anchor.web3.Keypair {
	// 	let keypair: anchor.web3.Keypair
	// 	let pubkeyString: string

	// 	do {
	// 		keypair = anchor.web3.Keypair.generate()
	// 		pubkeyString = keypair.publicKey.toBase58()
	// 	} while (!pubkeyString.endsWith(suffix))

	// 	return keypair
	// }
}
