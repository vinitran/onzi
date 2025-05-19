import { Module } from "@nestjs/common"
import { ReelCommentsController } from "./reel-comments.controller"
import { ReelCommentsService } from "./reel-comments.service"

@Module({
	controllers: [ReelCommentsController],
	providers: [ReelCommentsService]
})
export class ReelCommentsModule {}
