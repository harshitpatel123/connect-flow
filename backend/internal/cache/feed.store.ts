import { redis } from "./redis.client";

export class FeedStore {
  private feedKey(userId: string) {
    return `feed:${userId}`;
  }

  async addToFeed(userId: string, postId: string, score: number) {
    console.log("         💾 [REDIS] ZADD feed:", userId, "score:", score, "postId:", postId);
    await redis.zadd(this.feedKey(userId), score.toString(), postId);
  }

  async getFeed(userId: string, start = 0, end = 19) {
    console.log("   💾 [REDIS] ZREVRANGE feed:", userId, "range:", start, "-", end);
    return redis.zrevrange(this.feedKey(userId), start, end);
  }

  async clearFeed(userId: string) {
    console.log("   💾 [REDIS] DEL feed:", userId);
    await redis.del(this.feedKey(userId));
  }
}

export const feedStore = new FeedStore();
