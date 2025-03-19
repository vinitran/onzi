import { Global, Module } from "@nestjs/common"
import { UserRepository } from "@root/_database/repositories/user.repository"
import { PrismaService } from "./prisma.service"

const repositories = [UserRepository]

@Global()
@Module({
	providers: [PrismaService, ...repositories],
	exports: repositories
})
export class DatabaseModule {}
