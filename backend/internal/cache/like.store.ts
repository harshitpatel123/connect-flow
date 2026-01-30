import { redis } from "./redis.client";

export class LikeStore {
  async hasLiked(userId: string, postId: string): Promise<boolean> {
    return !!(await redis.get(`like:${userId}:${postId}`));
  }

  async removeLike(userId: string, postId: string) {
    await redis.del(`like:${userId}:${postId}`);
  }

  async incrementLikeCount(postId: string): Promise<number> {
    const count = await redis.zincrby("post:like:count", 1, postId);
    return parseInt(count);
  }

  async decrementLikeCount(postId: string): Promise<number> {
    const count = await redis.zincrby("post:like:count", -1, postId);
    return parseInt(count);
  }

  async getLikeCount(postId: string): Promise<number> {
    const count = await redis.zscore("post:like:count", postId);
    return count ? parseInt(count) : 0;
  }

  async addToQueue(userId: string, postId: string) {
    await redis.lpush("like:batch:queue", `${userId}:${postId}`);
    await redis.set(`like:${userId}:${postId}`, "1");
  }

  async addUnlikeToQueue(userId: string, postId: string) {
    await redis.lpush("unlike:batch:queue", `${userId}:${postId}`);
  }

  async popBatch(size: number): Promise<string[]> {
    const items: string[] = [];
    for (let i = 0; i < size; i++) {
      const item = await redis.rpop("like:batch:queue");
      if (!item) break;
      items.push(item);
    }
    return items;
  }

  async popUnlikeBatch(size: number): Promise<string[]> {
    const items: string[] = [];
    for (let i = 0; i < size; i++) {
      const item = await redis.rpop("unlike:batch:queue");
      if (!item) break;
      items.push(item);
    }
    return items;
  }
}

export const likeStore = new LikeStore();
