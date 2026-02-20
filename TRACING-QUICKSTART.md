# 🔍 How to Debug with Jaeger

## Quick Start

### 1. Start Infrastructure
```bash
cd backend-new/infrastructure
docker-compose up -d
```

### 2. Access Jaeger UI
Open: **http://localhost:16686**

### 3. Make Some Requests
```bash
# Create a post
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "mutation { createPost(...) }"}'

# Get feed
curl http://localhost:5004/feed/user-123
```

### 4. View Traces in Jaeger

1. Go to http://localhost:16686
2. Select **Service**: `feed-service`
3. Click **Find Traces**
4. Click any trace to see details

## What You'll See

### Trace Timeline
```
GET /feed/:userId (100ms total)
├─ feed-service (5ms)
├─ post-service.getPostsByIds (80ms)
│  └─ database query (75ms)
└─ interaction-service.getUserInterests (15ms)
```

### When Something Fails

**Red spans** = Errors

Click the red span to see:
- Error message
- Which service failed
- Why it failed
- Stack trace

## Example: Debug Slow Feed

### Problem
Feed takes 5 seconds to load

### Solution
1. Open Jaeger
2. Find slow traces (> 1s)
3. Click slowest trace
4. See timeline:
   - `post-service.getPostsByIds`: **4.8s** ← Problem!
   - Database query: **4.7s** ← Root cause

### Fix
Add database index or caching

## Trace Tags

Each trace includes:
- `user.id` - Which user
- `post.id` - Which post
- `http.status_code` - Response status
- `error` - true/false
- `posts.count` - Number of posts

## Search Examples

### Find all errors
- Tags: `error=true`

### Find user's requests
- Tags: `user.id=abc123`

### Find slow requests
- Min Duration: `1s`

## Benefits

✅ See exact service that failed  
✅ Measure performance bottlenecks  
✅ Track requests across services  
✅ Debug production issues  
✅ Visualize service dependencies  

## Ports

- **16686** - Jaeger UI
- **6831** - Agent (UDP) - Services send traces here
- **14268** - Collector (HTTP)
