import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { redis } from '../config/redis';
import { Request, Response } from 'express';

// Key generator for IP-based rate limiting
const ipKeyGenerator = (req: Request): string => {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = forwarded 
    ? (typeof forwarded === 'string' ? forwarded.split(',')[0] : forwarded[0])
    : req.ip || req.socket.remoteAddress || 'unknown';
  return `ratelimit:ip:${ip}`;
};

// Key generator for user-based rate limiting
const userKeyGenerator = (req: Request): string => {
  const userId = (req as any).userId || 'anonymous';
  return `ratelimit:user:${userId}`;
};

// Custom handler for rate limit exceeded
const rateLimitHandler = (req: Request, res: Response) => {
  const retryAfter = res.getHeader('Retry-After');
  console.error(`[RATE-LIMIT] Blocked request from ${req.ip} to ${req.path}`);
  
  res.status(429).json({
    error: 'Too Many Requests',
    message: 'Rate limit exceeded. Please try again later.',
    retryAfter: retryAfter ? parseInt(retryAfter as string) : 60,
  });
};

// Skip rate limiting for health checks
const skipHealthChecks = (req: Request): boolean => {
  return req.path === '/health' || req.path === '/metrics';
};

// Global rate limiter (IP-based) - DDoS protection
export const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // 1000 requests per 15 minutes per IP
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: ipKeyGenerator,
  handler: rateLimitHandler,
  skip: skipHealthChecks,
  store: new RedisStore({
    // @ts-expect-error - Redis client type mismatch
    sendCommand: (...args: any[]) => redis.call(...args),
    prefix: 'rl:global:',
  }),
});

// Mutation rate limiter (per user)
const mutationRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 mutations per minute
  message: 'Too many write operations, please slow down.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: userKeyGenerator,
  handler: rateLimitHandler,
  skip: skipHealthChecks,
  store: new RedisStore({
    // @ts-expect-error - Redis client type mismatch
    sendCommand: (...args: any[]) => redis.call(...args),
    prefix: 'rl:mutation:',
  }),
});

// Query rate limiter (per user, higher limit)
const queryRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 queries per minute
  message: 'Too many read operations, please slow down.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: userKeyGenerator,
  handler: rateLimitHandler,
  skip: skipHealthChecks,
  store: new RedisStore({
    // @ts-expect-error - Redis client type mismatch
    sendCommand: (...args: any[]) => redis.call(...args),
    prefix: 'rl:query:',
  }),
});

// GraphQL-specific rate limiter based on operation type
export const graphqlRateLimiter = (req: Request, res: Response, next: any) => {
  const query = req.body?.query || '';
  const isMutation = query.trim().startsWith('mutation');
  
  // Apply appropriate rate limiter
  if (isMutation) {
    return mutationRateLimiter(req, res, next);
  } else {
    return queryRateLimiter(req, res, next);
  }
};
