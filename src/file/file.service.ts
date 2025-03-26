import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3"
import { createPresignedPost } from "@aws-sdk/s3-presigned-post"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { Injectable, InternalServerErrorException } from "@nestjs/common"
import { Env, InjectEnv } from "@root/_env/env.module"

@Injectable()
export class S3Service {
	private client: S3Client

	constructor(@InjectEnv() private env: Env) {
		this.client = new S3Client({
			region: this.env.S3_REGION
		})
	}

	async postPresignedSignedUrl(key: string) {
		try {
			const { url, fields } = await createPresignedPost(this.client, {
				Bucket: this.env.S3_BUCKET_NAME,
				Key: key,
				Conditions: [
					["content-length-range", 0, 1048576000], // Max 10MB
					["starts-with", "$Content-Type", "image/"]
				],
				Expires: 60 * 60 * 24 // 24 hours
			})

			return { url, fields }
		} catch (error) {
			throw new InternalServerErrorException(error)
		}
	}

	async getPresignedSignedUrl(key: string) {
		try {
			const command = new GetObjectCommand({
				Bucket: this.env.S3_BUCKET_NAME,
				Key: key
			})

			const url = await getSignedUrl(this.client, command, {
				expiresIn: 60 * 60 * 24 // 24 hours
			})

			return { url }
		} catch (error) {
			throw new InternalServerErrorException(error)
		}
	}
}
