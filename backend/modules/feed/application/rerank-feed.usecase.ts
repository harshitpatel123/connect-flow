import { FeedStore } from "../../../internal/cache/feed.store";
import { PostRepository } from "../../post/infrastructure/post.repository";
import { InterestRepository } from "../../interaction/infrastructure/interest.repository";

/**
 * RE-RANK FEED USE CASE - RE-RANK MODEL
 * Triggered when: User interacts with a post (like/unlike/comment)
 * 
 * Flow:
 * 1. Fetch current feed post IDs from Redis
 * 2. Get post details (categories)
 * 3. Recalculate scores based on UPDATED user interests
 * 4. Re-sort Redis feed with new scores
 * 
 * This ensures the feed adapts in real-time to user preferences
 */
export class ReRankFeedUseCase {
  constructor(
    private feedStore: FeedStore,
    private postRepository: PostRepository,
    private interestRepository: InterestRepository
  ) {}

  async execute(userId: string) {
    console.log("\n" + "=".repeat(80));
    console.log("🔄 [RE-RANK MODEL] Starting feed re-ranking...");
    console.log(`   User ID: ${userId}`);

    // Step 1: Get current feed
    console.log("\n📊 [RE-RANK MODEL] Step 1: Fetching current feed...");
    const currentFeedPostIds = await this.feedStore.getFeed(userId, 0, 49); // Top 50 posts
    
    if (currentFeedPostIds.length === 0) {
      console.log("⚠️  [RE-RANK MODEL] Feed is empty, nothing to re-rank");
      console.log("=".repeat(80) + "\n");
      return;
    }

    console.log(`✅ [RE-RANK MODEL] Found ${currentFeedPostIds.length} posts in feed`);

    // Step 2: Fetch post details
    console.log("\n📦 [RE-RANK MODEL] Step 2: Fetching post details...");
    const posts = await this.postRepository.findByIds(currentFeedPostIds);
    console.log(`✅ [RE-RANK MODEL] Fetched ${posts.length} post details`);

    // Step 3: Recalculate scores with updated interests
    console.log("\n🎯 [RE-RANK MODEL] Step 3: Recalculating scores...");
    const scoredPosts = [];

    for (const post of posts) {
      // Get user's max affinity for post categories
      let maxAffinity = 0;
      for (const category of post.categoryTags) {
        const affinity = await this.interestRepository.getUserCategoryAffinity(userId, category);
        maxAffinity = Math.max(maxAffinity, affinity);
      }

      // Calculate score using time-decay formula
      const now = Date.now() / 1000; // current time in seconds
      const postCreatedAt = new Date(post.createdAt).getTime() / 1000; // post time in seconds
      const ageInSeconds = now - postCreatedAt;
      const ageInHours = ageInSeconds / 3600;

      const affinityBoost = maxAffinity * 20;
      const recencyPenalty = ageInHours * 5;
      const finalScore = affinityBoost - recencyPenalty;

      console.log(`---> Post: ${post.id.substring(0, 8)}... | Age: ${ageInHours.toFixed(1)}h | Affinity Boost: +${affinityBoost} | Age Penalty: -${recencyPenalty.toFixed(2)} || Final Score: ${finalScore.toFixed(2)}`);

      scoredPosts.push({
        postId: post.id,
        score: finalScore,
        affinity: maxAffinity
      });
    }

    console.log(`✅ [RE-RANK MODEL] Recalculated scores for ${scoredPosts.length} posts`);
    
    // Log top 3 posts
    const topPosts = scoredPosts.sort((a, b) => b.score - a.score).slice(0, 3);
    console.log("   Top 3 posts after re-ranking:");
    topPosts.forEach((p, i) => {
      console.log(`      ${i + 1}. ${p.postId.substring(0, 8)}... (score: ${p.score}, affinity: ${p.affinity})`);
    });

    // Step 4: Update Redis feed with new scores
    console.log("\n💾 [RE-RANK MODEL] Step 4: Updating Redis feed...");
    for (const { postId, score } of scoredPosts) {
      await this.feedStore.addToFeed(userId, postId, score);
    }

    console.log(`✅ [RE-RANK MODEL] Feed re-ranking complete!`);
    console.log(`   Updated ${scoredPosts.length} posts with new scores`);
    console.log("=".repeat(80) + "\n");
  }
}
