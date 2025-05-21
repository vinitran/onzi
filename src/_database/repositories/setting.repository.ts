import { Injectable } from "@nestjs/common"
import { PrismaService } from "@root/_database/prisma.service"

@Injectable()
export class SettingRepository {
	constructor(private prisma: PrismaService) {}

	findByKey(key: string) {
		return this.prisma.setting.findFirst({
			where: {
				key
			}
		})
	}

	findByKeys(keys: string[]) {
		return this.prisma.setting.findMany({
			where: {
				key: {
					in: keys
				}
			}
		})
	}

	set(key: string, value: string) {
		return this.prisma.setting.upsert({
			where: {
				key
			},
			create: {
				key,
				value
			},
			update: {
				value
			}
		})
	}
}
