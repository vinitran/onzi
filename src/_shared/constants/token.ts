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

export const STOP_WORDS = new Set([
	"the",
	"and",
	"for",
	"with",
	"you",
	"your",
	"are",
	"but",
	"was",
	"were",
	"can",
	"has",
	"have",
	"had",
	"not",
	"this",
	"that",
	"from",
	"they",
	"them",
	"it's",
	"its",
	"out",
	"all",
	"any",
	"our",
	"more",
	"about",
	"into",
	"other",
	"than",
	"some",
	"such",
	"only",
	"over",
	"again",
	"each",
	"most",
	"own",
	"same",
	"too",
	"very",
	"just",
	"one",
	"two",
	"use",
	"using",
	"used",
	"how",
	"what",
	"when",
	"where",
	"who",
	"why",
	"which",
	"also",
	"their",
	"there",
	"been",
	"being",
	"name",
	"ticker",
	"token",
	"project",
	"description"
])

export const SICKO_MODE_TOKEN_EMIT_EVENTS = {
	NEW_TOKEN: "sicko-mode-new-token",
	UPDATE_TOKEN: "sicko-mode-update-token"
}
