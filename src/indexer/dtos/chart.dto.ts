export class CandleDto {
	tokenId: string
	step: number // seconds
	date: number // timestamp in s
	open: number
	high: number
	low: number
	close: number
	volume: number
}
