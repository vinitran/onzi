import {
	ForbiddenException,
	Injectable,
	NotFoundException
} from "@nestjs/common"
import { ReelReportRepository } from "@root/_database/repositories/reel-report.repository"
import { ReelRepository } from "@root/_database/repositories/reel.repository"
import { UserRepository } from "@root/_database/repositories/user.repository"
import {
	CreateReelReportPayload,
	PaginateReelReportsPayload
} from "@root/_shared/types/reel"
import { DateTime } from "luxon"

@Injectable()
export class ReelReportsService {
	constructor(
		private reel: ReelRepository,
		private reelReport: ReelReportRepository,
		private user: UserRepository
	) {}

	async createReport(payload: CreateReelReportPayload) {
		const { description, reelId, userId } = payload

		const reel = await this.reel.findById(reelId)

		if (!reel) throw new NotFoundException("Not found reel")

		const reportByUser = await this.reelReport.findLatestByUser(reelId, userId)

		if (reportByUser) {
			const now = DateTime.now()
			const reportDate = DateTime.fromJSDate(reportByUser.createdAt)
			const diffMinutes = now.diff(reportDate, "minutes").minutes
			if (diffMinutes < 60) {
				throw new ForbiddenException(
					"You can only report a reel once every hour"
				)
			}
		}

		return this.reelReport.create({
			reel: { connect: reel },
			reporter: { connect: { id: userId } },
			description
		})
	}

	async paginateReelReportsByReelId(payload: PaginateReelReportsPayload) {
		const { page, reelId, take, userId } = payload
		const reel = await this.reel.findById(reelId)
		if (!reel) throw new NotFoundException("Not found reel")

		const user = await this.user.findById(userId)
		if (!user) throw new NotFoundException("Not found user")

		if (reel.creatorId !== userId && user.role !== "Admin")
			throw new ForbiddenException(
				"Only admin or creator token just allow to view"
			)

		return this.reelReport.paginateByReelId({ page, reelId, take })
	}
}
