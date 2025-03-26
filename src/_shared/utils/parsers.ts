import { Expose } from "class-transformer"
import { IsPositive, Max, Min } from "class-validator"
import { IsInterger, OptionalProp } from "./decorators"

export class PaginatedParams {
	@OptionalProp({ default: 1 })
	@IsPositive()
	@IsInterger
	@Min(1)
	readonly page: number = 1

	@OptionalProp({ default: 20 })
	@IsPositive()
	@IsInterger
	@Min(1)
	@Max(300)
	readonly take: number = 10
}

export class PaginatedResponse<T> {
	@Expose()
	data: T[]

	@Expose()
	total: number

	@Expose()
	maxPage: number

	constructor(data: T[], total: number, maxPage: number) {
		this.data = data
		this.total = total
		this.maxPage = maxPage
	}
}
