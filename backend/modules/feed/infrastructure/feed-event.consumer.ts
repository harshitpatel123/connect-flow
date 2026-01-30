import { UserRepository } from "modules/auth/infrastructure/user.repository";
import { createConsumer } from "../../../internal/messaging/kafka.consumer";
import { BuildFeedUseCase } from "../application/build-feed.usecase";
import { logFeedData } from "../../../debug/feed-debugger";

export async function startFeedConsumer(
  buildFeedUseCase: BuildFeedUseCase,
  userRepository: UserRepository,
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
        console.log("\n" + "=".repeat(60));
        console.log("📥 [KAFKA CONSUMER] Received message from queue");
        
        if (!message.value) {
          console.log("⚠️  [KAFKA CONSUMER] Empty message, skipping...");
          return;
        }

        const event = JSON.parse(message.value.toString());
        console.log("📦 [KAFKA CONSUMER] Event data:", JSON.stringify(event, null, 2));

        if (event.type !== "PostCreated") {
          console.log("⚠️  [KAFKA CONSUMER] Not a PostCreated event, skipping...");
          return;
        }

        const users = await userRepository.findAllExcept(event.userId);
        console.log("✅ [FEED BUILD] Found", users.length, "users to receive this post");
        console.log("   User IDs:", users.map(u => u.id).join(", "));

        for (const user of users) {
          console.log(`   ➡️  Updating feed for user ${user.id}...`);
          await buildFeedUseCase.execute({
            targetUserId: user.id,
            postId: event.postId,
            createdAt: event.createdAt
          });
        }
        
        console.log("\n✅ [FEED BUILD] All feeds updated successfully");
        console.log("=".repeat(60) + "\n");

        // Debug: Log feed data after update
        await logFeedData();
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
