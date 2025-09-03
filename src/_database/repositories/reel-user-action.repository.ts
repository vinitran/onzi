import { Injectable } from "@nestjs/common"
import { Prisma, UserActionStatus } from "@prisma/client"
import { PrismaService } from "../prisma.service"

@Injectable()
export class ReelUserActionRepository {
	constructor(private prisma: PrismaService) {}

	create(payload: Prisma.ReelUserActionCreateInput) {
		return this.prisma.reelUserAction.create({ data: payload })
	}

	findOne(where: Prisma.ReelUserActionWhereInput) {
		return this.prisma.reelUserAction.findFirst({
			where
		})
	}

	updateActionById(id: string, action: UserActionStatus) {
		return this.prisma.reelUserAction.update({
			where: {
				id
			},
			data: {
				status: action
			}
		})
	}

	deleteById(id: string) {
		return this.prisma.reelUserAction.delete({
			where: { id }
		})
	}

	getTotalActionByReelId(reelId: string, action: UserActionStatus) {
		return this.prisma.reelUserAction.count({
			where: {
				reelId,
				status: action
			}
		})
	}

	async getActionsByReelId(reelId: string) {
		return this.prisma.reelUserAction.groupBy({
			by: ["status"],
			where: { reelId },
			_count: {
				_all: true
			}
		})
	}

	async getActionsOfUserByReelId(reelId: string, userId: string) {
		return this.prisma.reelUserAction.groupBy({
			by: ["status"],
			where: { reelId, creatorId: userId },
			_count: {
				_all: true
			}
		})
	}
}
