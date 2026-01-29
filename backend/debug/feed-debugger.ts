import { redis } from "../internal/cache/redis.client";
import { prisma } from "../internal/database/prisma.client";
import { kafka } from "../internal/messaging/kafka.client";

export async function logFeedData() {
  console.log("\n" + "=".repeat(80));
  console.log("📊 [DEBUG] FEED & CACHE DATA");
  console.log("=".repeat(80));

  const users = await prisma.user.findMany({
    where: { isActive: true },
    select: { id: true, email: true }
  });

  for (const user of users) {
    console.log(`\n👤 ${user.email} (${user.id})`);
    console.log("-".repeat(80));

    const feedKey = `feed:${user.id}`;
    const feedPosts = await redis.zrevrange(feedKey, 0, -1, "WITHSCORES");

    console.log(`📰 Feed: ${feedPosts.length / 2} posts`);
    for (let i = 0; i < feedPosts.length; i += 2) {
      const postId = feedPosts[i];
      const score = feedPosts[i + 1];
      console.log(`   ${i / 2 + 1}. ${postId} (score: ${score})`);
    }

    const seenKey = `seen:${user.id}`;
    const seenPosts = await redis.smembers(seenKey);
    console.log(`👁️  Seen: ${seenPosts.length} posts`);
    if (seenPosts.length > 0) {
      console.log(`   ${seenPosts.join(", ")}`);
    }
  }

  console.log("\n" + "=".repeat(80));
  console.log("📦 [DEBUG] KAFKA EVENT STREAM");
  console.log("=".repeat(80));

  const admin = kafka.admin();
  await admin.connect();

  try {
    const topics = await admin.listTopics();
    console.log(`\n📝 Topics: ${topics.join(", ")}`);

    if (topics.includes("post-events")) {
      const topicMetadata = await admin.fetchTopicMetadata({ topics: ["post-events"] });
      const topic = topicMetadata.topics[0];

      console.log(`\n📡 Topic: post-events`);
      console.log(`   Partitions: ${topic.partitions.length}`);

      for (const partition of topic.partitions) {
        console.log(`\n   📊 Partition ${partition.partitionId}:`);
        console.log(`      Leader: ${partition.leader}`);
        console.log(`      Replicas: ${partition.replicas.join(", ")}`);
        console.log(`      ISR: ${partition.isr.join(", ")}`);
      }

      const consumer = kafka.consumer({ groupId: "debug-reader" });
      await consumer.connect();
      await consumer.subscribe({ topic: "post-events", fromBeginning: true });

      const events: any[] = [];

      await consumer.run({
        eachMessage: async ({ partition, message }) => {
          if (message.value) {
            events.push({
              partition,
              offset: message.offset,
              timestamp: message.timestamp,
              key: message.key?.toString(),
              value: JSON.parse(message.value.toString())
            });
          }
        }
      });

      await new Promise(resolve => setTimeout(resolve, 2000));
      await consumer.disconnect();

      console.log(`\n📜 Events in stream: ${events.length}`);
      events.forEach((event, index) => {
        console.log(`\n   Event ${index + 1}:`);
        console.log(`      Partition: ${event.partition}`);
        console.log(`      Offset: ${event.offset}`);
        console.log(`      Timestamp: ${new Date(parseInt(event.timestamp)).toISOString()}`);
        console.log(`      Key: ${event.key}`);
        console.log(`      Value:`, JSON.stringify(event.value, null, 8));
      });
    }
  } catch (error) {
    console.log(`\n⚠️  Error reading Kafka:`, error);
  } finally {
    await admin.disconnect();
  }

  console.log("\n" + "=".repeat(80) + "\n");
}