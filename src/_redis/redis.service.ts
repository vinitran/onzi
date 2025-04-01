import { Injectable } from "@nestjs/common"
import { Redis } from "ioredis"
import { InjectRedis } from "@nestjs-modules/ioredis"

@Injectable()
export class RedisService {
	constructor(@InjectRedis() private readonly redis: Redis) {}

	async set(
		key: string,
		value: string,
		seconds: number | string = 300
	): Promise<void> {
		await this.redis.set(key, value, "EX", 300)
	}

	async get(key: string): Promise<string | null> {
		return this.redis.get(key)
	}

	async del(key: string): Promise<number> {
		return this.redis.del(key)
	}

	/**
	 * This function checks if a value is available in the cache.
	 * If it is, it returns the cached value.
	 * If not, it calls the provided function, stores the result in the cache, and returns it.
	 * @param key The cache key to check.
	 * @param func The function to call if the value is not in the cache.
	 * @param seconds The expiration time for the cache in seconds (default is 300).
	 * @returns The result, either from the cache or from the function.
	 */
	async getOrSet<T>(
		key: string,
		func: () => Promise<T>,
		seconds: number | string = 300 // Default cache expiration is 300 seconds.
	): Promise<T> {
		// Check if the value exists in the cache
		const cachedValue = await this.redis.get(key)

		if (cachedValue) {
			// If the value exists, return it (parse it as the appropriate type)
			return JSON.parse(cachedValue) as T
		}

		// If the value doesn't exist in the cache, call the provided function
		const result = await func()

		// Store the result in the cache with the specified expiration time
		await this.redis.set(key, JSON.stringify(result), "EX", seconds)

		// Return the result from the function
		return result
	}
}
