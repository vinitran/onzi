import { Module } from "@nestjs/common"
import { S3Service } from "@root/file/file.service"
import { ReelReportsService } from "./reel-reports.service"
import { ReelsController } from "./reels.controller"
import { ReelsService } from "./reels.service"

@Module({
	controllers: [ReelsController],
	providers: [ReelsService, S3Service, ReelReportsService]
})
export class ReelsModule {}
