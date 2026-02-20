import { Router, Request, Response } from 'express';
import { CreatePostUseCase } from '../application/create-post.usecase.js';
import { PostRepository } from '../infrastructure/post.repository.js';
import { PostEventPublisher } from '../events/post-event.publisher.js';
import { prisma } from '../infrastructure/prisma.client.js';

const router = Router();

const postRepository = new PostRepository(prisma);
const postEventPublisher = new PostEventPublisher();
const createPostUseCase = new CreatePostUseCase(postRepository, postEventPublisher);

// POST /posts - Create post
router.post('/', async (req: Request, res: Response) => {
  try {
    const { userId, content, categoryTags } = req.body;
    
    if (!userId || !content) {
      return res.status(400).json({ error: 'userId and content are required' });
    }

    const post = await createPostUseCase.execute({ userId, content, categoryTags });
    res.status(201).json(post);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /posts/:id - Get post by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const post = await postRepository.findById(id);
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    res.status(200).json(post);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /posts/user/:userId - Get user posts
router.get('/user/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const posts = await postRepository.findByUserId(userId);
    res.status(200).json(posts);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /posts/batch - Get posts by IDs
router.post('/batch', async (req: Request, res: Response) => {
  try {
    const { ids } = req.body;
    
    if (!Array.isArray(ids)) {
      return res.status(400).json({ error: 'ids must be an array' });
    }

    const posts = await postRepository.findByIds(ids);
    res.status(200).json(posts);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /posts/recent/:limit - Get recent posts
router.get('/recent/:limit', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.params.limit);
    const posts = await postRepository.findRecent(limit);
    res.status(200).json(posts);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /posts/:postId/likes - Get post likes (proxied to interaction-service)
router.get('/:postId/likes', async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;
    // Likes are stored in interaction-service
    res.status(501).json({ error: 'Use interaction-service /interactions/likes/:postId' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /posts/:postId/comments - Get post comments (proxied to interaction-service)
router.get('/:postId/comments', async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;
    // Comments are stored in interaction-service
    res.status(501).json({ error: 'Use interaction-service /interactions/comments/:postId' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /posts/:id/view-count - Update view count (called by interaction service)
router.patch('/:id/view-count', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { count } = req.body;
    
    await prisma.post.update({
      where: { id },
      data: { viewCount: BigInt(count) }
    });
    
    res.status(200).json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /posts/:id/comment-count/increment - Increment comment count
router.patch('/:id/comment-count/increment', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    await prisma.post.update({
      where: { id },
      data: { commentCount: { increment: 1 } }
    });
    
    res.status(200).json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /posts/:id/like-count - Update like count (called by interaction service batch worker)
router.patch('/:id/like-count', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { count } = req.body;
    
    await prisma.post.update({
      where: { id },
      data: { likeCount: count }
    });
    
    res.status(200).json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
