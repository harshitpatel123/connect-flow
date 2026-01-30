import { SeenStore } from "internal/cache/seen.store";
import { InteractionEventProducer } from "../events/interaction.event.producer";

export class ViewPostUseCase {
  constructor(
    private seenStore: SeenStore,
    private eventProducer: InteractionEventProducer
  ) {}

  async execute(userId: string, postId: string): Promise<boolean> {
    console.log("\n👁️  [VIEW POST] Starting view process...");
    console.log("   User ID:", userId);
    console.log("   Post ID:", postId);

    const alreadySeen = await this.seenStore.hasSeen(userId, postId);
    
    await this.seenStore.markSeen(userId, postId);
    console.log("✅ [VIEW POST] View stored in Redis");

    if (!alreadySeen) {
      await this.seenStore.incrementViewCount(postId);
      await this.seenStore.addToQueue(postId);
      console.log("✅ [VIEW POST] View count incremented");

      await this.eventProducer.postViewed({ userId, postId });
      console.log("✅ [VIEW POST] Event published to Kafka");
      return true;
    }

    console.log("⚠️  [VIEW POST] Post already viewed by user");
    return false;
  }
}
