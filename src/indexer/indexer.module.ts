import { Module } from "@nestjs/common"
import { EnvModule } from "@root/_env/env.module"
import { IndexerService } from "@root/indexer/indexer.service"
import { SolanaIndexerService } from "@root/indexer/solana.service"
import { Ponz } from "@root/programs/ponz/program"
import { ProgramsModule } from "@root/programs/programs.module"
import { SocketModule } from "@root/socket/socket.module"

@Module({
	imports: [EnvModule, ProgramsModule.register(Ponz), SocketModule],
	providers: [IndexerService, SolanaIndexerService],
	exports: [IndexerService, SolanaIndexerService]
})
export class IndexerModule {}
