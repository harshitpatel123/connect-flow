import { kafka } from './clients.js';

async function viewKafkaEvents() {
  console.log("\n" + "=".repeat(80));
  console.log("📦 KAFKA EVENTS");
  console.log("=".repeat(80));

  const admin = kafka.admin();
  await admin.connect();

  try {
    const topics = await admin.listTopics();
    const appTopics = topics.filter(t => !t.startsWith('__') && !t.startsWith('_'));
    console.log(`\n📝 Topics: ${appTopics.join(", ") || "None"}`);

    if (appTopics.length === 0) {
      console.log("\nℹ️  No topics found. Create some data to see events.");
      return;
    }

    for (const topic of appTopics) {
      console.log(`\n${"=".repeat(80)}`);
      console.log(`📡 Topic: ${topic}`);
      console.log("=".repeat(80));
      
      const topicMetadata = await admin.fetchTopicMetadata({ topics: [topic] });
      const topicInfo = topicMetadata.topics[0];
      console.log(`Partitions: ${topicInfo.partitions.length}`);

      const uniqueGroupId = `debug-${topic}-${Date.now()}`;
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
              key: message.key?.toString(),
              value: JSON.parse(message.value.toString())
            });
          }
        }
      });

      console.log(`⏳ Reading messages...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      await consumer.disconnect();

      console.log(`\n📜 Events: ${events.length}`);
      
      if (events.length === 0) {
        console.log(`   ℹ️  No events in this topic`);
      } else {
        events.forEach((event, index) => {
          console.log(`\n   Event ${index + 1}:`);
          console.log(`      Partition: ${event.partition}`);
          console.log(`      Offset: ${event.offset}`);
          console.log(`      Timestamp: ${new Date(parseInt(event.timestamp)).toISOString()}`);
          if (event.key) {
            console.log(`      Key: ${event.key}`);
          }
          console.log(`      Data:`, JSON.stringify(event.value, null, 8));
        });
      }
    }
  } catch (error: any) {
    console.error(`\n❌ Error reading Kafka:`, error.message);
  } finally {
    await admin.disconnect();
  }

  console.log("\n" + "=".repeat(80) + "\n");
}

try {
  await viewKafkaEvents();
} finally {
  process.exit(0);
}
