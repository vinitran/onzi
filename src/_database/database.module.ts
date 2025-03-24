import { Global, Module } from "@nestjs/common"
import { UserConnectionRepository } from "@root/_database/repositories/user-connection.repository"
import { UserRepository } from "@root/_database/repositories/user.repository"
import { PrismaService } from "./prisma.service"

const repositories = [UserRepository, UserConnectionRepository]

@Global()
@Module({
	providers: [PrismaService, ...repositories],
	exports: repositories
})
export class DatabaseModule {}
