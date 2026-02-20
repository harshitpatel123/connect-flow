# Post Service

Microservice for post creation and retrieval.

## Quick Start

```bash
# Setup
./setup.sh

# Start service
npm run dev
```

## API Endpoints

### POST /posts
```bash
curl -X POST http://localhost:5002/posts \
  -H "Content-Type: application/json" \
  -d '{
    "userId":"user-id",
    "content":"Hello World",
    "categoryTags":["Technology","News"]
  }'
```

### GET /posts/:id
```bash
curl http://localhost:5002/posts/POST_ID
```

### GET /posts/user/:userId
```bash
curl http://localhost:5002/posts/user/USER_ID
```

### POST /posts/batch (Internal)
```bash
curl -X POST http://localhost:5002/posts/batch \
  -H "Content-Type: application/json" \
  -d '{"ids":["id1","id2"]}'
```

### GET /health
```bash
curl http://localhost:5002/health
```

## Environment Variables

```env
PORT=5002
DATABASE_URL=postgresql://post_user:post_pass@localhost:5433/post_db
KAFKA_BROKERS=localhost:9092
CONSUL_HOST=localhost
CONSUL_PORT=8500
SERVICE_NAME=post-service
SERVICE_ID=post-service-1
```

## Events Published

- `post-created` - When a new post is created

## Architecture

```
src/
├── api/              # REST endpoints
├── application/      # Use cases (CreatePost)
├── domain/           # Types
├── infrastructure/   # Repository, Prisma
├── events/           # Kafka publisher
├── config/           # Consul configuration
└── server.ts         # Entry point
```

## Database Schema

```prisma
model Post {
  id            String   @id @default(uuid())
  userId        String
  content       String
  likeCount     Int      @default(0)
  commentCount  Int      @default(0)
  viewCount     BigInt   @default(0)
  categoryTags  String[]
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

## Features

- Post creation with category tags
- Kafka event publishing
- Consul service discovery
- Health check endpoint
- Graceful shutdown
