# Debug Utilities for Microservices

Debug scripts to inspect Redis cache and Kafka events across all microservices.

## Prerequisites

Make sure all services are running:
```bash
make start
```

## Setup

```bash
cd backend/debug
npm install
```

## Available Scripts

### 1. View All Kafka Events
Shows all Kafka topics and their events.

```bash
npx tsx view-kafka.ts
```

**Shows:**
- All available topics
- Events in each topic (post-created, post-liked, post-unliked, post-commented, post-viewed, user-interests-updated)
- Event details (offset, timestamp, payload)

---

### 2. View All Redis Data
Shows all Redis cache data.

```bash
npx tsx view-redis.ts
```

**Shows:**
- User feeds (sorted by score)
- Seen posts per user
- Likes per user/post
- All Redis keys and their values

---

### 3. Cleanup Cache & Events
**⚠️ WARNING: This deletes ALL Redis and Kafka data!**

```bash
npx tsx cleanup.ts
```

**This will:**
- Flush all Redis data (feeds, likes, seen posts)
- Delete all Kafka topics and events
- **Does NOT touch databases** (use `make clean` for that)

---

## Database Management

For database operations, use Makefile commands:

```bash
make studio   # View/edit databases in Prisma Studio
make clean    # Delete all data including databases
```

---

## Example Output

### Kafka Events:
```
📦 KAFKA EVENTS
================================================================================

📝 Topics: post-created, post-liked, post-unliked, user-interests-updated

📡 Topic: post-created
   Events: 3
   
   Event 1:
      Offset: 0
      Timestamp: 2024-01-15T10:30:00.000Z
      Data: {
        "type": "PostCreated",
        "postId": "abc-123",
        "userId": "user-456"
      }
```

### Redis Data:
```
💾 REDIS DATA
================================================================================

📰 Feeds:
   feed:user-123 → 3 posts
      1. post-abc (score: 85.5)
      2. post-def (score: 72.3)
      3. post-ghi (score: 45.1)

👁️  Seen Posts:
   seen:user-123 → 2 posts
      post-abc, post-def

👍 Likes:
   like:user-123:post-abc → 1
   like:user-456:post-def → 1
```
