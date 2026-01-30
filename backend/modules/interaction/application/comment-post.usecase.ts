import { InteractionRepository } from "../infrastructure/interaction.repository";

export class CommentPostUseCase {
  constructor(
    private repository: InteractionRepository
  ) {}

  async execute(userId: string, postId: string, content: string) {
    console.log("\n💬 [COMMENT POST] Starting comment process...");
    console.log("   User ID:", userId);
    console.log("   Post ID:", postId);
    console.log("   Content:", content.substring(0, 50) + (content.length > 50 ? "..." : ""));

    await this.repository.addComment(userId, postId, content);
    console.log("✅ [COMMENT POST] Comment saved to database");
  }
}
