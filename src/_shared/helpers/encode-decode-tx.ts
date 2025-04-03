import { Keypair, Transaction } from "@solana/web3.js"
import bs58 from "bs58"

export const encodeTransaction = (transaction: Transaction) => {
	const serializedTx = transaction.serialize({ requireAllSignatures: false })
	return bs58.encode(serializedTx)
}

export const decodeTransaction = (encodedTx: string) => {
	const decodedBuffer = bs58.decode(encodedTx)
	return Transaction.from(decodedBuffer)
}

export const keypairFromPrivateKey = (privateKey: string) => {
	const privateKeyUint8Array = bs58.decode(privateKey)
	return Keypair.fromSecretKey(privateKeyUint8Array)
}
