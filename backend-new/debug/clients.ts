import Redis from 'ioredis';
import { Kafka } from 'kafkajs';

export const redis = new Redis({
  host: 'localhost',
  port: 6379,
  retryStrategy: (times) => {
    if (times > 3) {
      console.error('❌ Could not connect to Redis after 3 attempts');
      return null;
    }
    return Math.min(times * 100, 2000);
  }
});

export const kafka = new Kafka({
  clientId: 'debug-client',
  brokers: ['localhost:9094'],
  retry: {
    retries: 3,
    initialRetryTime: 100,
    maxRetryTime: 2000
  },
  connectionTimeout: 3000,
  requestTimeout: 5000
});

redis.on('error', (err) => {
  console.error('Redis connection error:', err.message);
});

redis.on('connect', () => {
  console.log('✅ Connected to Redis');
});
