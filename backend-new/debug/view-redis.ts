import { redis } from './clients.js';

async function viewRedisData() {
  console.log("\n" + "=".repeat(80));
  console.log("💾 REDIS DATA");
  console.log("=".repeat(80));

  try {
    // Get all keys
    const keys = await redis.keys('*');
    
    if (keys.length === 0) {
      console.log("\nℹ️  No data in Redis. Create some data to see cache.");
      return;
    }

    console.log(`\n📊 Total Keys: ${keys.length}\n`);

    // Group keys by type
    const feedKeys = keys.filter(k => k.startsWith('feed:'));
    const seenKeys = keys.filter(k => k.startsWith('seen:'));
    const likeKeys = keys.filter(k => k.startsWith('like:'));
    const otherKeys = keys.filter(k => !k.startsWith('feed:') && !k.startsWith('seen:') && !k.startsWith('like:'));

    // Display Feeds
    if (feedKeys.length > 0) {
      console.log("=".repeat(80));
      console.log("📰 FEEDS");
      console.log("=".repeat(80));
      
      for (const key of feedKeys) {
        const feedPosts = await redis.zrevrange(key, 0, -1, 'WITHSCORES');
        const userId = key.replace('feed:', '');
        
        console.log(`\n${key} → ${feedPosts.length / 2} posts`);
        for (let i = 0; i < feedPosts.length; i += 2) {
          const postId = feedPosts[i];
          const score = feedPosts[i + 1];
          console.log(`   ${i / 2 + 1}. ${postId.substring(0, 20)}... (score: ${score})`);
        }
      }
    }

    // Display Seen Posts
    if (seenKeys.length > 0) {
      console.log("\n" + "=".repeat(80));
      console.log("👁️  SEEN POSTS");
      console.log("=".repeat(80));
      
      for (const key of seenKeys) {
        const seenPosts = await redis.smembers(key);
        const userId = key.replace('seen:', '');
        
        console.log(`\n${key} → ${seenPosts.length} posts`);
        if (seenPosts.length > 0) {
          seenPosts.forEach((postId, index) => {
            console.log(`   ${index + 1}. ${postId.substring(0, 20)}...`);
          });
        }
      }
    }

    // Display Likes
    if (likeKeys.length > 0) {
      console.log("\n" + "=".repeat(80));
      console.log("👍 LIKES");
      console.log("=".repeat(80));
      
      for (const key of likeKeys) {
        const value = await redis.get(key);
        console.log(`\n${key} → ${value}`);
      }
    }

    // Display Other Keys
    if (otherKeys.length > 0) {
      console.log("\n" + "=".repeat(80));
      console.log("🔑 OTHER KEYS");
      console.log("=".repeat(80));
      
      for (const key of otherKeys) {
        const type = await redis.type(key);
        let value;
        
        switch (type) {
          case 'string':
            value = await redis.get(key);
            break;
          case 'list':
            value = await redis.lrange(key, 0, -1);
            break;
          case 'set':
            value = await redis.smembers(key);
            break;
          case 'zset':
            value = await redis.zrange(key, 0, -1, 'WITHSCORES');
            break;
          case 'hash':
            value = await redis.hgetall(key);
            break;
          default:
            value = `<${type}>`;
        }
        
        console.log(`\n${key} (${type})`);
        console.log(`   ${JSON.stringify(value)}`);
      }
    }

  } catch (error: any) {
    console.error(`\n❌ Error reading Redis:`, error.message);
  }

  console.log("\n" + "=".repeat(80) + "\n");
}

try {
  await viewRedisData();
} finally {
  await redis.quit();
  process.exit(0);
}
