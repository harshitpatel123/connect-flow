import { redis } from "../internal/cache/redis.client";
import { prisma } from "../internal/database/prisma.client";

export async function logInteractionData() {
  console.log("\n" + "=".repeat(80));
  console.log("📊 [DEBUG] INTERACTION DATA");
  console.log("=".repeat(80));

  const users = await prisma.user.findMany({
    where: { isActive: true },
    select: { id: true, email: true }
  });

  const posts = await prisma.post.findMany({
    select: { id: true, content: true, userId: true }
  });

  console.log(`\n📝 Total Posts: ${posts.length}`);
  console.log(`👥 Total Users: ${users.length}`);

  // Check Likes in Redis
  console.log("\n" + "=".repeat(80));
  console.log("👍 LIKES (Redis)");
  console.log("=".repeat(80));

  let totalLikes = 0;
  for (const user of users) {
    for (const post of posts) {
      const likeKey = `like:${user.id}:${post.id}`;
      const liked = await redis.get(likeKey);
      if (liked) {
        totalLikes++;
        console.log(`✓ ${user.email} liked post ${post.id.substring(0, 8)}...`);
      }
    }
  }
  console.log(`\nTotal Likes: ${totalLikes}`);

  // Check Views in Redis
  console.log("\n" + "=".repeat(80));
  console.log("👁️  VIEWS (Redis)");
  console.log("=".repeat(80));

  for (const user of users) {
    const seenKey = `seen:${user.id}`;
    const seenPosts = await redis.smembers(seenKey);
    console.log(`\n👤 ${user.email}:`);
    console.log(`   Viewed ${seenPosts.length} posts`);
    if (seenPosts.length > 0) {
      seenPosts.forEach((postId, index) => {
        console.log(`   ${index + 1}. ${postId.substring(0, 8)}...`);
      });
    }
  }

  // Check Comments in Database
  console.log("\n" + "=".repeat(80));
  console.log("💬 COMMENTS (Database)");
  console.log("=".repeat(80));

  const comments = await prisma.comment.findMany({
    orderBy: { createdAt: "desc" }
  });

  console.log(`\nTotal Comments: ${comments.length}`);
  
  for (const comment of comments) {
    const user = await prisma.user.findUnique({ where: { id: comment.userId } });
    const post = await prisma.post.findUnique({ where: { id: comment.postId } });
    
    console.log(`\n${comments.indexOf(comment) + 1}. Comment by ${user?.email || "Unknown"}:`);
    console.log(`   Post: ${comment.postId.substring(0, 8)}...`);
    console.log(`   Content: ${comment.content.substring(0, 50)}${comment.content.length > 50 ? "..." : ""}`);
    console.log(`   Created: ${comment.createdAt.toISOString()}`);
  }

  // Check Post Stats
  console.log("\n" + "=".repeat(80));
  console.log("📈 POST STATISTICS");
  console.log("=".repeat(80));

  for (const post of posts) {
    const postData = await prisma.post.findUnique({
      where: { id: post.id },
      select: {
        id: true,
        content: true,
        likeCount: true,
        commentCount: true,
        viewCount: true
      }
    });

    if (postData) {
      console.log(`\n📄 Post ${postData.id.substring(0, 8)}...`);
      console.log(`   Content: ${postData.content.substring(0, 50)}${postData.content.length > 50 ? "..." : ""}`);
      console.log(`   👍 Likes: ${postData.likeCount}`);
      console.log(`   💬 Comments: ${postData.commentCount}`);
      console.log(`   👁️  Views: ${postData.viewCount}`);
    }
  }

  console.log("\n" + "=".repeat(80) + "\n");
}

export async function logInteractionKafkaEvents() {
  const { kafka } = await import("../internal/messaging/kafka.client");
  
  console.log("\n" + "=".repeat(80));
  console.log("📦 [DEBUG] KAFKA INTERACTION EVENTS");
  console.log("=".repeat(80));

  const admin = kafka.admin();
  await admin.connect();

  try {
    const topics = await admin.listTopics();
    const interactionTopics = topics.filter(t => t.includes("post-liked") || t.includes("post-viewed"));
    
    console.log(`\n📝 Available Interaction Topics: ${interactionTopics.join(", ") || "None"}`);

    for (const topic of interactionTopics) {
      console.log(`\n📡 Topic: ${topic}`);
      
      const topicMetadata = await admin.fetchTopicMetadata({ topics: [topic] });
      const topicInfo = topicMetadata.topics[0];
      console.log(`   Partitions: ${topicInfo.partitions.length}`);

      const uniqueGroupId = `debug-interaction-${Date.now()}`;
      const consumer = kafka.consumer({ groupId: uniqueGroupId });
      await consumer.connect();
      await consumer.subscribe({ topic, fromBeginning: true });

      const events: any[] = [];

      await consumer.run({
        eachMessage: async ({ partition, message }) => {
          if (message.value) {
            events.push({
              partition,
              offset: message.offset,
              timestamp: message.timestamp,
              value: JSON.parse(message.value.toString())
            });
          }
        }
      });

      await new Promise(resolve => setTimeout(resolve, 2000));
      await consumer.disconnect();

      console.log(`   📜 Events: ${events.length}`);
      events.forEach((event, index) => {
        console.log(`\n   Event ${index + 1}:`);
        console.log(`      Offset: ${event.offset}`);
        console.log(`      Timestamp: ${new Date(parseInt(event.timestamp)).toISOString()}`);
        console.log(`      Data:`, JSON.stringify(event.value, null, 8));
      });
    }
  } catch (error) {
    console.log(`\n⚠️  Error reading Kafka:`, error);
  } finally {
    await admin.disconnect();
  }

  console.log("\n" + "=".repeat(80) + "\n");
}
