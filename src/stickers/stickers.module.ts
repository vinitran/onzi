import { Module } from "@nestjs/common"
import { S3Service } from "@root/file/file.service"
import { StickersController } from "./stickers.controller"
import { StickersService } from "./stickers.service"

@Module({
	controllers: [StickersController],
	providers: [StickersService, S3Service]
})
export class StickersModule {}
