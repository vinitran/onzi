import { Type, applyDecorators } from "@nestjs/common"
import {
	ApiExtraModels,
	ApiOkResponse,
	ApiProperty,
	getSchemaPath
} from "@nestjs/swagger"
import { Expose } from "class-transformer"
import { IsArray, IsPositive, Max, Min } from "class-validator"
import { IsInterger, OptionalProp } from "../_shared/utils/decorators"

export class PaginatedParams {
	@ApiProperty({
		description: "Page number (starting from 1)",
		example: 1,
		required: false,
		default: 1
	})
	@OptionalProp({ default: 1 })
	@IsPositive()
	@IsInterger
	@Min(1)
	readonly page: number = 1

	@ApiProperty({
		description: "Number of items per page",
		example: 20,
		required: false,
		default: 20,
		maximum: 300
	})
	@OptionalProp({ default: 20 })
	@IsPositive()
	@IsInterger
	@Min(1)
	@Max(300)
	readonly take: number = 10
}

export class Paginate<T> {
	@ApiProperty({
		description: "Array of paginated results",
		isArray: true
	})
	@IsArray()
	@Expose()
	data: T[]

	@ApiProperty({
		description: "Total number of items",
		example: 20
	})
	@Expose()
	total: number

	@ApiProperty({
		description: "Maximum number of pages",
		example: 1
	})
	@Expose()
	maxPage: number

	constructor(data: T[], total: number, maxPage: number) {
		this.data = data
		this.total = total
		this.maxPage = maxPage
	}
}

export const ApiPaginatedResponse = <TModel extends Type<unknown>>(
	model: TModel
) => {
	return applyDecorators(
		ApiExtraModels(Paginate, model),
		ApiOkResponse({
			schema: {
				allOf: [
					{ $ref: getSchemaPath(Paginate) },
					{
						properties: {
							data: {
								type: "array",
								items: { $ref: getSchemaPath(model) }
							}
						}
					}
				]
			}
		})
	)
}
