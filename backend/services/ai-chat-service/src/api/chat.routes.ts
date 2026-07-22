import { Router } from 'express';
import { ChatController } from './chat.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { chatRateLimiter } from '../middleware/rate-limit.middleware.js';
import { CreateSessionUseCase } from '../application/create-session.usecase.js';
import { SendMessageUseCase } from '../application/send-message.usecase.js';
import { GetHistoryUseCase } from '../application/get-history.usecase.js';
import { ChatSessionRepository } from '../infrastructure/repositories/chat-session.repository.js';
import { ChatMessageRepository } from '../infrastructure/repositories/chat-message.repository.js';
import { ChatContextCache } from '../infrastructure/cache/chat-context.cache.js';
import { GeminiClient } from '../infrastructure/ai/gemini.client.js';
import { prisma } from '../infrastructure/prisma.client.js';
import { redis } from '../infrastructure/redis.client.js';
import { env } from '../config/env.js';

const router = Router();

// Wire dependencies
const sessionRepo = new ChatSessionRepository(prisma);
const messageRepo = new ChatMessageRepository(prisma);
const contextCache = new ChatContextCache(redis);
const geminiClient = new GeminiClient(env.GEMINI_API_KEY);

const createSessionUseCase = new CreateSessionUseCase(sessionRepo);
const sendMessageUseCase = new SendMessageUseCase(sessionRepo, messageRepo, contextCache, geminiClient);
const getHistoryUseCase = new GetHistoryUseCase(sessionRepo, messageRepo);

const controller = new ChatController(createSessionUseCase, sendMessageUseCase, getHistoryUseCase, sessionRepo);

// GET  /api/chat/sessions              -> list all sessions for user
router.get('/sessions', authMiddleware, (req, res) => controller.listSessions(req as any, res));

// POST /api/chat/sessions              -> create new session
router.post('/sessions', authMiddleware, chatRateLimiter, (req, res) => controller.createSession(req as any, res));

// GET  /api/chat/sessions/:id/messages -> full history
router.get('/sessions/:id/messages', authMiddleware, (req, res) => controller.getHistory(req as any, res));

// POST /api/chat/sessions/:id/messages -> SSE stream
router.post('/sessions/:id/messages', authMiddleware, chatRateLimiter, (req, res) => controller.sendMessage(req as any, res));

export default router;
