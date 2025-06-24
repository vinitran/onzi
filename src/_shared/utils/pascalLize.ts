export const pascalLize = (str: string): string =>
	str
		.replace(/(?:^\w|[A-Z]|\b\w)/g, word => word.toUpperCase())
		.replace(/\s+|_/g, "")
