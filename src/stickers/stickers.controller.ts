import {
	Body,
	Controller,
	Delete,
	Get,
	Param,
	ParseUUIDPipe,
	Post
} from "@nestjs/common"
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger"
import { Auth } from "@root/_shared/utils/decorators"
import { Claims } from "@root/auth/auth.service"
import { Sticker, Sticker as StickerResponse } from "@root/dtos/sticker.dto"
import { User } from "@root/users/user.decorator"
import { plainToInstance } from "class-transformer"
import { CreateStickerPayload } from "./dtos/payload.dto"
import { CreateStickerResponse } from "./dtos/response.dto"
import { StickersService } from "./stickers.service"

@ApiTags("stickers")
@ApiResponse({ status: 401, description: "Unauthorized" })
@ApiResponse({ status: 404, description: "User not found" })
@Controller("stickers")
export class StickersController {
	constructor(private readonly stickersService: StickersService) {}

	@Auth()
	@Post()
	@ApiOperation({ summary: "Create a new sticker for user" })
	@ApiResponse({
		status: 201,
		description: "Sticker created successfully",
		type: CreateStickerResponse
	})
	async create(@User() user: Claims, @Body() body: CreateStickerPayload) {
		const result = await this.stickersService.create({
			userAddress: user.address,
			contentType: body.contentType
		})

		return plainToInstance(CreateStickerResponse, result, {
			excludeExtraneousValues: true
		})
	}

	@Get("/user/:userAddress")
	@ApiOperation({ summary: "Get list sticker of user" })
	@ApiResponse({
		status: 200,
		description: "Get list sticker of user successfully",
		type: [Sticker]
	})
	async getList(@Param("userAddress") userAddress: string) {
		const result = await this.stickersService.getByUserAddress(userAddress)
		return plainToInstance(StickerResponse, result, {
			excludeExtraneousValues: true
		})
	}

	@Auth()
	@Delete("/:id")
	@ApiOperation({ summary: "Delete a sticker by ID" })
	@ApiResponse({
		status: 200,
		description: "Sticker deleted successfully"
	})
	async delete(@Param("id", ParseUUIDPipe) id: string, @User() user: Claims) {
		await this.stickersService.delete(id, user.address)
		return { message: "Sticker deleted successfully" }
	}
}
