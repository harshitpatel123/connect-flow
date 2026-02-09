import { InteractionRepository } from "../infrastructure/interaction.repository";
import { InteractionEventProducer } from "../events/interaction.event.producer";

export class CommentPostUseCase {
  constructor(
    private repository: InteractionRepository,
    private eventProducer: InteractionEventProducer
  ) {}

  async execute(userId: string, postId: string, content: string) {
    console.log("\n💬 [COMMENT POST] Starting comment process...");
    console.log("   User ID:", userId);
    console.log("   Post ID:", postId);
    console.log("   Content:", content.substring(0, 50) + (content.length > 50 ? "..." : ""));

    await this.repository.addComment(userId, postId, content);
    console.log("✅ [COMMENT POST] Comment saved to database");

    // Fire comment event for personalization
    await this.eventProducer.postCommented({ userId, postId });
    console.log("✅ [COMMENT POST] Event published to Kafka");
  }
}
