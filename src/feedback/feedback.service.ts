import {
	ForbiddenException,
	Injectable,
	NotFoundException
} from "@nestjs/common"
import { UserRepository } from "@root/_database/repositories/user.repository"
import { RedisService } from "@root/_redis/redis.service"
import { TelegramFeedbackService } from "@root/_telegram/feedback/telegram-feedback.service"
import { DateTime } from "luxon"
import { FeedbackCreatePayload } from "./dtos/payload"

@Injectable()
export class FeedbackService {
	constructor(
		private telegramFeedbackService: TelegramFeedbackService,
		private user: UserRepository,
		private redis: RedisService
	) {}

	async send(payload: { userId: string } & FeedbackCreatePayload) {
		const { content, twitterUsername, userId } = payload
		const cachedKey = `feedback-${userId}`
		// Validate to prevent spam
		const latestMessage = await this.redis.get(cachedKey)

		if (latestMessage) {
			throw new ForbiddenException(
				"You have just sent feedback. Try again later."
			)
		}

		const user = await this.user.findById(userId)
		if (!user) throw new NotFoundException("Not found user")

		const time = DateTime.now().toFormat("dd/MM/yyyy HH:mm")
		let message = `⌚ ${time} \n\👤 *${user.username}* \n👉 ${content}`

		if (twitterUsername) {
			message += `\n 🔊Twitter name: *${twitterUsername}*`
		}

		await this.telegramFeedbackService.sendMessage(message)

		await this.redis.set(cachedKey, "Sent feedback", 60 * 5)
	}
}
