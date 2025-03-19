import { Max, Min } from "class-validator"
import { IsInterger, OptionalProp } from "./decorators"

export class PaginatedParams {
	@OptionalProp({ default: 1 })
	@IsInterger
	@Min(1)
	readonly page: number = 1

	@OptionalProp({ default: 20 })
	@IsInterger
	@Min(1)
	@Max(300)
	readonly take: number = 10
}

export class PaginatedResponse<T> {
	data: T[]
	total: number
	page: number
}
