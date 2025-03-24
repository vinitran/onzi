import { Prop } from "@root/_shared/utils/decorators"
import { Expose } from "class-transformer"

export class FollowingPayload {
	@Prop()
	followingId: string
}

export class UnfollowingPayload {
	@Prop()
	followId: string
}

export class UserConnection {
	@Expose()
	id: string

	@Expose()
	followingId: string

	@Expose()
	followerId: string

	@Expose()
	createdAt: string

	@Expose()
	updatedAt: string

	constructor(partial: Partial<UserConnection>) {
		Object.assign(this, partial)
	}
}
