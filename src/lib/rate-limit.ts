// Simple in-memory rate limiter for production-ready API protection
// In a distributed environment, this should be replaced with Redis.

type RateLimitInfo = {
  count: number;
  resetAt: number;
};

const cache = new Map<string, RateLimitInfo>();

/**
 * Rate limit a request based on an identifier (e.g., IP address or user ID)
 * 
 * @param identifier Unique identifier for the client
 * @param limit Maximum number of requests in the window
 * @param windowMs Time window in milliseconds
 * @returns Object with success status and limit info
 */
export async function rateLimit(
  identifier: string,
  limit: number = 10,
  windowMs: number = 60000
) {
  const now = Date.now();
  
  // Clean up old entries occasionally (1% chance on each call)
  if (Math.random() < 0.01) {
    for (const [key, value] of cache.entries()) {
      if (now > value.resetAt) {
        cache.delete(key);
      }
    }
  }

  const info = cache.get(identifier);

  if (!info || now > info.resetAt) {
    const newInfo = {
      count: 1,
      resetAt: now + windowMs,
    };
    cache.set(identifier, newInfo);
    return { 
      success: true, 
      limit, 
      remaining: limit - 1,
      resetAt: newInfo.resetAt
    };
  }

  if (info.count >= limit) {
    return { 
      success: false, 
      limit, 
      remaining: 0, 
      resetAt: info.resetAt 
    };
  }

  info.count += 1;
  return { 
    success: true, 
    limit, 
    remaining: limit - info.count,
    resetAt: info.resetAt
  };
}
