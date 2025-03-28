import { Global, Module } from "@nestjs/common"
import { UserConnectionRepository } from "@root/_database/repositories/user-connection.repository"
import { UserRepository } from "@root/_database/repositories/user.repository"
import { PrismaService } from "./prisma.service"
import { CommentRepository } from "./repositories/comment.repository"
import { TokenKeyRepository } from "./repositories/token-key.repository"
import { TokenRepository } from "./repositories/token.repository"

const repositories = [
	UserRepository,
	UserConnectionRepository,
	CommentRepository,
	TokenRepository,
	TokenKeyRepository
]

@Global()
@Module({
	providers: [PrismaService, ...repositories],
	exports: repositories
})
export class DatabaseModule {}
