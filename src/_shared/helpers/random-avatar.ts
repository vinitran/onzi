import fs from "node:fs"

export const randomAvatar = (): string => {
	const ratios = JSON.parse(
		fs.readFileSync("src/_shared/helpers/image_ratios.json", "utf8")
	) as Record<string, number>

	const images = Object.keys(ratios)
	const weights = Object.values(ratios)

	const totalWeight = weights.reduce((a, b) => a + b, 0)
	let randomNum = Math.random() * totalWeight

	for (let i = 0; i < images.length; i++) {
		randomNum -= weights[i]
		if (randomNum <= 0) {
			return images[i]
		}
	}

	return images[images.length - 1]
}
