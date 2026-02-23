import { redis } from './redis.client.js';

export class SeenStore {
  private seenKey(userId: string) {
    return `seen:${userId}`;
  }

  async hasSeen(userId: string, postId: string): Promise<boolean> {
    const exists = await redis.sismember(this.seenKey(userId), postId);
    return exists === 1;
  }

  async markSeen(userId: string, postId: string) {
    await redis.sadd(this.seenKey(userId), postId);
  }

  async incrementViewCount(postId: string): Promise<number> {
    const count = await redis.zincrby('post:view:count', 1, postId);
    return parseInt(count);
  }

  async getViewCount(postId: string): Promise<number> {
    const count = await redis.zscore('post:view:count', postId);
    return count ? parseInt(count) : 0;
  }

  async addToQueue(postId: string) {
    await redis.lpush('view:batch:queue', postId);
  }

  async popBatch(size: number): Promise<string[]> {
    const items: string[] = [];
    for (let i = 0; i < size; i++) {
      const item = await redis.rpop('view:batch:queue');
      if (!item) break;
      items.push(item);
    }
    return items;
  }
}

export const seenStore = new SeenStore();
