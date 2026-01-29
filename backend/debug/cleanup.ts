import { redis } from "../internal/cache/redis.client";
import { kafka } from "../internal/messaging/kafka.client";
import { execSync } from "child_process";
import { logFeedData } from "./feed-debugger";

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

    // Clean volume data
    console.log("\n🗑️  [VOLUME] Cleaning volume data...");
    try {
      execSync("rm -rf /home/logicrays/Desktop/connect-flow-data/kafka/*", { stdio: "inherit" });
      execSync("rm -rf /home/logicrays/Desktop/connect-flow-data/redis/*", { stdio: "inherit" });
      console.log("✅ [VOLUME] Volume data cleared");
    } catch (error) {
      console.log("⚠️  [VOLUME] Could not clear volume data (may need sudo)");
    }

    console.log("\n" + "=".repeat(80));
    console.log("✅ [CLEANUP] Complete! All data cleared.");
    console.log("⚠️  [CLEANUP] Restart Docker services: cd docker && docker compose restart");
    console.log("=".repeat(80) + "\n");

    // Display current state
    await logFeedData();

  } catch (error) {
    console.error("❌ [CLEANUP] Error:", error);
  } finally {
    process.exit(0);
  }
}

cleanupData();
