import rateLimit from "express-rate-limit";

const DEFAULT_CAPACITY = 100;
const DEFAULT_REFILL_INTERVAL_MS = 2_000;
const MAX_TRACKED_KEYS = 50_000;

const rateLimitResponse = {
  success: false,
  message: "Too many requests. Please try again later.",
};

const pruneBuckets = (limiterBuckets, now, staleAfterMs) => {
  for (const [key, bucket] of limiterBuckets) {
    if (now - bucket.lastSeenAt >= staleAfterMs) limiterBuckets.delete(key);
  }

  while (limiterBuckets.size >= MAX_TRACKED_KEYS) {
    const oldestKey = limiterBuckets.keys().next().value;
    if (oldestKey === undefined) break;
    limiterBuckets.delete(oldestKey);
  }
};

export const createTokenBucketLimiter = ({
  capacity = DEFAULT_CAPACITY,
  refillIntervalMs = DEFAULT_REFILL_INTERVAL_MS,
} = {}) => {
  const limiterBuckets = new Map();
  const staleAfterMs = capacity * refillIntervalMs;

  return (req, res, next) => {
    const now = Date.now();
    const key = req.ip || req.socket?.remoteAddress || "unknown";
    let bucket = limiterBuckets.get(key);

    if (!bucket) {
      if (limiterBuckets.size >= MAX_TRACKED_KEYS) {
        pruneBuckets(limiterBuckets, now, staleAfterMs);
      }
      bucket = { tokens: capacity, lastRefillAt: now, lastSeenAt: now };
    } else {
      const elapsed = now - bucket.lastRefillAt;
      bucket.tokens = Math.min(capacity, bucket.tokens + elapsed / refillIntervalMs);
      bucket.lastRefillAt = now;
      bucket.lastSeenAt = now;
      limiterBuckets.delete(key);
    }

    if (bucket.tokens < 1) {
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil(((1 - bucket.tokens) * refillIntervalMs) / 1000)
      );
      limiterBuckets.set(key, bucket);
      res.set("RateLimit-Limit", String(capacity));
      res.set("RateLimit-Remaining", "0");
      res.set("RateLimit-Reset", String(retryAfterSeconds));
      res.set("Retry-After", String(retryAfterSeconds));
      return res.status(429).json({
        ...rateLimitResponse,
        retryAfter: retryAfterSeconds,
      });
    }

    bucket.tokens -= 1;
    limiterBuckets.set(key, bucket);
    res.set("RateLimit-Limit", String(capacity));
    res.set("RateLimit-Remaining", String(Math.floor(bucket.tokens)));
    res.set(
      "RateLimit-Reset",
      String(Math.ceil(((capacity - bucket.tokens) * refillIntervalMs) / 1000))
    );
    return next();
  };
};

export const createRateLimiter = (windowMs, limit, options = {}) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: rateLimitResponse,
    ...options,
  });

export const generalApiLimiter = createTokenBucketLimiter();
