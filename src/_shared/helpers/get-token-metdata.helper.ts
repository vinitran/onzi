import axios from "axios"

export const getTokenMetaData = (uri: string) =>
	axios
		.get(uri)
		.then(res => res.data)
		.catch(() => ({}))
