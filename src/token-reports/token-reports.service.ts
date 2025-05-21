import {
	ForbiddenException,
	Injectable,
	NotFoundException
} from "@nestjs/common"
import { TokenReportRepository } from "@root/_database/repositories/token-report.repository"
import { TokenRepository } from "@root/_database/repositories/token.repository"
import { DateTime } from "luxon"
import { CreateTokenReportDto } from "./dtos/payload.dto"

export type CreateTokenReportPayload = CreateTokenReportDto & {
	userId: string
	tokenAddress: string
}

@Injectable()
export class TokenReportsService {
	constructor(
		private tokenReport: TokenReportRepository,
		private token: TokenRepository
	) {}

	async createReport(payload: CreateTokenReportPayload) {
		const { description, tokenAddress, userId } = payload

		const token = await this.token.findByAddress(tokenAddress)
		if (!token) throw new NotFoundException("Not found token")

		const latestReport = await this.tokenReport.findLatestByUser(
			tokenAddress,
			userId
		)
		if (latestReport) {
			const now = DateTime.now()
			const reportDate = DateTime.fromJSDate(latestReport.createdAt)
			const diffMinutes = now.diff(reportDate, "minutes").minutes
			if (diffMinutes < 60) {
				throw new ForbiddenException(
					"You can only report a token once every hour"
				)
			}
		}

		return this.tokenReport.create({
			description,
			reporter: { connect: { id: userId } },
			token: { connect: { address: tokenAddress } }
		})
	}
}
