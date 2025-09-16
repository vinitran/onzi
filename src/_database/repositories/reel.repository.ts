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
						price: true,
						raydiumStatus: true
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

	getLatestByTime(excludedReelIds: string[] = []) {
		return this.prisma.reel.findFirst({
			orderBy: {
				createdAt: "desc"
			},
			where: {
				token: { isDeleted: false },
				id: { notIn: excludedReelIds }
			}
		})
	}

	checkViewed(reelId: string, viewerId: string) {
		return this.prisma.reelView.findFirst({
			where: {
				reelId,
				viewerId
			}
		})
	}

	async getLatest({
		excludedReelIds = [],
		userId
	}: {
		userId?: string
		excludedReelIds?: string[]
	}) {
		if (!userId) return this.getLatestByTime(excludedReelIds)

		const unViewedReel = await this.prisma.reel.findFirst({
			where: {
				token: { isDeleted: false },
				reelViews: {
					none: {
						viewerId: userId
					}
				}
			},
			orderBy: {
				createdAt: "desc"
			}
		})

		return unViewedReel || this.getLatestByTime()
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

	async getPrev(payload: {
		currentReel: Reel
		userId?: string
		isWatching?: boolean
	}) {
		const { currentReel, userId, isWatching } = payload
		if (!userId || isWatching) return this.getPrevByTime(currentReel)

		const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)

		// ✅ Chỉ cho phép quay lại reel đã xem gần đây hơn current
		const prevViewed = await this.prisma.reel.findFirst({
			where: {
				createdAt: { gt: currentReel.createdAt },
				token: { isDeleted: false },
				reelViews: {
					some: {
						viewerId: userId,
						createdAt: { gte: oneHourAgo }
					}
				}
			},
			orderBy: {
				createdAt: "asc"
			}
		})

		if (!isWatching && prevViewed) {
			const isViewed = !!(await this.checkViewed(prevViewed?.id, userId))
			if (isViewed) return null
		}

		return prevViewed ?? null
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

	async getNext(payload: {
		currentReel: Reel
		userId?: string
		isWatching?: boolean
	}) {
		const { currentReel, userId, isWatching } = payload

		if (!userId) return this.getNextByTime(currentReel)

		const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)

		// 1) Tìm reel chưa xem **cũ hơn** current (closest older unseen)
		const nextUnseenOlder = await this.prisma.reel.findFirst({
			where: {
				id: { not: currentReel.id },
				token: { isDeleted: false },
				createdAt: { lt: currentReel.createdAt }, // older than current
				reelViews: {
					none: { viewerId: userId }
				}
			},
			orderBy: { createdAt: "desc" } // closest older first
		})
		if (nextUnseenOlder) return nextUnseenOlder

		// 2) Nếu không có unseen older, thử unseen **mới hơn** current (closest newer)
		const nextUnseenNewer = await this.prisma.reel.findFirst({
			where: {
				id: { not: currentReel.id },
				token: { isDeleted: false },
				createdAt: { gt: currentReel.createdAt }, // newer than current
				reelViews: {
					none: { viewerId: userId }
				}
			},
			orderBy: { createdAt: "asc" } // closest newer first
		})
		if (nextUnseenNewer) return nextUnseenNewer

		// 3) Nếu đang isWatching, thử tìm reel đã xem gần đây (within 1 hour), ưu tiên older first
		if (isWatching) {
			const nextViewedRecent = await this.prisma.reel.findFirst({
				where: {
					id: { not: currentReel.id },
					token: { isDeleted: false },
					createdAt: { lt: currentReel.createdAt }, // prefer older viewed recently
					reelViews: {
						some: {
							viewerId: userId,
							createdAt: { gte: oneHourAgo }
						}
					}
				},
				orderBy: { createdAt: "desc" }
			})

			if (nextViewedRecent) return nextViewedRecent

			// fallback: if none older, try newer viewed within 1 hour
			const nextViewedRecentNewer = await this.prisma.reel.findFirst({
				where: {
					id: { not: currentReel.id },
					token: { isDeleted: false },
					createdAt: { gt: currentReel.createdAt },
					reelViews: {
						some: {
							viewerId: userId,
							createdAt: { gte: oneHourAgo }
						}
					}
				},
				orderBy: { createdAt: "asc" }
			})

			if (nextViewedRecentNewer) return nextViewedRecentNewer
		}

		// 4) Nếu thực sự không còn unseen gần current, chọn bất kỳ unseen (most recent unseen)
		const anyUnseen = await this.prisma.reel.findFirst({
			where: {
				id: { not: currentReel.id },
				token: { isDeleted: false },
				reelViews: {
					none: { viewerId: userId }
				}
			},
			orderBy: { createdAt: "desc" }
		})
		if (anyUnseen) return anyUnseen

		// 5) Fallbacks cuối cùng
		return (await this.getNextByTime(currentReel)) || (await this.getLatest({}))
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
