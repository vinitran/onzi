import {
	GetObjectCommand,
	PutObjectCommand,
	S3Client
} from "@aws-sdk/client-s3"
import { createPresignedPost } from "@aws-sdk/s3-presigned-post"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { Injectable, InternalServerErrorException } from "@nestjs/common"
import { Env, InjectEnv } from "@root/_env/env.module"

@Injectable()
export class S3Service {
	private client: S3Client
	private readonly MAX_IMAGE_SIZE = 10 * 1024 * 1024 // 10MB
	private readonly MAX_VIDEO_SIZE = 50 * 1024 * 1024 // 50MB

	constructor(@InjectEnv() private env: Env) {
		this.client = new S3Client({
			region: this.env.S3_REGION
		})
	}

	private getFileExtension(contentType: string): string {
		const typeMap: Record<string, string> = {
			"image/jpeg": ".jpg",
			"image/png": ".png",
			"image/gif": ".gif",
			"image/webp": ".webp",
			"video/mp4": ".mp4",
			"video/quicktime": ".mov",
			"video/x-msvideo": ".avi",
			"application/pdf": ".pdf",
			"application/json": ".json"
		}

		return typeMap[contentType] || ""
	}

	private isImage(contentType: string): boolean {
		return contentType.startsWith("image/")
	}

	private isVideo(contentType: string): boolean {
		return contentType.startsWith("video/")
	}

	private getMaxFileSize(contentType: string): number {
		if (this.isImage(contentType)) {
			return this.MAX_IMAGE_SIZE
		}
		if (this.isVideo(contentType)) {
			return this.MAX_VIDEO_SIZE
		}
		return this.MAX_IMAGE_SIZE // Default to image size limit
	}

	async postPresignedSignedUrl(key: string, contentType: string) {
		try {
			const extension = this.getFileExtension(contentType)
			const keyWithExtension = extension ? `${key}${extension}` : key
			const maxFileSize = this.getMaxFileSize(contentType)

			const { url, fields } = await createPresignedPost(this.client, {
				Bucket: this.env.S3_BUCKET_NAME,
				Key: keyWithExtension,
				Conditions: [
					["content-length-range", 0, maxFileSize],
					["starts-with", "$Content-Type", contentType]
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

	async uploadJsonFile(key: string, body: object) {
		try {
			const command = new PutObjectCommand({
				Bucket: this.env.S3_BUCKET_NAME,
				Key: key,
				Body: JSON.stringify(body),
				ContentType: "application/json"
			})

			await this.client.send(command)
			return { success: true }
		} catch (error) {
			throw new InternalServerErrorException(error)
		}
	}
}
