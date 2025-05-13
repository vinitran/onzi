export class CandleDto {
	tokenId: string
	step: number // seconds
	bucketStart: number // timestamp in s
	open: number
	high: number
	low: number
	close: number
	volume: number
}
