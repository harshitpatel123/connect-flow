import { redis } from './redis.client.js';
import { prisma } from './prisma.client.js';
import { seenStore } from './seen.store.js';

const BATCH_SIZE = 100;
const INTERVAL_MS = 1000;

export class BatchWorker {
  private isRunning = false;

  start() {
    if (this.isRunning) return;
    this.isRunning = true;

    console.log('✅ Batch worker started');
    setInterval(() => this.processLikes(), INTERVAL_MS);
    setInterval(() => this.processUnlikes(), INTERVAL_MS);
    setInterval(() => this.processViews(), INTERVAL_MS);
  }

  private async processLikes() {
    try {
      const items: string[] = [];
      for (let i = 0; i < BATCH_SIZE; i++) {
        const item = await redis.rpop('like:batch:queue');
        if (!item) break;
        items.push(item);
      }

      if (items.length === 0) return;

      const likes = items.map(item => {
        const [userId, postId] = item.split(':');
        return { userId, postId };
      });

      const uniqueLikes = Array.from(
        new Map(likes.map(like => [`${like.userId}:${like.postId}`, like])).values()
      );

      for (const like of uniqueLikes) {
        try {
          await prisma.postLike.create({ data: like });
        } catch (error: any) {
          if (error.code !== 'P2002') console.error('Error inserting like:', error);
        }
      }

      const postIds = [...new Set(uniqueLikes.map(l => l.postId))];
      for (const postId of postIds) {
        const count = await redis.zscore('post:like:count', postId);
        await prisma.post.update({
          where: { id: postId },
          data: { likeCount: count ? parseInt(count) : 0 }
        });
      }
    } catch (error) {
      console.error('Batch worker error (likes):', error);
    }
  }

  private async processUnlikes() {
    try {
      const items: string[] = [];
      for (let i = 0; i < BATCH_SIZE; i++) {
        const item = await redis.rpop('unlike:batch:queue');
        if (!item) break;
        items.push(item);
      }

      if (items.length === 0) return;

      const unlikes = items.map(item => {
        const [userId, postId] = item.split(':');
        return { userId, postId };
      });

      const uniqueUnlikes = Array.from(
        new Map(unlikes.map(unlike => [`${unlike.userId}:${unlike.postId}`, unlike])).values()
      );

      for (const unlike of uniqueUnlikes) {
        try {
          await prisma.postLike.delete({
            where: { userId_postId: unlike }
          });
        } catch (error: any) {
          if (error.code !== 'P2025') console.error('Error deleting like:', error);
        }
      }

      const postIds = [...new Set(uniqueUnlikes.map(l => l.postId))];
      for (const postId of postIds) {
        const count = await redis.zscore('post:like:count', postId);
        await prisma.post.update({
          where: { id: postId },
          data: { likeCount: count ? parseInt(count) : 0 }
        });
      }
    } catch (error) {
      console.error('Batch worker error (unlikes):', error);
    }
  }

  private async processViews() {
    try {
      const batch = await seenStore.popBatch(BATCH_SIZE);
      if (batch.length === 0) return;

      const postIds = [...new Set(batch)];
      for (const postId of postIds) {
        const count = await seenStore.getViewCount(postId);
        await prisma.post.update({
          where: { id: postId },
          data: { viewCount: BigInt(count) }
        });
      }
    } catch (error) {
      console.error('Batch worker error (views):', error);
    }
  }
}

export const batchWorker = new BatchWorker();
