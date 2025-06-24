import { ApiProperty } from "@nestjs/swagger"
import { Expose } from "class-transformer"
import { IsNotEmpty, IsString, IsUrl } from "class-validator"

export class S3UploadFields {
	@ApiProperty({
		description: "S3 bucket name",
		example: "ponz"
	})
	@IsString()
	@IsNotEmpty()
	@Expose()
	bucket: string

	@ApiProperty({
		description: "AWS algorithm",
		example: "AWS4-HMAC-SHA256"
	})
	@IsString()
	@IsNotEmpty()
	@Expose()
	"X-Amz-Algorithm": string

	@ApiProperty({
		description: "AWS credential",
		example: "AKIAXYKJQFIXQS4KJSAK/20250410/ap-southeast-1/s3/aws4_request"
	})
	@IsString()
	@IsNotEmpty()
	@Expose()
	"X-Amz-Credential": string

	@ApiProperty({
		description: "AWS date",
		example: "20250410T030134Z"
	})
	@IsString()
	@IsNotEmpty()
	@Expose()
	"X-Amz-Date": string

	@ApiProperty({
		description: "File key in S3",
		example: "token-image-9aade7f3-3b8e-4b64-9c96-e981f04409bf"
	})
	@IsString()
	@IsNotEmpty()
	@Expose()
	key: string

	@ApiProperty({
		description: "S3 policy",
		example:
			"eyJleHBpcmF0aW9uIjoiMjAyNS0wNC0xMVQwMzowMTozNFoiLCJjb25kaXRpb25zIjpbWyJjb250ZW50LWxlbmd0aC1yYW5nZSIsMCwxMDQ4NTc2MDAwXSxbInN0YXJ0cy13aXRoIiwiJENvbnRlbnQtVHlwZSIsImltYWdlLyJdLHsiYnVja2V0IjoicG9ueiJ9LHsiWC1BbXotQWxnb3JpdGhtIjoiQVdTNC1ITUFDLVNIQTI1NiJ9LHsiWC1BbXotQ3JlZGVudGlhbCI6IkFLSUFYWUtKUUZJWFFTNEtKU0FLLzIwMjUwNDEwL2FwLXNvdXRoZWFzdC0xL3MzL2F3czRfcmVxdWVzdCJ9LHsiWC1BbXotRGF0ZSI6IjIwMjUwNDEwVDAzMDEzNFoifSx7ImtleSI6InRva2VuLWltYWdlLTlhYWRlN2YzLTNiOGUtNGI2NC05Yzk2LWU5ODFmMDQ0MDliZiJ9XX0="
	})
	@IsString()
	@IsNotEmpty()
	@Expose()
	Policy: string

	@ApiProperty({
		description: "AWS signature",
		example: "b1b8021881fffdd588b4eb4735c753c48343e876689a4f5b5189ca8acaf1f2de"
	})
	@IsString()
	@IsNotEmpty()
	@Expose()
	"X-Amz-Signature": string
}

export class S3Upload {
	@ApiProperty({
		description: "S3 upload fields",
		type: S3UploadFields
	})
	@Expose()
	fields: S3UploadFields

	@ApiProperty({
		description: "S3 bucket URL",
		example: "https://ponz.s3.ap-southeast-1.amazonaws.com/"
	})
	@IsUrl()
	@IsNotEmpty()
	@Expose()
	url: string

	constructor(partial: Partial<S3Upload>) {
		Object.assign(this, partial)
	}
}
