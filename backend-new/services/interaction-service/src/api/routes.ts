import { Router, Request, Response } from 'express';
import { LikePostUseCase } from '../application/like-post.usecase.js';
import { UnlikePostUseCase } from '../application/unlike-post.usecase.js';
import { CommentPostUseCase } from '../application/comment-post.usecase.js';
import { ViewPostUseCase } from '../application/view-post.usecase.js';
import { InteractionRepository } from '../infrastructure/interaction.repository.js';
import { InteractionEventProducer } from '../events/interaction-event.producer.js';
import { likeStore } from '../infrastructure/like.store.js';
import { seenStore } from '../infrastructure/seen.store.js';
import { prisma } from '../infrastructure/prisma.client.js';

const router = Router();

const repository = new InteractionRepository(prisma);
const eventProducer = new InteractionEventProducer();
const likePostUseCase = new LikePostUseCase(likeStore, eventProducer);
const unlikePostUseCase = new UnlikePostUseCase(likeStore, eventProducer);
const commentPostUseCase = new CommentPostUseCase(repository, eventProducer);
const viewPostUseCase = new ViewPostUseCase(seenStore, eventProducer);

// POST /interactions/like
router.post('/like', async (req: Request, res: Response) => {
  try {
    const { userId, postId } = req.body;
    if (!userId || !postId) {
      return res.status(400).json({ error: 'userId and postId are required' });
    }
    await likePostUseCase.execute(userId, postId);
    res.status(200).json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /interactions/unlike
router.post('/unlike', async (req: Request, res: Response) => {
  try {
    const { userId, postId } = req.body;
    if (!userId || !postId) {
      return res.status(400).json({ error: 'userId and postId are required' });
    }
    await unlikePostUseCase.execute(userId, postId);
    res.status(200).json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /interactions/comment
router.post('/comment', async (req: Request, res: Response) => {
  try {
    const { userId, postId, content } = req.body;
    if (!userId || !postId || !content) {
      return res.status(400).json({ error: 'userId, postId, and content are required' });
    }
    await commentPostUseCase.execute(userId, postId, content);
    res.status(200).json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /interactions/view
router.post('/view', async (req: Request, res: Response) => {
  try {
    const { userId, postId } = req.body;
    if (!userId || !postId) {
      return res.status(400).json({ error: 'userId and postId are required' });
    }
    const result = await viewPostUseCase.execute(userId, postId);
    res.status(200).json({ success: true, newView: result });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /interactions/likes/:postId
router.get('/likes/:postId', async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;
    const likes = await repository.getPostLikes(postId);
    res.status(200).json(likes);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /interactions/comments/:postId
router.get('/comments/:postId', async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;
    const comments = await repository.getPostComments(postId);
    res.status(200).json(comments);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /interactions/interests/:userId
router.get('/interests/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const interests = await repository.getUserInterests(userId);
    res.status(200).json(interests);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /interactions/interests/qualified-users - Get users with min score for categories
router.post('/interests/qualified-users', async (req: Request, res: Response) => {
  try {
    const { categories, minScore } = req.body;
    if (!Array.isArray(categories) || minScore === undefined) {
      return res.status(400).json({ error: 'categories (array) and minScore (number) are required' });
    }
    const users = await repository.getUsersWithMinScoreForCategories(categories, minScore);
    res.status(200).json(users);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /interactions/interests/:userId/:category/affinity - Get user category affinity
router.get('/interests/:userId/:category/affinity', async (req: Request, res: Response) => {
  try {
    const { userId, category } = req.params;
    const affinity = await repository.getUserCategoryAffinity(userId, category);
    res.status(200).json({ affinity });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /interactions/history/:userId - Get user interaction history
router.get('/history/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    // Get liked and commented post IDs
    const [likedPostIds, commentedPostIds] = await Promise.all([
      repository.getUserLikedPostIds(userId),
      repository.getUserCommentedPostIds(userId)
    ]);
    
    res.status(200).json({
      likedPostIds,
      commentedPostIds
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
