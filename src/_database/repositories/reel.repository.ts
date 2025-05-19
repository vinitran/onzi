import { Injectable } from "@nestjs/common"
import { Prisma } from "@prisma/client"
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
		return this.prisma.reel.findUnique({ where: { id } })
	}

	getDetail(id: string) {
		return this.prisma.reel.findUnique({
			where: { id },
			include: {
				token: {
					select: {
						id: true,
						address: true,
						name: true,
						imageUri: true,
						marketCapacity: true,
						description: true
					}
				}
			}
		})
	}

	getPrevByTime(currentId: string, createdAt: Date) {
		return this.prisma.reel.findFirst({
			where: {
				id: {
					not: currentId
				},
				createdAt: {
					lt: createdAt
				}
			},
			orderBy: {
				createdAt: "desc"
			}
		})
	}

	getNextByTime(currentId: string, createdAt: Date) {
		return this.prisma.reel.findFirst({
			where: {
				id: {
					not: currentId
				},
				createdAt: {
					gt: createdAt
				}
			},
			orderBy: {
				createdAt: "asc"
			}
		})
	}

	paginateByTokenId(
		payload: PaginateListReelParams & {
			tokenId: string
			orderBy?: Prisma.ReelOrderByWithRelationInput
		}
	) {
		const { page, take, tokenId, orderBy = { createdAt: "desc" } } = payload
		const skip = take * (page - 1)

		return this.prisma.reel.findMany({
			where: {
				tokenId
			},
			orderBy,
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

	delete(id: string) {
		return this.prisma.reel.delete({
			where: {
				id
			}
		})
	}
}
