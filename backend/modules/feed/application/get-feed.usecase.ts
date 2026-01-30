import { FeedStore } from "../../../internal/cache/feed.store";
import { SeenStore } from "../../../internal/cache/seen.store";

export class GetFeedUseCase {
  constructor(
    private feedStore: FeedStore,
    private seenStore: SeenStore
  ) {}

  async execute(userId: string) {
    console.log("\n📰 [GET FEED] Fetching feed for user:", userId);
    
    const postIds = await this.feedStore.getFeed(userId);
    console.log("✅ [GET FEED] Retrieved", postIds.length, "posts from feed");
    console.log("   Post IDs:", postIds.join(", "));

    return postIds.map((postId) => ({ postId }));
  }
}
