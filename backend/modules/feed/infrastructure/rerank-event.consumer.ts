import { createConsumer } from "../../../internal/messaging/kafka.consumer";
import { ReRankFeedUseCase } from "../application/rerank-feed.usecase";

/**
 * RE-RANK EVENT CONSUMER
 * Part of the RE-RANK MODEL
 * 
 * Listens to: user-interests-updated (NOT direct interaction events)
 * Purpose: Trigger feed re-ranking AFTER user interests are updated
 * 
 * Event Chaining Flow:
 * 1. User interacts (like/unlike/comment)
 * 2. Interest consumer updates affinity scores
 * 3. Interest consumer fires "user-interests-updated"
 * 4. THIS consumer re-ranks feed with NEW affinity scores
 * 
 * This ensures re-ranking always uses the latest interest data
 */
export async function startReRankConsumer(reRankFeedUseCase: ReRankFeedUseCase) {
  const consumer = createConsumer("rerank-group");

  try {
    await consumer.connect();
    console.log("✅ [RE-RANK CONSUMER] Connected successfully");

    await consumer.subscribe({
      topics: ["user-interests-updated"],
      fromBeginning: false
    });
    console.log("✅ [RE-RANK CONSUMER] Subscribed to user-interests-updated event\n");

    await consumer.run({
      eachMessage: async ({ topic, message }) => {
        if (!message.value) return;

        const event = JSON.parse(message.value.toString());
        const { userId } = event;

        console.log(`\n🔄 [RE-RANK CONSUMER] Received ${topic} for user ${userId.substring(0, 8)}...`);
        console.log("🔗 [RE-RANK CONSUMER] Interest scores updated, now re-ranking feed...");

        // Trigger re-ranking with updated interest scores
        await reRankFeedUseCase.execute(userId);
      }
    });
  } catch (error: any) {
    if (error.type === 'UNKNOWN_TOPIC_OR_PARTITION') {
      console.log("⚠️  [RE-RANK CONSUMER] Topic not created yet. Will be created on first interaction.\n");
    } else {
      console.error("❌ [RE-RANK CONSUMER] Error:", error);
    }
  }
}
