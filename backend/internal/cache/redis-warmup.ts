import { prisma } from "../../internal/database/prisma.client";
import { redis } from "../../internal/cache/redis.client";

export async function warmUpRedisCounters() {
  console.log("\n🔥 [REDIS WARM-UP] Loading counters from database...");

  try {
    // Warm up post counts
    const posts = await prisma.post.findMany({
      select: { id: true, likeCount: true, viewCount: true }
    });

    const pipeline = redis.pipeline();

    for (const post of posts) {
      if (post.likeCount > 0) {
        pipeline.zadd("post:like:count", post.likeCount, post.id);
      }
      if (post.viewCount > 0) {
        pipeline.zadd("post:view:count", Number(post.viewCount), post.id);
      }
    }

    await pipeline.exec();
    console.log(`✅ [REDIS WARM-UP] Loaded counters for ${posts.length} posts`);

    // Warm up like status
    const likes = await prisma.postLike.findMany({
      select: { userId: true, postId: true }
    });

    const likePipeline = redis.pipeline();
    for (const like of likes) {
      likePipeline.set(`like:${like.userId}:${like.postId}`, "1");
    }

    await likePipeline.exec();
    console.log(`✅ [REDIS WARM-UP] Loaded ${likes.length} like statuses`);
  } catch (error) {
    console.error("❌ [REDIS WARM-UP] Failed:", error);
  }
}
