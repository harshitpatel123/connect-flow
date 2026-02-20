# Interaction Service

Microservice for likes, comments, views, and user interest tracking.

## Quick Start

```bash
# Setup
./setup.sh

# Start service
npm run dev
```

## API Endpoints

### POST /interactions/like
```bash
curl -X POST http://localhost:5003/interactions/like \
  -H "Content-Type: application/json" \
  -d '{"userId":"user-id","postId":"post-id"}'
```

### POST /interactions/unlike
```bash
curl -X POST http://localhost:5003/interactions/unlike \
  -H "Content-Type: application/json" \
  -d '{"userId":"user-id","postId":"post-id"}'
```

### POST /interactions/comment
```bash
curl -X POST http://localhost:5003/interactions/comment \
  -H "Content-Type: application/json" \
  -d '{"userId":"user-id","postId":"post-id","content":"Great post!"}'
```

### GET /interactions/likes/:postId
```bash
curl http://localhost:5003/interactions/likes/POST_ID
```

### GET /interactions/comments/:postId
```bash
curl http://localhost:5003/interactions/comments/POST_ID
```

### GET /interactions/interests/:userId
```bash
curl http://localhost:5003/interactions/interests/USER_ID
```

### GET /health
```bash
curl http://localhost:5003/health
```

## Environment Variables

```env
PORT=5003
DATABASE_URL=postgresql://interaction_user:interaction_pass@localhost:5434/interaction_db
REDIS_HOST=localhost
REDIS_PORT=6379
KAFKA_BROKERS=localhost:9092
CONSUL_HOST=localhost
CONSUL_PORT=8500
SERVICE_NAME=interaction-service
SERVICE_ID=interaction-service-1
```

## Events

**Published:**
- `post-liked` - When a post is liked
- `post-unliked` - When a post is unliked
- `post-commented` - When a post is commented
- `user-interests-updated` - When user interests change

## Features

- Like/Unlike with Redis caching
- Comment creation
- Batch worker (100 items/sec)
- User interest tracking
- Kafka event publishing
- Consul service discovery
- Health check endpoint
- Graceful shutdown

## Architecture

```
src/
├── api/              # REST endpoints
├── application/      # Use cases (Like, Unlike, Comment)
├── domain/           # Types
├── infrastructure/   # Repository, Redis, Batch Worker, Prisma
├── events/           # Kafka producer
├── config/           # Consul configuration
└── server.ts         # Entry point
```
