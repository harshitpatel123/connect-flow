import { LikeStore } from "internal/cache/like.store";
import { InteractionEventProducer } from "../events/interaction.event.producer";

export class UnlikePostUseCase {
  constructor(
    private likeStore: LikeStore,
    private eventProducer: InteractionEventProducer
  ) {}

  async execute(userId: string, postId: string): Promise<boolean> {
    console.log("\n👎 [UNLIKE POST] Starting unlike process...");
    console.log("   User ID:", userId);
    console.log("   Post ID:", postId);

    const alreadyLiked = await this.likeStore.hasLiked(userId, postId);
    if (!alreadyLiked) {
      console.log("⚠️  [UNLIKE POST] User hasn't liked this post");
      return false;
    }

    await this.likeStore.removeLike(userId, postId);
    await this.likeStore.decrementLikeCount(postId);
    await this.likeStore.addUnlikeToQueue(userId, postId);
    console.log("✅ [UNLIKE POST] Like removed from Redis and queued for DB removal");

    await this.eventProducer.postUnliked({ userId, postId });
    console.log("✅ [UNLIKE POST] Event published to Kafka");
    return true;
  }
}
