import { Global, Module } from "@nestjs/common"
import { TokenChartRepository } from "@root/_database/repositories/token-candle.repository"
import { UserConnectionRepository } from "@root/_database/repositories/user-connection.repository"
import { UserRepository } from "@root/_database/repositories/user.repository"
import { PrismaService } from "./prisma.service"
import { BlockReelCommentRepository } from "./repositories/block-comment-reel.repository"
import { BlockCommentRepository } from "./repositories/block-comment.repository"
import { BlockUserRepository } from "./repositories/block-user.repository"
import { CommentRepository } from "./repositories/comment.repository"
import { ReelCommentActionRepository } from "./repositories/reel-comment-action.repository"
import { ReelCommentReportRepository } from "./repositories/reel-comment-report.repository"
import { ReelCommentRepository } from "./repositories/reel-comment.repository"
import { ReelReportRepository } from "./repositories/reel-report.repository"
import { ReelUserActionRepository } from "./repositories/reel-user-action.repository"
import { ReelRepository } from "./repositories/reel.repository"
import { StickerOwnerRepository } from "./repositories/sticker-owner.repository"
import { StickerRepository } from "./repositories/sticker.repository"
import { TokenFavoriteRepository } from "./repositories/token-favorite.repository"
import { TokenKeyRepository } from "./repositories/token-key.repository"
import { TokenOwnerRepository } from "./repositories/token-owner.repository"
import { TokenReportRepository } from "./repositories/token-report.repository"
import { TokenTransactionRepository } from "./repositories/token-transaction.repository"
import { TokenRepository } from "./repositories/token.repository"

const repositories = [
	UserRepository,
	UserConnectionRepository,
	CommentRepository,
	TokenRepository,
	TokenKeyRepository,
	TokenOwnerRepository,
	TokenTransactionRepository,
	TokenFavoriteRepository,
	TokenChartRepository,
	TokenReportRepository,
	StickerRepository,
	StickerOwnerRepository,
	BlockCommentRepository,
	ReelRepository,
	ReelUserActionRepository,
	ReelCommentRepository,
	ReelCommentActionRepository,
	ReelCommentReportRepository,
	ReelReportRepository,
	BlockReelCommentRepository,
	BlockUserRepository
]

@Global()
@Module({
	providers: [PrismaService, ...repositories],
	exports: repositories
})
export class DatabaseModule {}
