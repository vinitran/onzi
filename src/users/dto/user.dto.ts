import { Expose } from "class-transformer"

export class UserResponse {
	@Expose()
	id: string

	@Expose()
	address: string

	@Expose()
	createdAt: string

	@Expose()
	updatedAt: string

	constructor(partial: Partial<UserResponse>) {
		Object.assign(this, partial)
	}
}
