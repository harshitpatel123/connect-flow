import { producer } from "../../../internal/messaging/kafka.producer";

export class PostEventPublisher {
  async publishPostCreated(event: {
    postId: string;
    userId: string;
    createdAt: number;
  }) {
    const eventData = {
      type: "PostCreated",
      ...event
    };
    
    console.log("\n📦 [KAFKA EVENT] Preparing event data:");
    console.log("   Topic: post-created");
    console.log("   Event Type:", eventData.type);
    console.log("   Event Data:", JSON.stringify(eventData, null, 2));

    await producer.send({
      topic: "post-created",
      messages: [
        {
          key: event.postId,
          value: JSON.stringify(eventData)
        }
      ]
    });
    
    console.log("✅ [KAFKA EVENT] Event sent to Kafka queue");
  }
}
