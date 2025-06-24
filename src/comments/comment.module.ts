import { Module } from "@nestjs/common"
import { S3Service } from "@root/file/file.service"
import { SocketModule } from "@root/socket/socket.module"
import { CommentController } from "./comment.controller"
import { CommentGateway } from "./comment.gateway"
import { CommentService } from "./comment.service"
import { ReplyCommentGateway } from "./repy-comment.gateway"

@Module({
	imports: [SocketModule],
	controllers: [CommentController],
	providers: [CommentGateway, ReplyCommentGateway, CommentService, S3Service]
})
export class CommentModule {}
