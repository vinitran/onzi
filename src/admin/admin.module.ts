import { Module } from "@nestjs/common"
import { Ponz } from "@root/programs/ponz/program"
import { ProgramsModule } from "@root/programs/programs.module"
import { PonzVault } from "@root/programs/vault/program"
import { AdminController } from "./admin.controller"
import { AdminService } from "./admin.service"

@Module({
	imports: [ProgramsModule.register(Ponz, PonzVault)],
	controllers: [AdminController],
	providers: [AdminService]
})
export class AdminModule {}
