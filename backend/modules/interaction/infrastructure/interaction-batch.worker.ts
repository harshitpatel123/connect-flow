import { likeStore } from "internal/cache/like.store";
import { seenStore } from "internal/cache/seen.store";
import { prisma } from "internal/database/prisma.client";

const BATCH_SIZE = 100;
const INTERVAL_MS = 10000; // 10 seconds

export class InteractionBatchWorker {
  private isRunning = false;

  async start() {
    if (this.isRunning) return;
    this.isRunning = true;

    console.log("🔄 [BATCH WORKER] Starting interaction batch worker...");
    console.log(`   Batch size: ${BATCH_SIZE}`);
    console.log(`   Interval: ${INTERVAL_MS}ms`);

    setInterval(() => this.processLikes(), INTERVAL_MS);
    setInterval(() => this.processUnlikes(), INTERVAL_MS);
    setInterval(() => this.processViews(), INTERVAL_MS);
  }

  private async processLikes() {
    try {
      const batch = await likeStore.popBatch(BATCH_SIZE);
      if (batch.length === 0) return;

      console.log(`\n👍 [BATCH WORKER] Processing ${batch.length} likes...`);

      const likesToInsert = batch.map(item => {
        const [userId, postId] = item.split(":");
        return { userId, postId };
      });

      // Deduplicate
      const uniqueLikes = Array.from(
        new Map(likesToInsert.map(like => [`${like.userId}:${like.postId}`, like])).values()
      );

      // Bulk insert (ignore duplicates)
      for (const like of uniqueLikes) {
        try {
          await prisma.postLike.create({
            data: {
              userId: like.userId,
              postId: like.postId,
            },
          });
        } catch (error: any) {
          if (error.code !== "P2002") {
            console.error("Error inserting like:", error);
          }
        }
      }

      // Update post like counts from Redis
      const postIds = [...new Set(uniqueLikes.map(l => l.postId))];
      for (const postId of postIds) {
        const count = await likeStore.getLikeCount(postId);
        await prisma.post.update({
          where: { id: postId },
          data: { likeCount: count },
        });
      }

      console.log(`✅ [BATCH WORKER] Processed ${uniqueLikes.length} unique likes`);
    } catch (error) {
      console.error("❌ [BATCH WORKER] Error processing likes:", error);
    }
  }

  private async processUnlikes() {
    try {
      const batch = await likeStore.popUnlikeBatch(BATCH_SIZE);
      if (batch.length === 0) return;

      console.log(`\n👎 [BATCH WORKER] Processing ${batch.length} unlikes...`);

      const unlikesToDelete = batch.map(item => {
        const [userId, postId] = item.split(":");
        return { userId, postId };
      });

      // Deduplicate
      const uniqueUnlikes = Array.from(
        new Map(unlikesToDelete.map(unlike => [`${unlike.userId}:${unlike.postId}`, unlike])).values()
      );

      // Bulk delete
      for (const unlike of uniqueUnlikes) {
        try {
          await prisma.postLike.delete({
            where: {
              userId_postId: {
                userId: unlike.userId,
                postId: unlike.postId,
              },
            },
          });
        } catch (error: any) {
          if (error.code !== "P2025") {
            console.error("Error deleting like:", error);
          }
        }
      }

      // Update post like counts from Redis
      const postIds = [...new Set(uniqueUnlikes.map(l => l.postId))];
      for (const postId of postIds) {
        const count = await likeStore.getLikeCount(postId);
        await prisma.post.update({
          where: { id: postId },
          data: { likeCount: count },
        });
      }

      console.log(`✅ [BATCH WORKER] Processed ${uniqueUnlikes.length} unique unlikes`);
    } catch (error) {
      console.error("❌ [BATCH WORKER] Error processing unlikes:", error);
    }
  }

  private async processViews() {
    try {
      const batch = await seenStore.popBatch(BATCH_SIZE);
      if (batch.length === 0) return;

      console.log(`\n👁️  [BATCH WORKER] Processing ${batch.length} views...`);

      // Update post view counts from Redis
      const postIds = [...new Set(batch)];
      for (const postId of postIds) {
        const count = await seenStore.getViewCount(postId);
        await prisma.post.update({
          where: { id: postId },
          data: { viewCount: BigInt(count) },
        });
      }

      console.log(`✅ [BATCH WORKER] Updated view counts for ${postIds.length} posts`);
    } catch (error) {
      console.error("❌ [BATCH WORKER] Error processing views:", error);
    }
  }

  stop() {
    this.isRunning = false;
    console.log("🛑 [BATCH WORKER] Stopped");
  }
}

export const interactionBatchWorker = new InteractionBatchWorker();
