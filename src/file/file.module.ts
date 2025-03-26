import { Module } from "@nestjs/common"
import { EnvModule } from "@root/_env/env.module"
import { S3Service } from "@root/file/file.service"

const fileService = [S3Service]

@Module({
	imports: [EnvModule],
	providers: fileService,
	exports: fileService
})
export class FileModule {}
