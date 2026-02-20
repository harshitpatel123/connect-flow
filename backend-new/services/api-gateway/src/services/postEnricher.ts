import { redis } from '../config/redis';
import { authClient } from './authClient';

interface Post {
  id: string;
  userId: string;
  content: string;
  categoryTags: string[];
  likeCount: number;
  commentCount: number;
  viewCount: number;
  createdAt: string;
}

export interface EnrichedPost extends Post {
  isLiked: boolean;
  user?: {
    id: string;
    email: string;
  };
}

export async function enrichPosts(posts: Post[], currentUserId?: string): Promise<EnrichedPost[]> {
  if (posts.length === 0) return [];

  const userIds = [...new Set(posts.map(p => p.userId))];
  
  const users = await authClient.getUsersByIds(userIds);
  const userMap = new Map(users.map((u: any) => [u.id, u]));

  const enrichedPosts = await Promise.all(
    posts.map(async (post) => {
      const [likeCount, viewCount, isLiked] = await Promise.all([
        getRedisCount('post:like:count', post.id, post.likeCount),
        getRedisCount('post:view:count', post.id, post.viewCount),
        currentUserId ? checkIsLiked(currentUserId, post.id) : Promise.resolve(false)
      ]);

      return {
        ...post,
        likeCount,
        viewCount: Number(viewCount),
        isLiked,
        user: userMap.get(post.userId)
      } as EnrichedPost;
    })
  );

  return enrichedPosts;
}

async function getRedisCount(key: string, postId: string, fallback: number): Promise<number> {
  try {
    const count = await redis.zscore(key, postId);
    return count ? parseInt(count) : fallback;
  } catch (error) {
    console.error(`Redis error for ${key}:`, error);
    return fallback;
  }
}

async function checkIsLiked(userId: string, postId: string): Promise<boolean> {
  try {
    const exists = await redis.sismember(`likes:user:${userId}`, postId);
    return exists === 1;
  } catch (error) {
    console.error('Redis error checking isLiked:', error);
    return false;
  }
}
