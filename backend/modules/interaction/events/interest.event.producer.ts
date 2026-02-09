import { producer } from "../../../internal/messaging/kafka.producer";

/**
 * INTEREST EVENT PRODUCER
 * Fires events after user interests are updated
 * 
 * This enables proper event chaining:
 * 1. User interacts with post
 * 2. Interest scores updated
 * 3. Fire "user-interests-updated" event
 * 4. Re-rank consumer listens and re-ranks feed
 */
export class InterestEventProducer {
  async userInterestsUpdated(payload: { userId: string; postId: string }) {
    console.log("\n📦 [INTEREST EVENT] Preparing user-interests-updated event:");
    console.log("   Topic: user-interests-updated");
    console.log("   Payload:", JSON.stringify(payload, null, 2));

    await producer.send({
      topic: "user-interests-updated",
      messages: [{ value: JSON.stringify(payload) }],
    });

    console.log("✅ [INTEREST EVENT] user-interests-updated event sent to Kafka");
  }
}
