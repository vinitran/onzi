import { Global, Module } from "@nestjs/common"
import { UserConnectionRepository } from "@root/_database/repositories/user-connection.repository"
import { UserRepository } from "@root/_database/repositories/user.repository"
import { PrismaService } from "./prisma.service"
import { CommentRepository } from "./repositories/comment.repository"
import { StickerOwnerRepository } from "./repositories/sticker-owner.repository"
import { StickerRepository } from "./repositories/sticker.repository"
import { TokenFavoriteRepository } from "./repositories/token-favorite.repository"
import { TokenKeyRepository } from "./repositories/token-key.repository"
import { TokenOwnerRepository } from "./repositories/token-owner.repository"
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
	StickerRepository,
	StickerOwnerRepository
]

@Global()
@Module({
	providers: [PrismaService, ...repositories],
	exports: repositories
})
export class DatabaseModule {}
