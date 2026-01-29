import { FeedStore } from "../../../internal/cache/feed.store";
import { SeenStore } from "../../../internal/cache/seen.store";

export class BuildFeedUseCase {
  constructor(
    private feedStore: FeedStore,
    private seenStore: SeenStore
  ) {}

  async execute(input: {
    targetUserId: string;
    postId: string;
    createdAt: number;
  }) {
    const { targetUserId, postId, createdAt } = input;

    console.log("      🔍 [BUILD FEED] Checking if post already seen...");
    // 1. Skip if already seen
    const alreadySeen = await this.seenStore.hasSeen(
      targetUserId,
      postId
    );

    if (alreadySeen) {
      console.log("      ⏭️  [BUILD FEED] Post already seen, skipping...");
      return;
    }
    console.log("      ✅ [BUILD FEED] Post not seen before");

    // 2. Compute score (v1 = recency only)
    const score = createdAt;
    console.log("      📊 [BUILD FEED] Computed score:", score);

    // 3. Add to feed
    console.log("      💾 [BUILD FEED] Adding to Redis feed...");
    await this.feedStore.addToFeed(
      targetUserId,
      postId,
      score
    );
    console.log("      ✅ [BUILD FEED] Successfully added to feed");
  }
}
