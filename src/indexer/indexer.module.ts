import { Module } from "@nestjs/common"
import { DatabaseModule } from "@root/_database/database.module"
import { EnvModule } from "@root/_env/env.module"
import { RabbitMQModule } from "@root/_rabbitmq/rabbitmq.module"
import { RedisModule } from "@root/_redis/redis.module"
import { IndexerClientService } from "@root/indexer/client.service"
import { IndexerService } from "@root/indexer/indexer.service"
import { StorageIndexerService } from "@root/indexer/storage.service"
import { Ponz } from "@root/programs/ponz/program"
import { ProgramsModule } from "@root/programs/programs.module"
import { Raydium } from "@root/programs/raydium/program"
import { SocketModule } from "@root/socket/socket.module"

@Module({
	imports: [
		EnvModule,
		ProgramsModule.register(Ponz, Raydium),
		SocketModule,
		DatabaseModule,
		RedisModule,
		RabbitMQModule
	],
	providers: [IndexerService, StorageIndexerService, IndexerClientService],
	exports: [StorageIndexerService, IndexerClientService]
})
export class IndexerModule {}
