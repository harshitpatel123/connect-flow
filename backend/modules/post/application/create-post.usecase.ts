import { CreatePostInput } from "../domain/post.types";
import { PostEventPublisher } from "../infrastructure/post-event.publisher";
import { PostRepository } from "../infrastructure/post.repository";

export class CreatePostUseCase {
  constructor(
    private postRepository : PostRepository,
    private postEventPublisher: PostEventPublisher
  ) {}

  async execute(input: CreatePostInput) {
    console.log("\n📝 [CREATE POST] Starting post creation...");
    console.log("   User ID:", input.userId);
    console.log("   Content:", input.content.substring(0, 50) + (input.content.length > 50 ? "..." : ""));

    // 1. Persist post (sync)
    const post = await this.postRepository.create(
      input.userId,
      input.content
    );
    console.log("✅ [CREATE POST] Post saved to database");
    console.log("   Post ID:", post.id);
    console.log("   Created At:", new Date(post.createdAt).toISOString());

    // 2. Emit event (async, non-blocking)
    try {
      await this.postEventPublisher.publishPostCreated({
        postId: post.id,
        userId: post.userId,
        createdAt: post.createdAt.getTime()
      });
      console.log("✅ [KAFKA PUBLISH] Event published successfully");
    } catch (err) {
      // graceful degradation
      console.error("❌ [KAFKA PUBLISH] PostCreated event failed", err);
    }

    // 3. Return post
    return post;
  }
}
