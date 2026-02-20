# Feed Service

Microservice for personalized feed generation using Push, Pull, and Re-rank models.

## Quick Start

```bash
# Setup
./setup.sh

# Start service
npm run dev
```

## API Endpoints

### GET /feed/:userId
```bash
curl http://localhost:5004/feed/USER_ID
```

### POST /feed/:userId/regenerate
```bash
curl -X POST http://localhost:5004/feed/USER_ID/regenerate
```

### GET /health
```bash
curl http://localhost:5004/health
```

## Environment Variables

```env
PORT=5004
REDIS_HOST=localhost
REDIS_PORT=6379
KAFKA_BROKERS=localhost:9092
CONSUL_HOST=localhost
CONSUL_PORT=8500
SERVICE_NAME=feed-service
SERVICE_ID=feed-service-1
POST_SERVICE_URL=http://localhost:5002
INTERACTION_SERVICE_URL=http://localhost:5003
```

## Events Consumed

- `post-created` - Triggers PUSH model (build feed)
- `user-interests-updated` - Triggers RE-RANK model (re-rank feed)

## Service Dependencies

**Calls other services:**
- Post Service - `POST /posts/batch` (get post details)
- Interaction Service - `GET /interactions/interests/:userId` (get user interests)

## Features

- PUSH model (build feed on post creation)
- PULL model (regenerate feed on demand)
- RE-RANK model (re-rank on interest changes)
- Redis feed storage (sorted sets)
- Kafka event consumers
- Consul service discovery
- Health check endpoint
- Graceful shutdown

## Architecture

```
src/
├── api/              # REST endpoints
├── application/      # Use cases (BuildFeed, GetFeed, RegenerateFeed, RerankFeed)
├── domain/           # Types
├── infrastructure/   # Redis, Feed Store
├── events/           # Kafka consumers
├── clients/          # Post & Interaction service clients
├── config/           # Consul configuration
└── server.ts         # Entry point
```

## Feed Scoring Formula

```
score = (userAffinity × 20) - (ageInHours × 5)
```
