import { Module } from "@nestjs/common"
import { PrismaClient } from "@prisma/client"
import { DatabaseModule } from "@root/_database/database.module"
import { EnvModule } from "@root/_env/env.module"
import { RabbitMQModule } from "@root/_rabbitmq/rabbitmq.module"
import { RedisModule } from "@root/_redis/redis.module"
import { IndexerController } from "@root/indexer/indexer.controller"
import { ChartGateway, IndexerGateway } from "@root/indexer/indexer.gateway"
import { IndexerService } from "@root/indexer/indexer.service"
import { StorageIndexerService } from "@root/indexer/storage.service"
import { Ponz } from "@root/programs/ponz/program"
import { ProgramsModule } from "@root/programs/programs.module"
import { SocketModule } from "@root/socket/socket.module"

@Module({
	imports: [
		EnvModule,
		ProgramsModule.register(Ponz),
		SocketModule,
		DatabaseModule,
		RedisModule,
		RabbitMQModule
	],
	controllers: [IndexerController],
	providers: [
		PrismaClient,
		IndexerGateway,
		ChartGateway,
		IndexerService,
		StorageIndexerService
	],
	exports: [IndexerService, StorageIndexerService]
})
export class IndexerModule {}
