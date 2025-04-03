import { PresignedPost } from "@aws-sdk/s3-presigned-post"
import { Prisma, Token } from "@prisma/client"
import { CreateTokenDto } from "@root/tokens/dtos/create-token.dto"

/* Create token */
export type ICreateTokenPayload = CreateTokenDto & {
	creatorAddress: string
}

export type ICreateToken = {
	dataCreate: Prisma.TokenCreateInput
	tokenKeyId: string
	getImagePresignedUrl: (
		tokenId: string
	) => Promise<{ imageUri: string } & PresignedPost>
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
