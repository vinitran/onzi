import { Injectable } from "@nestjs/common"
import { Prisma, Reel } from "@prisma/client"
import { REPORTED_REEL_SORT_OPTIONS } from "@root/_shared/constants/reel"
import {
	PaginateListReelParams,
	PaginateReportedReelDto
} from "@root/reels/dtos/payload.dto"
import { PrismaService } from "../prisma.service"

@Injectable()
export class ReelRepository {
	constructor(private prisma: PrismaService) {}

	findById(id: string) {
		return this.prisma.reel.findUnique({
			where: { id, token: { isDeleted: false } }
		})
	}

	getDetail(id: string) {
		return this.prisma.reel.findUnique({
			where: { id, token: { isDeleted: false } },
			include: {
				token: {
					select: {
						id: true,
						address: true,
						bump: true,
						name: true,
						imageUri: true,
						marketCapacity: true,
						description: true,
						ticker: true,
						totalSupply: true,
						price: true
					}
				}
			}
		})
	}

	async getPrevInToken(currentReel: Reel) {
		const isPinned = currentReel.pinnedAt !== null

		if (!isPinned) {
			// 1. Find the next (newer) normal (unpinned) reel
			const prevNormal = await this.prisma.reel.findFirst({
				where: {
					tokenId: currentReel.tokenId,
					token: { isDeleted: false },
					id: { not: currentReel.id },
					pinnedAt: null,
					createdAt: { gt: currentReel.createdAt }
				},
				orderBy: [{ createdAt: "asc" }]
			})

			if (prevNormal) return prevNormal

			// 2. If there are no newer normal (unpinned) reels → get the newest pinned reel
			const latestPinned = await this.prisma.reel.findFirst({
				where: {
					tokenId: currentReel.tokenId,
					token: { isDeleted: false },
					pinnedAt: { not: null }
				},
				orderBy: [{ pinnedAt: "asc" }]
			})

			return latestPinned ?? null
		}

		// If the reel is pinned → find the next (newer) pinned reel
		return this.prisma.reel.findFirst({
			where: {
				tokenId: currentReel.tokenId,
				token: { isDeleted: false },
				id: { not: currentReel.id },
				pinnedAt: {
					gte: currentReel.pinnedAt!
				},
				OR: [
					{
						pinnedAt: currentReel.pinnedAt!,
						createdAt: { gt: currentReel.createdAt }
					},
					{
						pinnedAt: { gt: currentReel.pinnedAt! }
					}
				]
			},
			orderBy: [{ pinnedAt: "asc" }, { createdAt: "asc" }]
		})
	}

	async getNextInToken(currentReel: Reel) {
		const isPinned = currentReel.pinnedAt !== null

		if (isPinned) {
			// 1. Find the next (older) pinned reel
			const nextPinned = await this.prisma.reel.findFirst({
				where: {
					tokenId: currentReel.tokenId,
					token: { isDeleted: false },
					id: { not: currentReel.id },
					pinnedAt: {
						lte: currentReel.pinnedAt!
					},
					OR: [
						{
							pinnedAt: currentReel.pinnedAt!,
							createdAt: { lt: currentReel.createdAt }
						},
						{
							pinnedAt: { lt: currentReel.pinnedAt! }
						}
					]
				},
				orderBy: [{ pinnedAt: "desc" }, { createdAt: "desc" }]
			})

			if (nextPinned) return nextPinned

			// 2. If there are no more pinned reels → get the newest normal (unpinned) reel
			const nextNormal = await this.prisma.reel.findFirst({
				where: {
					tokenId: currentReel.tokenId,
					token: { isDeleted: false },
					pinnedAt: null
				},
				orderBy: [{ createdAt: "desc" }]
			})

			return nextNormal ?? null
		}

		// If it's a normal (unpinned) reel → find an older normal (unpinned) reel
		return this.prisma.reel.findFirst({
			where: {
				tokenId: currentReel.tokenId,
				token: { isDeleted: false },
				id: { not: currentReel.id },
				pinnedAt: null,
				createdAt: { lt: currentReel.createdAt }
			},
			orderBy: [{ createdAt: "desc" }]
		})
	}

	async paginate({ page, take }: PaginateListReelParams) {
		const skip = take * (page - 1)

		const [data, total] = await Promise.all([
			this.prisma.reel.findMany({
				orderBy: {
					createdAt: "desc"
				},
				skip,
				take,
				where: {
					token: { isDeleted: false }
				}
			}),
			this.prisma.reel.count()
		])

		return {
			data,
			total,
			maxPage: Math.ceil(total / take)
		}
	}

	getLatestByTime() {
		return this.prisma.reel.findFirst({
			orderBy: {
				createdAt: "desc"
			},
			where: {
				token: { isDeleted: false }
			}
		})
	}

	//   Get previous reel by time
	getPrevByTime(currentReel: Reel) {
		return this.prisma.reel.findFirst({
			where: {
				id: { not: currentReel.id },
				createdAt: { gt: currentReel.createdAt },
				token: { isDeleted: false }
			},
			orderBy: [{ createdAt: "asc" }]
		})
	}

	//   Get next reel by time
	getNextByTime(currentReel: Reel) {
		return this.prisma.reel.findFirst({
			where: {
				id: { not: currentReel.id },
				createdAt: { lt: currentReel.createdAt },
				token: { isDeleted: false }
			},
			orderBy: [{ createdAt: "desc" }]
		})
	}

	paginateByTokenId(
		payload: PaginateListReelParams & {
			tokenId: string
			orderBy?: Prisma.ReelOrderByWithRelationInput
		}
	) {
		const { page, take, tokenId } = payload
		const skip = take * (page - 1)

		return this.prisma.reel.findMany({
			where: {
				tokenId,
				token: { isDeleted: false }
			},
			orderBy: [
				{
					pinnedAt: {
						sort: "desc",
						nulls: "last"
					}
				},
				{
					createdAt: "desc"
				}
			],
			skip,
			take
		})
	}

	paginateByReport(payload: PaginateReportedReelDto) {
		const { page, take, text, sortBy } = payload
		const skip = (page - 1) * take
		let orderBy: Prisma.ReelOrderByWithRelationInput = {}

		switch (sortBy) {
			case REPORTED_REEL_SORT_OPTIONS.CREATED_AT:
				orderBy = { createdAt: "desc" }
				break
			case REPORTED_REEL_SORT_OPTIONS.AMOUNT_REPORT:
				orderBy = { reelReports: { _count: "desc" } }
				break
		}

		return this.prisma.reel.findMany({
			where: {
				caption: { contains: text },
				reelReports: { some: {} }
			},
			include: {
				creator: {
					select: { id: true, avatarUrl: true, username: true }
				},
				reelReports: {
					include: {
						reporter: {
							select: {
								id: true,
								avatarUrl: true,
								username: true
							}
						}
					},
					orderBy: {
						createdAt: "desc"
					}
				}
			},
			orderBy,
			take,
			skip
		})
	}

	getListPin(tokenId: string) {
		return this.prisma.reel.findMany({
			where: {
				tokenId,
				token: { isDeleted: false },
				pinnedAt: { not: null }
			}
		})
	}

	getLatestPinByToken(tokenId: string) {
		return this.prisma.reel.findFirst({
			where: {
				tokenId,
				token: { isDeleted: false },
				pinnedAt: { not: null }
			},
			orderBy: {
				createdAt: "desc"
			}
		})
	}

	getTotal(where: Prisma.ReelWhereInput) {
		return this.prisma.reel.count({ where })
	}

	getTotalByTokenId(tokenId: string) {
		return this.prisma.reel.count({ where: { tokenId } })
	}

	create(payload: Prisma.ReelCreateInput) {
		return this.prisma.reel.create({ data: payload })
	}

	increaseView(id: string) {
		return this.prisma.reel.update({
			where: { id },
			data: {
				viewAmount: {
					increment: 1
				}
			}
		})
	}

	pin(id: string, pinnedAt: Date) {
		return this.prisma.reel.update({
			where: { id },
			data: {
				pinnedAt
			}
		})
	}

	unpin(id: string) {
		return this.prisma.reel.update({
			where: { id },
			data: {
				pinnedAt: null
			}
		})
	}

	delete(id: string) {
		return this.prisma.reel.delete({
			where: {
				id
			}
		})
	}
}
