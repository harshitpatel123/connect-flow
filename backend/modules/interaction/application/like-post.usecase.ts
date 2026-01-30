import { LikeStore } from "internal/cache/like.store";
import { InteractionEventProducer } from "../events/interaction.event.producer";

export class LikePostUseCase {
  constructor(
    private likeStore: LikeStore,
    private eventProducer: InteractionEventProducer
  ) {}

  async execute(userId: string, postId: string): Promise<boolean> {
    console.log("\n👍 [LIKE POST] Starting like process...");
    console.log("   User ID:", userId);
    console.log("   Post ID:", postId);

    const alreadyLiked = await this.likeStore.hasLiked(userId, postId);
    if (alreadyLiked) {
      console.log("⚠️  [LIKE POST] User already liked this post");
      return false;
    }

    await this.likeStore.addToQueue(userId, postId);
    await this.likeStore.incrementLikeCount(postId);
    console.log("✅ [LIKE POST] Like stored in Redis");

    await this.eventProducer.postLiked({ userId, postId });
    console.log("✅ [LIKE POST] Event published to Kafka");
    return true;
  }
}
