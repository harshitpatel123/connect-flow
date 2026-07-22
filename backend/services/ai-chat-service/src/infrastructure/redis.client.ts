import Redis from 'ioredis';
import { env } from '../config/env.js';

export const redis = new Redis({
  host: env.REDIS_HOST,
  port: parseInt(env.REDIS_PORT),
  retryStrategy: (times) => Math.min(times * 50, 2000),
});

redis.on('connect', () => console.log('✅ Redis connected'));
redis.on('error', (err) => console.error('❌ Redis error:', err));
