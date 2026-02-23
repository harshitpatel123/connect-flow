import { Router, Request, Response } from 'express';
import { GetFeedUseCase } from '../application/get-feed.usecase.js';
import { RegenerateFeedUseCase } from '../application/regenerate-feed.usecase.js';
import { RerankFeedUseCase } from '../application/rerank-feed.usecase.js';
import { feedStore } from '../infrastructure/feed.store.js';
import { postServiceClient } from '../clients/post-service.client.js';
import { interactionServiceClient } from '../clients/interaction-service.client.js';
import { tracer } from '../config/jaeger.js';
import { FORMAT_HTTP_HEADERS } from 'opentracing';

const router = Router();

const getFeedUseCase = new GetFeedUseCase(feedStore, postServiceClient);
const regenerateFeedUseCase = new RegenerateFeedUseCase(
  feedStore,
  postServiceClient,
  interactionServiceClient
);
const rerankFeedUseCase = new RerankFeedUseCase(
  feedStore,
  postServiceClient,
  interactionServiceClient
);

// GET /feed/:userId - Get personalized feed with full post details
router.get('/:userId', async (req: Request, res: Response) => {
  const span = tracer.extract(FORMAT_HTTP_HEADERS, req.headers);
  const rootSpan = tracer.startSpan('GET /feed/:userId', { childOf: span || undefined });
  rootSpan.setTag('user.id', req.params.userId);
  
  try {
    const { userId } = req.params;
    console.log(`[FEED-SERVICE] Getting feed for user: ${userId}`);
    const posts = await getFeedUseCase.execute(userId, rootSpan);
    rootSpan.setTag('posts.count', posts.length);
    res.status(200).json(posts);
  } catch (error: any) {
    console.error(`[FEED-SERVICE] ❌ Get feed failed: ${error.message}`);
    rootSpan.setTag('error', true);
    rootSpan.log({ event: 'error', message: error.message });
    res.status(500).json({ error: error.message });
  } finally {
    rootSpan.finish();
  }
});

// POST /feed/:userId/regenerate - Regenerate feed with trending posts
router.post('/:userId/regenerate', async (req: Request, res: Response) => {
  const span = tracer.extract(FORMAT_HTTP_HEADERS, req.headers);
  const rootSpan = tracer.startSpan('POST /feed/:userId/regenerate', { childOf: span || undefined });
  rootSpan.setTag('user.id', req.params.userId);
  
  try {
    const { userId } = req.params;
    console.log(`[FEED-SERVICE] Regenerating feed for user: ${userId}`);
    const posts = await regenerateFeedUseCase.execute(userId, rootSpan);
    rootSpan.setTag('posts.count', posts.length);
    res.status(200).json(posts);
  } catch (error: any) {
    console.error(`[FEED-SERVICE] ❌ Regenerate feed failed: ${error.message}`);
    rootSpan.setTag('error', true);
    rootSpan.log({ event: 'error', message: error.message });
    res.status(500).json({ error: error.message });
  } finally {
    rootSpan.finish();
  }
});

// POST /feed/:userId/rerank - Re-rank feed based on updated interests
router.post('/:userId/rerank', async (req: Request, res: Response) => {
  const span = tracer.extract(FORMAT_HTTP_HEADERS, req.headers);
  const rootSpan = tracer.startSpan('POST /feed/:userId/rerank', { childOf: span || undefined });
  rootSpan.setTag('user.id', req.params.userId);
  
  try {
    const { userId } = req.params;
    console.log(`[FEED-SERVICE] Re-ranking feed for user: ${userId}`);
    await rerankFeedUseCase.execute(userId, rootSpan);
    res.status(200).json({ success: true });
  } catch (error: any) {
    console.error(`[FEED-SERVICE] ❌ Rerank feed failed: ${error.message}`);
    rootSpan.setTag('error', true);
    rootSpan.log({ event: 'error', message: error.message });
    res.status(500).json({ error: error.message });
  } finally {
    rootSpan.finish();
  }
});

export default router;
