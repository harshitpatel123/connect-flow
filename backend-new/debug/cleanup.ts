import { redis, kafka } from './clients.js';

async function cleanupData() {
  console.log("\n" + "=".repeat(80));
  console.log("🧹 [CLEANUP] Starting data cleanup...");
  console.log("=".repeat(80));

  try {
    // Clean Redis
    console.log("\n🗑️  [REDIS] Flushing all data...");
    await redis.flushall();
    console.log("✅ [REDIS] All data cleared");

    // Clean Kafka topics
    console.log("\n🗑️  [KAFKA] Deleting topics...");
    const admin = kafka.admin();
    await admin.connect();
    
    const topics = await admin.listTopics();
    if (topics.length > 0) {
      await admin.deleteTopics({ topics });
      console.log(`✅ [KAFKA] Deleted topics: ${topics.join(", ")}`);
    } else {
      console.log("ℹ️  [KAFKA] No topics to delete");
    }
    
    await admin.disconnect();

    console.log("\n" + "=".repeat(80));
    console.log("✅ [CLEANUP] Complete! All cache and event data cleared.");
    console.log("⚠️  [CLEANUP] Database data is preserved.");
    console.log("⚠️  [CLEANUP] Restart services: make stop && make start");
    console.log("=".repeat(80) + "\n");

  } catch (error: any) {
    console.error("❌ [CLEANUP] Error:", error.message);
  } finally {
    await redis.quit();
    process.exit(0);
  }
}

cleanupData();
