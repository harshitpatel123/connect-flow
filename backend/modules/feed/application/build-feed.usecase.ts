import { FeedStore } from "../../../internal/cache/feed.store";
import { SeenStore } from "../../../internal/cache/seen.store";
import { InterestRepository } from "../../interaction/infrastructure/interest.repository";

/**
 * BUILD FEED USE CASE - PUSH MODEL
 * Triggered when: A new post is created
 * 
 * Flow:
 * 1. Check if user has already seen the post (skip if yes)
 * 2. Calculate personalized score:
 *    - Get user's affinity for post categories
 *    - Score = (maxCategoryAffinity * 10) + (recency * 5)
 * 3. Add to user's Redis feed (sorted set)
 * 
 * This ensures users receive posts they're likely to be interested in
 */
export class BuildFeedUseCase {
  constructor(
    private feedStore: FeedStore,
    private seenStore: SeenStore,
    private interestRepository: InterestRepository
  ) {}

  async execute(input: {
    targetUserId: string;
    postId: string;
    createdAt: number;
    categories: string[];
  }) {
    const { targetUserId, postId, createdAt, categories } = input;

    console.log("      🔍 [PUSH MODEL - BUILD FEED] Checking if post already seen...");
    const alreadySeen = await this.seenStore.hasSeen(targetUserId, postId);

    if (alreadySeen) {
      console.log("      ⏭️  [PUSH MODEL - BUILD FEED] Post already seen, skipping...");
      return;
    }
    console.log("      ✅ [PUSH MODEL - BUILD FEED] Post not seen before");

    // Get user's max affinity for any of the post's categories
    console.log(`      📊 [PUSH MODEL - BUILD FEED] Calculating affinity for categories: [${categories.join(', ')}]`);
    let maxAffinity = 0;
    
    for (const category of categories) {
      const affinity = await this.interestRepository.getUserCategoryAffinity(targetUserId, category);
      maxAffinity = Math.max(maxAffinity, affinity);
    }
    
    console.log(`      📈 [PUSH MODEL - BUILD FEED] Max category affinity: ${maxAffinity}`);

    // Calculate personalized score using time-decay formula
    // 1. Convert timestamp to "hours ago"
    const now = Date.now() / 1000; // current time in seconds
    const ageInSeconds = now - (createdAt / 1000); // createdAt is in milliseconds
    const ageInHours = ageInSeconds / 3600;

    // 2. Affinity boost (user interest priority)
    const affinityBoost = maxAffinity * 20;

    // 3. Recency penalty (older posts lose points)
    const recencyPenalty = ageInHours * 5;

    // 4. Final score = affinity boost - age penalty
    const finalScore = affinityBoost - recencyPenalty;
    
    console.log(`      🎯 [PUSH MODEL - BUILD FEED] Score breakdown:`);
    console.log(`         - Affinity Boost: +${affinityBoost} (${maxAffinity} * 20)`);
    console.log(`         - Age Penalty: -${recencyPenalty.toFixed(2)} (${ageInHours.toFixed(1)}h old)`);
    console.log(`         - Final Score: ${finalScore.toFixed(2)}`);

    // Add to feed
    console.log("      💾 [PUSH MODEL - BUILD FEED] Adding to Redis feed...");
    await this.feedStore.addToFeed(targetUserId, postId, finalScore);
    console.log("      ✅ [PUSH MODEL - BUILD FEED] Successfully added to feed");
  }
}
