import { createConsumer } from "../../../internal/messaging/kafka.consumer";
import { InterestRepository } from "../infrastructure/interest.repository";
import { PostRepository } from "../../post/infrastructure/post.repository";
import { InterestEventProducer } from "./interest.event.producer";

/**
 * INTEREST EVENT CONSUMER
 * Part of the PERSONALIZATION SYSTEM
 * 
 * Listens to: post-liked, post-unliked, post-commented
 * Purpose: Update user interest scores based on interactions
 * 
 * Scoring System:
 * - Like: +5 points
 * - Comment: +10 points
 * - Unlike: -5 points
 * 
 * Flow:
 * 1. Listen to interaction events
 * 2. Update user interest scores
 * 3. Fire "user-interests-updated" event (for re-ranking)
 * 
 * Note: View events are NOT tracked for personalization (only for analytics)
 */
export async function startInterestConsumer(
  interestRepository: InterestRepository,
  postRepository: PostRepository,
  interestEventProducer: InterestEventProducer
) {
  const consumer = createConsumer("interest-group");

  try {
    await consumer.connect();
    console.log("✅ [INTEREST CONSUMER] Connected successfully");

    await consumer.subscribe({
      topics: ["post-liked", "post-unliked", "post-commented"],
      fromBeginning: false
    });
    console.log("✅ [INTEREST CONSUMER] Subscribed to interaction events\n");

    await consumer.run({
      eachMessage: async ({ topic, message }) => {
        console.log("\n" + "=".repeat(70));
        console.log(`📥 [INTEREST CONSUMER] Received event from topic: ${topic}`);

        if (!message.value) {
          console.log("⚠️  [INTEREST CONSUMER] Empty message, skipping...");
          return;
        }

        const event = JSON.parse(message.value.toString());
        console.log("📦 [INTEREST CONSUMER] Event data:", JSON.stringify(event, null, 2));

        const { userId, postId } = event;

        // Fetch post to get category tags
        console.log("🔍 [INTEREST CONSUMER] Fetching post details...");
        const posts = await postRepository.findByIds([postId]);
        
        if (posts.length === 0) {
          console.log("⚠️  [INTEREST CONSUMER] Post not found, skipping...");
          return;
        }

        const post = posts[0];
        console.log(`✅ [INTEREST CONSUMER] Post found with ${post.categoryTags.length} categories: [${post.categoryTags.join(', ')}]`);

        // Determine score change based on event type
        let scoreChange = 0;
        let actionName = "";

        switch (topic) {
          case "post-liked":
            scoreChange = 5;
            actionName = "LIKE";
            break;
          case "post-unliked":
            scoreChange = -5;
            actionName = "UNLIKE";
            break;
          case "post-commented":
            scoreChange = 10;
            actionName = "COMMENT";
            break;
        }

        console.log(`🎯 [INTEREST CONSUMER] Processing ${actionName} (${scoreChange > 0 ? '+' : ''}${scoreChange} points per category)`);

        // Update interest for each category in the post
        for (const category of post.categoryTags) {
          await interestRepository.upsertInterest(userId, category, scoreChange);
        }

        console.log(`✅ [INTEREST CONSUMER] Updated interests for ${post.categoryTags.length} categories`);
        
        // Fire event to trigger re-ranking (EVENT CHAINING)
        console.log("🔗 [INTEREST CONSUMER] Triggering re-rank via event chain...");
        await interestEventProducer.userInterestsUpdated({ userId, postId });
        
        console.log("=".repeat(70) + "\n");
      }
    });
  } catch (error: any) {
    if (error.type === 'UNKNOWN_TOPIC_OR_PARTITION') {
      console.log("⚠️  [INTEREST CONSUMER] Topics not created yet. Will be created on first interaction.\n");
    } else {
      console.error("❌ [INTEREST CONSUMER] Error:", error);
    }
  }
}
