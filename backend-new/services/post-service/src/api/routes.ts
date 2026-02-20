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

export default router;
