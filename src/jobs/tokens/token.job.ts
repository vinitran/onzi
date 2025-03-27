import { Injectable } from "@nestjs/common"

@Injectable()
export class TokenJobs {
	//   @Cron(CronExpression.EVERY_10_MINUTES)
	seedTokenKeys() {
		console.log(">> Hello keys")
	}
}
