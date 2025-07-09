import { Global, Module } from "@nestjs/common"
import { SettingRepository } from "@root/_database/repositories/setting.repository"
import { TokenChartRepository } from "@root/_database/repositories/token-candle.repository"
import { TokenKeyWithHeldRepository } from "@root/_database/repositories/token-key-with-held.repository"
import { TokenTransactionDistributeRepository } from "@root/_database/repositories/token-tx-distribute"
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
import { ReelViewRepository } from "./repositories/reel-view.repository"
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
	PrismaService,
	UserRepository,
	UserConnectionRepository,
	CommentRepository,
	TokenRepository,
	TokenKeyRepository,
	TokenOwnerRepository,
	TokenTransactionRepository,
	TokenFavoriteRepository,
	TokenChartRepository,
	TokenKeyWithHeldRepository,
	TokenTransactionDistributeRepository,
	TokenReportRepository,
	StickerRepository,
	StickerOwnerRepository,
	BlockCommentRepository,
	ReelRepository,
	SettingRepository,
	ReelUserActionRepository,
	ReelCommentRepository,
	ReelCommentActionRepository,
	ReelCommentReportRepository,
	ReelReportRepository,
	BlockReelCommentRepository,
	BlockUserRepository,
	ReelViewRepository
]

@Global()
@Module({
	providers: repositories,
	exports: repositories
})
export class DatabaseModule {}
