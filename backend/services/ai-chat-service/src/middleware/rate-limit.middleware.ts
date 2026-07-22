import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { redis } from '../infrastructure/redis.client.js';
import { Request, Response } from 'express';
import { AuthRequest } from './auth.middleware.js';

const rateLimitHandler = (req: Request, res: Response) => {
  console.error(`[AI-CHAT-SERVICE] [RATE-LIMIT] Blocked request from user ${(req as AuthRequest).user?.id}`);
  res.status(429).json({
    error: 'Too Many Requests',
    message: 'Rate limit exceeded. Please try again later.',
  });
};

export const chatRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    const userId = (req as AuthRequest).user?.id || 'anonymous';
    return `rl:mutation:${userId}`;
  },
  handler: rateLimitHandler,
  store: new RedisStore({
    // @ts-expect-error - Redis client type mismatch
    sendCommand: (...args: any[]) => redis.call(...args),
    prefix: 'rl:chat:',
  }),
});
