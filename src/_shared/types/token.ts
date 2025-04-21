import { PresignedPost } from "@aws-sdk/s3-presigned-post"
import { Prisma, Token } from "@prisma/client"
import { CreateTokenPayload } from "@root/tokens/dtos/payload.dto"

/* Create token */
export type ICreateTokenPayload = CreateTokenPayload & {
	creatorAddress: string
}

export type ICreateToken = {
	dataCreate: Prisma.TokenCreateInput
	tokenKeyId: string
	contentType: string
	getTickerPresignedUrl: (
		tokenId: string,
		contentType: string
	) => Promise<{ imageUri: string } & PresignedPost>
	postMetadataToS3: (tokenId: string, metadata: Object) => Promise<boolean>
}

export type ICreateTokenResponse = {
	token: Token & {
		creator: {
			id: string
			address: string
			username: string | null
		}
	}
	attachment?: PresignedPost
}

/* Create token onchain */
export type ICreateTokenOnchainPayload = {
	tokenID: string
	creatorAddress: string
	minSol: string
	maxSol: string
}
