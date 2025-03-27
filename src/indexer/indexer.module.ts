import { Module } from "@nestjs/common"
import { EnvModule } from "@root/_env/env.module"
import { IndexerService } from "@root/indexer/indexer.service"

@Module({
	imports: [EnvModule],
	providers: [IndexerService],
	exports: [IndexerService]
})
export class IndexerModule {}
