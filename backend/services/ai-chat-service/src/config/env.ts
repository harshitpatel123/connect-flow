import { z } from 'zod';

const schema = z.object({
  PORT: z.string().default('5005'),
  DATABASE_URL: z.string().min(1),
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.string().default('6379'),
  GEMINI_API_KEY: z.string().min(1, 'GEMINI_API_KEY is required'),
  JWT_SECRET: z.string().min(1, 'JWT_SECRET is required'),
  CONSUL_HOST: z.string().default('consul'),
  CONSUL_PORT: z.string().default('8500'),
  SERVICE_NAME: z.string().default('ai-chat-service'),
  SERVICE_ID: z.string().default('ai-chat-service-1'),
  SERVICE_ADDRESS: z.string().default('ai-chat-service'),
});

export const env = schema.parse(process.env);
