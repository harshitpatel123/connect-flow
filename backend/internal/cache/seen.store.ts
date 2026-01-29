import { redis } from "./redis.client";

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
}
