import { redis } from './redis.client.js';

export class FeedStore {
  async addToFeed(userId: string, postId: string, score: number): Promise<void> {
    await redis.zadd(`feed:${userId}`, score, postId);
  }

  async getFeed(userId: string, start = 0, end = 19): Promise<string[]> {
    return redis.zrevrange(`feed:${userId}`, start, end);
  }

  async clearFeed(userId: string): Promise<void> {
    await redis.del(`feed:${userId}`);
  }

  async removeSeen(userId: string, postId: string): Promise<void> {
    await redis.srem(`seen:${userId}`, postId);
  }

  async hasSeen(userId: string, postId: string): Promise<boolean> {
    return (await redis.sismember(`seen:${userId}`, postId)) === 1;
  }
}

export const feedStore = new FeedStore();
