import { redis } from './redis.client.js';
import { prisma } from './prisma.client.js';

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

      for (const like of likes) {
        try {
          await prisma.postLike.create({ data: like });
        } catch (error: any) {
          if (error.code !== 'P2002') console.error('Error inserting like:', error);
        }
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

      for (const unlike of unlikes) {
        try {
          await prisma.postLike.delete({
            where: { userId_postId: unlike }
          });
        } catch (error: any) {
          if (error.code !== 'P2025') console.error('Error deleting like:', error);
        }
      }
    } catch (error) {
      console.error('Batch worker error (unlikes):', error);
    }
  }
}

export const batchWorker = new BatchWorker();
