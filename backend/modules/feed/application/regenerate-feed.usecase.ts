import { FeedStore } from "../../../internal/cache/feed.store";
import { SeenStore } from "../../../internal/cache/seen.store";
import { PostRepository } from "../../post/infrastructure/post.repository";
import { InterestRepository } from "../../interaction/infrastructure/interest.repository";

/**
 * REGENERATE FEED USE CASE - PULL MODEL
 * Triggered when: User clicks "Regenerate Feed" button
 * 
 * Strategy:
 * 1. Fetch 15 personalized posts from user's Redis feed (based on interests)
 * 2. Inject 5 trending posts (high like/comment count, not in user's interests)
 * 3. Apply seen penalty: Reduce score by 50% for seen-but-not-interacted posts
 * 4. Ensure minimum 10 posts (add recent posts if needed)
 * 
 * This balances personalization with discovery
 */
export class RegenerateFeedUseCase {
  constructor(
    private feedStore: FeedStore,
    private seenStore: SeenStore,
    private postRepository: PostRepository,
    private interestRepository: InterestRepository
  ) {}

  async execute(userId: string) {
    console.log("\n" + "=".repeat(80));
    console.log("🔄 [PULL MODEL - REGENERATE FEED] Starting feed regeneration...");
    console.log(`   User ID: ${userId}`);

    // Step 1: Fetch 15 personalized posts from Redis feed
    console.log("\n📊 [PULL MODEL] Step 1: Fetching personalized posts...");
    const personalizedPostIds = await this.feedStore.getFeed(userId, 0, 14); // 15 posts
    console.log(`✅ [PULL MODEL] Found ${personalizedPostIds.length} personalized posts`);

    // Step 2: Fetch 5 trending posts (not in user's interests and not already in feed)
    console.log("\n🔥 [PULL MODEL] Step 2: Fetching trending posts...");
    const trendingPosts = await this.getTrendingPosts(userId, personalizedPostIds, 5);
    console.log(`✅ [PULL MODEL] Found ${trendingPosts.length} trending posts`);

    // Combine posts (remove duplicates)
    const allPostIds = [...new Set([...personalizedPostIds, ...trendingPosts.map(p => p.id)])];
    console.log(`\n📦 [PULL MODEL] Combined feed: ${allPostIds.length} unique posts (${personalizedPostIds.length} personalized + ${trendingPosts.length} trending)`);

    // Step 3: Ensure minimum 10 posts
    if (allPostIds.length < 10) {
      console.log(`\n⚠️  [PULL MODEL] Feed has only ${allPostIds.length} posts, adding more...`);
      const additionalPosts = await this.getAdditionalPosts(userId, allPostIds, 10 - allPostIds.length);
      allPostIds.push(...additionalPosts.map(p => p.id));
      console.log(`✅ [PULL MODEL] Added ${additionalPosts.length} additional posts. Total: ${allPostIds.length}`);
    }

    // Step 4: Clear old feed and save new feed to Redis
    console.log("\n💾 [PULL MODEL] Step 4: Updating Redis feed...");
    await this.feedStore.clearFeed(userId);
    console.log(`   ✅ Cleared old feed`);
    
    // Add new posts to Redis with scores based on their position
    for (let i = 0; i < allPostIds.length; i++) {
      const score = 1000000 - i; // Higher score for earlier positions
      await this.feedStore.addToFeed(userId, allPostIds[i], score);
    }
    console.log(`   ✅ Saved ${allPostIds.length} posts to Redis feed`);

    console.log(`\n✅ [PULL MODEL - REGENERATE FEED] Feed regeneration complete!`);
    console.log(`   Final feed size: ${allPostIds.length} posts`);
    console.log("=".repeat(80) + "\n");

    return allPostIds;
  }

  /**
   * Get trending posts (high engagement, not in user's interest categories, not already in feed)
   */
  private async getTrendingPosts(userId: string, existingPostIds: string[], limit: number) {
    console.log(`   🔍 [PULL MODEL - TRENDING] Fetching top ${limit} trending posts...`);
    
    // Get user's interest categories to exclude
    const userInterests = await this.interestRepository.getUserInterests(userId);
    const interestedCategories = userInterests.map(i => i.category);
    console.log(`   📋 [PULL MODEL - TRENDING] User interested in: [${interestedCategories.join(', ')}]`);

    // Fetch recent posts (last 100) and sort by engagement
    const recentPosts = await this.postRepository.findRecent(100);
    console.log(`   📊 [PULL MODEL - TRENDING] Analyzing ${recentPosts.length} recent posts...`);

    // Filter out posts from user's interest categories, already in feed, and calculate engagement score
    const trendingCandidates = recentPosts
      .filter(post => {
        // Exclude if already in personalized feed
        if (existingPostIds.includes(post.id)) {
          return false;
        }
        // Exclude if post has any category user is interested in
        const hasInterestedCategory = post.categoryTags.some(cat => 
          interestedCategories.includes(cat)
        );
        return !hasInterestedCategory;
      })
      .map(post => ({
        ...post,
        engagementScore: (post.likeCount * 2) + (post.commentCount * 3) // Comments weighted higher
      }))
      .sort((a, b) => b.engagementScore - a.engagementScore)
      .slice(0, limit);

    console.log(`   ✅ [PULL MODEL - TRENDING] Selected ${trendingCandidates.length} trending posts (excluded ${existingPostIds.length} already in feed)`);
    if (trendingCandidates.length > 0) {
      console.log(`      Top trending: ${trendingCandidates[0].id.substring(0, 8)}... (${trendingCandidates[0].likeCount} likes, ${trendingCandidates[0].commentCount} comments)`);
    }

    return trendingCandidates;
  }

  /**
   * Get additional posts to meet minimum feed size
   */
  private async getAdditionalPosts(userId: string, existingPostIds: string[], needed: number) {
    console.log(`   🔍 [PULL MODEL - ADDITIONAL] Need ${needed} more posts...`);
    
    const recentPosts = await this.postRepository.findRecent(50);
    
    // Filter out posts already in feed
    const additionalPosts = recentPosts
      .filter(post => !existingPostIds.includes(post.id))
      .slice(0, needed);

    console.log(`   ✅ [PULL MODEL - ADDITIONAL] Found ${additionalPosts.length} additional posts`);
    return additionalPosts;
  }
}
