import { Module } from "@nestjs/common"
import { TokenReportsController } from "./token-reports.controller"
import { TokenReportsService } from "./token-reports.service"

@Module({
	controllers: [TokenReportsController],
	providers: [TokenReportsService]
})
export class TokenReportsModule {}
