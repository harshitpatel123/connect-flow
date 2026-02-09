import { UserRepository } from "modules/auth/infrastructure/user.repository";
import { createConsumer } from "../../../internal/messaging/kafka.consumer";
import { BuildFeedUseCase } from "../application/build-feed.usecase";
import { InterestRepository } from "../../interaction/infrastructure/interest.repository";
import { PostRepository } from "../../post/infrastructure/post.repository";
// import { logFeedData } from "../../../debug/feed-debugger";

/**
 * FEED EVENT CONSUMER - PUSH MODEL
 * Triggered when: A new post is created
 * 
 * Strategy:
 * 1. Fetch users with affinity score >= 10 for ANY of the post's categories
 * 2. Build personalized feed for each qualified user
 * 3. Score = (userCategoryAffinity * 10) + (recency * 5)
 * 
 * This ensures posts reach users who have shown interest in similar content
 */
export async function startFeedConsumer(
  buildFeedUseCase: BuildFeedUseCase,
  userRepository: UserRepository,
  interestRepository: InterestRepository,
  postRepository: PostRepository
) {
  const consumer = createConsumer("feed-group");

  try {
    await consumer.connect();
    console.log("✅ [KAFKA CONSUMER] Connected successfully");
    
    await consumer.subscribe({
      topic: "post-created",
      fromBeginning: false
    });
    console.log("✅ [KAFKA CONSUMER] Subscribed and listening for events...\n");

    await consumer.run({
      eachMessage: async ({ message }) => {
        console.log("\n" + "=".repeat(80));
        console.log("📥 [PUSH MODEL - FEED CONSUMER] Received post-created event");
        
        if (!message.value) {
          console.log("⚠️  [PUSH MODEL - FEED CONSUMER] Empty message, skipping...");
          return;
        }

        const event = JSON.parse(message.value.toString());
        console.log("📦 [PUSH MODEL - FEED CONSUMER] Event data:", JSON.stringify(event, null, 2));

        if (event.type !== "PostCreated") {
          console.log("⚠️  [PUSH MODEL - FEED CONSUMER] Not a PostCreated event, skipping...");
          return;
        }

        // Fetch post to get categories
        console.log("🔍 [PUSH MODEL - FEED CONSUMER] Fetching post details...");
        const posts = await postRepository.findByIds([event.postId]);
        
        if (posts.length === 0) {
          console.log("⚠️  [PUSH MODEL - FEED CONSUMER] Post not found, skipping...");
          return;
        }

        const post = posts[0];
        console.log(`✅ [PUSH MODEL - FEED CONSUMER] Post found with categories: [${post.categoryTags.join(', ')}]`);

        // Get users with affinity >= 10 for any of the post's categories
        const MIN_AFFINITY_SCORE = 0;
        console.log(`\n🎯 [PUSH MODEL - FEED CONSUMER] Finding users with affinity >= ${MIN_AFFINITY_SCORE}...`);
        
        const qualifiedUsers = await interestRepository.getUsersWithMinScoreForCategories(
          post.categoryTags,
          MIN_AFFINITY_SCORE
        );

        console.log(`✅ [PUSH MODEL - FEED CONSUMER] Found ${qualifiedUsers.length} qualified users`);
        if (qualifiedUsers.length > 0) {
          console.log(`   Top users: ${qualifiedUsers.slice(0, 5).map(u => `${u.userId.substring(0, 8)}... (score: ${u.maxAffinity})`).join(', ')}`);
        }

        // Build feed for each qualified user
        console.log(`\n🔨 [PUSH MODEL - FEED CONSUMER] Building feeds for ${qualifiedUsers.length} users...`);
        for (const user of qualifiedUsers) {
          console.log(`   ➡️  Updating feed for user ${user.userId.substring(0, 8)}... (affinity: ${user.maxAffinity})`);
          await buildFeedUseCase.execute({
            targetUserId: user.userId,
            postId: event.postId,
            createdAt: event.createdAt,
            categories: post.categoryTags
          });
        }
        
        console.log(`\n✅ [PUSH MODEL - FEED CONSUMER] Successfully updated ${qualifiedUsers.length} feeds`);
        console.log("=".repeat(80) + "\n");

        // Debug: Log feed data after update
        // await logFeedData();
      }
    });
  } catch (error: any) {
    if (error.type === 'UNKNOWN_TOPIC_OR_PARTITION') {
      console.log("⚠️  [KAFKA CONSUMER] Topic 'post-created' does not exist yet. It will be created on first post.\n");
    } else {
      console.error("❌ [KAFKA CONSUMER] Error:", error);
    }
  }
}
