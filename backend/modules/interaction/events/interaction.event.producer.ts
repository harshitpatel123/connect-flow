import { producer } from "../../../internal/messaging/kafka.producer";

export class InteractionEventProducer {
  async postLiked(payload: { userId: string; postId: string }) {
    console.log("\n📦 [KAFKA EVENT] Preparing post-liked event:");
    console.log("   Topic: post-liked");
    console.log("   Payload:", JSON.stringify(payload, null, 2));

    await producer.send({
      topic: "post-liked",
      messages: [{ value: JSON.stringify(payload) }],
    });

    console.log("✅ [KAFKA EVENT] post-liked event sent to Kafka");
  }

  async postUnliked(payload: { userId: string; postId: string }) {
    console.log("\n📦 [KAFKA EVENT] Preparing post-unliked event:");
    console.log("   Topic: post-unliked");
    console.log("   Payload:", JSON.stringify(payload, null, 2));

    await producer.send({
      topic: "post-unliked",
      messages: [{ value: JSON.stringify(payload) }],
    });

    console.log("✅ [KAFKA EVENT] post-unliked event sent to Kafka");
  }

  async postViewed(payload: { userId: string; postId: string }) {
    console.log("\n📦 [KAFKA EVENT] Preparing post-viewed event:");
    console.log("   Topic: post-viewed");
    console.log("   Payload:", JSON.stringify(payload, null, 2));

    await producer.send({
      topic: "post-viewed",
      messages: [{ value: JSON.stringify(payload) }],
    });

    console.log("✅ [KAFKA EVENT] post-viewed event sent to Kafka");
  }
}
