import { Module } from "@nestjs/common"
import { S3Service } from "@root/file/file.service"
import { CommentController } from "./comment.controller"
import { CommentService } from "./comment.service"

@Module({
	controllers: [CommentController],
	providers: [CommentService, S3Service]
})
export class CommentModule {}
