import { Redis } from "@upstash/redis";

let redis: Redis | null = null;
try {
  if (
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
} catch (error) {
  console.warn("Failed to initialize Upstash Redis for rate limiting:", error);
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  reset: number; // Unix timestamp in seconds
}

export async function rateLimit(
  walletAddress: string,
): Promise<RateLimitResult> {
  const limit = 5;
  const now = Math.floor(Date.now() / 1000);
  const windowSize = 3600; // 1 hour in seconds

  if (!redis) {
    return {
      allowed: true,
      limit,
      remaining: limit,
      reset: now + windowSize,
    };
  }

  const normalized = walletAddress.toLowerCase();
  const currentWindow = Math.floor(now / windowSize);
  const redisKey = `ratelimit:${normalized}:${currentWindow}`;

  try {
    const count = await redis.incr(redisKey);
    if (count === 1) {
      await redis.expire(redisKey, windowSize);
    }

    const remaining = Math.max(0, limit - count);
    const reset = (currentWindow + 1) * windowSize;

    return {
      allowed: count <= limit,
      limit,
      remaining,
      reset,
    };
  } catch (error) {
    console.error("Rate limit check failed, failing open:", error);
    return {
      allowed: true,
      limit,
      remaining: limit,
      reset: now + windowSize,
    };
  }
}
export { redis };
