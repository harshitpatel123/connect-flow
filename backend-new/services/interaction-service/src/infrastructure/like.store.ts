import { redis } from './redis.client.js';

export class LikeStore {
  async hasLiked(userId: string, postId: string): Promise<boolean> {
    return !!(await redis.get(`like:${userId}:${postId}`));
  }

  async addLike(userId: string, postId: string) {
    await redis.set(`like:${userId}:${postId}`, '1');
    await redis.zincrby('post:like:count', 1, postId);
    await redis.lpush('like:batch:queue', `${userId}:${postId}`);
  }

  async removeLike(userId: string, postId: string) {
    await redis.del(`like:${userId}:${postId}`);
    await redis.zincrby('post:like:count', -1, postId);
    await redis.lpush('unlike:batch:queue', `${userId}:${postId}`);
  }

  async getLikeCount(postId: string): Promise<number> {
    const count = await redis.zscore('post:like:count', postId);
    return count ? parseInt(count) : 0;
  }
}

export const likeStore = new LikeStore();
