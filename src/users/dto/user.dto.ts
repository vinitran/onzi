import { UserConnection } from "@root/users/dto/user-connection.dto"
import { Expose } from "class-transformer"

export class UserResponse {
	@Expose()
	id: string

	@Expose()
	address: string

	@Expose()
	follower: UserConnection[]

	@Expose()
	following: UserConnection[]

	@Expose()
	createdAt: string

	@Expose()
	updatedAt: string

	constructor(partial: Partial<UserResponse>) {
		Object.assign(this, partial)
	}
}
