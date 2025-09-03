import {
	Body,
	ClassSerializerInterceptor,
	Controller,
	Post,
	UseInterceptors
} from "@nestjs/common"
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger"
import { Auth } from "@root/_shared/utils/decorators"
import { Claims } from "@root/auth/auth.service"
import { User } from "@root/users/user.decorator"
import { FeedbackCreatePayload } from "./dtos/payload"
import { FeedbackCreateResponse } from "./dtos/response"
import { FeedbackService } from "./feedback.service"

@Controller("feedbacks")
@Auth()
@ApiTags("feedbacks")
@ApiTags("comments")
@ApiResponse({ status: 401, description: "Unauthorized" })
@UseInterceptors(ClassSerializerInterceptor)
export class FeedbackController {
	constructor(private readonly feedbackService: FeedbackService) {}

	@Post("")
	@ApiOperation({
		summary: "Send feedback to group Telegram"
	})
	@ApiResponse({
		status: 200,
		description: "Sent feedback successfully",
		type: FeedbackCreateResponse
	})
	async send(@Body() body: FeedbackCreatePayload, @User() user: Claims) {
		await this.feedbackService.send({
			...body,
			userId: user.id
		})
		return {
			message: "Sent feedback"
		}
	}
}
