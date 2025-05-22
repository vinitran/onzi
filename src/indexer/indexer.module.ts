import { Module } from "@nestjs/common"
import { DatabaseModule } from "@root/_database/database.module"
import { EnvModule } from "@root/_env/env.module"
import { RabbitMQModule } from "@root/_rabbitmq/rabbitmq.module"
import { RedisModule } from "@root/_redis/redis.module"
import { IndexerGateway } from "@root/indexer/indexer.gateway"
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
	providers: [IndexerGateway, IndexerService, StorageIndexerService],
	exports: [StorageIndexerService]
})
export class IndexerModule {}
