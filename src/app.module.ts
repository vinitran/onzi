import { Module } from "@nestjs/common"
import { JwtModule } from "@nestjs/jwt"
import { DatabaseModule } from "@root/_database/database.module"
import { EnvModule } from "@root/_env/env.module"
import { RabbitMQModule } from "@root/_rabbitmq/rabbitmq.module"
import { AppController } from "@root/app.controller"
import { AppService } from "@root/app.service"
import { AuthModule } from "@root/auth/auth.module"
import { FileModule } from "@root/file/file.module"
import { JobsModule } from "@root/jobs/job.module"
import { UsersModule } from "@root/users/users.module"
import { TelegramFeedbackModule } from "./_telegram/feedback/telegram-feedback.module"
import { AdminModule } from "./admin/admin.module"
import { CommentModule } from "./comments/comment.module"
import { FeedbackModule } from "./feedback/feedback.module"
import { NotificationsModule } from "./notifications/notifications.module"
import { ReelCommentsModule } from "./reel-comments/reel-comments.module"
import { ReelsModule } from "./reels/reels.module"
import { StickersModule } from "./stickers/stickers.module"
import { TokenReportsModule } from "./token-reports/token-reports.module"
import { TokensModule } from "./tokens/tokens.module"

@Module({
	imports: [
		DatabaseModule,
		EnvModule,
		AuthModule,
		UsersModule,
		CommentModule,
		TokensModule,
		FileModule,
		NotificationsModule,
		StickersModule,
		ReelsModule,
		RabbitMQModule,
		ReelCommentsModule,
		AdminModule,
		TokenReportsModule,
		JobsModule,
		TelegramFeedbackModule,
		JwtModule.register({
			global: true
		}),
		FeedbackModule
	],
	controllers: [AppController],
	providers: [AppService]
})
export class AppModule {}
