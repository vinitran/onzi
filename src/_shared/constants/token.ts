import { Prisma } from "@prisma/client"

export const TOKEN_TOTAL_SUPPLY_DEFAULT = new Prisma.Decimal(10).pow(9)

export const TOKEN_GATEWAY_LISTEN_EVENTS = {
	CREATE: "create-token"
}

export const TOKEN_GATEWAY_EMIT_EVENTS = {
	RECEIVE: "receive-token"
}

export enum TOKEN_SUMMARY_OPTION {
	POPULAR = "POPULAR",
	HALL_OF_FAME = "HALL_OF_FAME"
}
