# Debug Utilities

## Feed Debugger
Shows all feed data, Redis cache, and Kafka events.

**Used automatically** after each feed update in `modules/feed/infrastructure/feed-event.consumer.ts`

## Cleanup Script
Clears all Kafka and Redis data including volume storage.

**Run:**
```bash
npx tsx debug/cleanup.ts
```

This will:
- Flush all Redis data
- Delete all Kafka topics
- Clear volume data in `/home/logicrays/Desktop/connect-flow-data/`

## To Remove Debug Code

1. Delete `/backend/debug/` folder
2. Delete `/backend/modules/feed/debug/` folder  
3. Remove from `feed-event.consumer.ts`:
   - `import { logFeedData } from "../../../debug/feed-debugger";`
   - `await logFeedData();`
