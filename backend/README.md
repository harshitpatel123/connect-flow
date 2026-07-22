# Connect Flow - Microservices Backend

Production-grade microservices architecture with **event-driven design**, **distributed tracing**, **rate limiting**, and **comprehensive logging**.

---

## 🚀 Quick Start

```bash
make backend    # Start all backend services (from root)
make frontend   # Start frontend - waits for backend to be ready (from root)
```

Docker will automatically:
- ✅ Kill conflicting ports
- ✅ Build all service images
- ✅ Start infrastructure (PostgreSQL, Redis, Kafka, Consul, Jaeger)
- ✅ Wait for databases to be healthy
- ✅ Run Prisma migrations for all databases
- ✅ Start all microservices with hot-reload
- ✅ Show API Gateway logs

**Note:** Press `Ctrl+C` to exit logs (services keep running in background).

---

## 📊 Commands

> All commands are run from the **root** of the project.

| Command | Description |
|---------|-------------|
| `make backend` | Start all backend services with auto-migration |
| `make frontend` | Start frontend (waits for backend to be ready) |
| `make stop` | Stop all services (keeps data) |
| `make clean` | Stop and delete all data (volumes) |
| `make logs` | Show all services logs |
| `make status` | Show service status |
| `make init-migrations` | Generate initial Prisma migrations |
| `make migrate` | Run Prisma migrations manually |
| `make studio` | Open Prisma Studio for all databases |

### View Specific Service Logs
```bash
# View all services logs
make logs

# View specific service logs
docker compose logs -f auth-service
docker compose logs -f post-service
docker compose logs -f interaction-service
docker compose logs -f feed-service
docker compose logs -f api-gateway
```

### Database Management
```bash
# Open Prisma Studio for all databases
make studio
# Auth DB:         http://localhost:5555
# Post DB:         http://localhost:5556
# Interaction DB:  http://localhost:5557
```

---

## 🌐 Service URLs

| Service | URL | Purpose |
|---------|-----|----------|
| **API Gateway** | http://localhost:4000/graphql | GraphQL endpoint (main entry point) |
| Auth Service | http://localhost:5001 | JWT authentication |
| Post Service | http://localhost:5002 | Post creation & retrieval |
| Interaction Service | http://localhost:5003 | Likes, comments, views, interests |
| Feed Service | http://localhost:5004 | Personalized feed generation |
| **Consul UI** | http://localhost:8500 | Service discovery & health checks |
| **Jaeger UI** | http://localhost:16686 | Distributed tracing (scaffolded) |
| **Prisma Studio** | http://localhost:5555-5557 | Database GUI (run `make studio`) |

---

## 🔥 Hot-Reload Development

**All services support hot-reload!** Changes to source code automatically restart the service.

### How it works:
- Source code is **mounted as volumes** in Docker containers
- Services use **nodemon** to watch for file changes
- On file change → service auto-restarts (2-3 seconds)

### Example workflow:
```bash
# 1. Start services
make backend

# 2. Edit code in services/auth-service/src/...
# → Auth service automatically restarts

# 3. View logs to see restart
docker compose logs -f auth-service

# 4. Test changes immediately
curl http://localhost:5001/health
```

### Prisma Schema Changes
```bash
# After editing schema.prisma files:
make migrate    # Apply migrations to running containers
```

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Port 3000)                      │
│                   Next.js + Apollo Client                    │
└──────────────────────────┬──────────────────────────────────┘
                           │ GraphQL over HTTP
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                 API Gateway (Port 4000)                      │
│   GraphQL | Rate Limiting | Auth | Request Logging          │
│              [Docker Container + Hot-Reload]                 │
└──────────────────────────┬──────────────────────────────────┘
                           │ REST (Service-to-Service)
        ┌──────────────────┼──────────────────┬───────────────┐
        ▼                  ▼                  ▼               ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Auth Service │  │ Post Service │  │ Interaction  │  │ Feed Service │
│  (Port 5001) │  │  (Port 5002) │  │  (Port 5003) │  │  (Port 5004) │
│ JWT + Bcrypt │  │ Kafka Events │  │ Redis Cache  │  │ Redis Feeds  │
└──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘
       │                 │                  │                  │
       ▼                 ▼                  ▼                  ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  Auth DB     │  │  Post DB     │  │ Interaction  │  │  Redis       │
│  (Port 5432) │  │  (Port 5433) │  │  DB (5434)   │  │  (Port 6379) │
│  PostgreSQL  │  │  PostgreSQL  │  │  PostgreSQL  │  │  Cache+Feeds │
└──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘

┌─────────────────────────────────────────────────────────────┐
│              Shared Infrastructure (Docker)                  │
│  Kafka (9092/9094) | Consul (8500) | Jaeger (16686)         │
│  Event Streaming   | Service Disc. | Tracing (scaffolded)   │
└─────────────────────────────────────────────────────────────┘
```

### Event Flow
```
User creates post → Post Service → Kafka (post-created)
                                      ↓
                            Feed Service consumes event
                                      ↓
                            Adds to qualified users' feeds (Redis)

User likes post → Interaction Service → Kafka (post-liked)
                                           ↓
                                  Updates user interests
                                           ↓
                            Kafka (user-interests-updated)
                                           ↓
                            Feed Service re-ranks feeds
```

---

## 🔧 Troubleshooting

### Services won't start
```bash
# Check status
make status

# View logs
make logs

# Restart specific service
docker compose restart auth-service
```

### Port already in use
```bash
# Stop all containers
make stop

# Or force clean (deletes all data)
make clean

# Makefile automatically kills processes on ports during start
```

### Database connection errors
```bash
# Check database health
docker compose ps

# Test database connection
docker compose exec auth-db pg_isready -U auth_user
docker compose exec post-db pg_isready -U post_user
docker compose exec interaction-db pg_isready -U interaction_user
```

### Prisma migration errors
```bash
# Run migrations manually
make migrate

# Or generate initial migrations
make init-migrations
```

### Code changes not reflecting
```bash
# Check if nodemon is running
docker compose logs -f auth-service

# Force rebuild if needed
docker compose up -d --build auth-service
```

### Kafka connection errors
```bash
# Check Kafka health
docker compose logs kafka

# Verify Kafka is listening
docker compose exec kafka nc -z localhost 9092
```

### Redis connection errors
```bash
# Check Redis health
docker compose exec redis redis-cli ping
# Should return: PONG
```

### View specific service logs
```bash
docker compose logs -f auth-service
docker compose logs -f post-service
docker compose logs -f interaction-service
docker compose logs -f feed-service
docker compose logs -f api-gateway
```

---

## 📦 What's Included

### Infrastructure (Docker Containers)
- ✅ **PostgreSQL** (3 separate databases: auth, post, interaction)
- ✅ **Redis** (caching, feeds, rate limiting, seen posts)
- ✅ **Kafka** (event streaming with dual listeners: internal + external)
- ✅ **Consul** (service discovery & health checks)
- ✅ **Jaeger** (distributed tracing - scaffolded)

### Microservices (Docker Containers)
- ✅ **Auth Service** - JWT authentication with bcrypt password hashing
- ✅ **Post Service** - Post creation with Kafka event publishing
- ✅ **Interaction Service** - Likes, comments, views, user interests tracking
- ✅ **Feed Service** - Personalized feed generation with scoring algorithm
- ✅ **API Gateway** - GraphQL endpoint with rate limiting & authentication

### Production Features
- ✅ **Comprehensive Logging** - Request ID tracking, service prefixes, duration timing
- ✅ **Rate Limiting** - IP-based (1000/15min) + User-based (30 mutations/min, 100 queries/min)
- ✅ **Event-Driven Architecture** - 6 Kafka topics (post-created, post-liked, post-unliked, post-commented, post-viewed, user-interests-updated)
- ✅ **Redis Caching** - Like counts, view counts, personalized feeds, seen posts
- ✅ **Service Discovery** - Consul-based registration & health checks
- ✅ **Hot-Reload** - All services support live code reloading
- ✅ **Database per Service** - Complete data isolation
- ✅ **BigInt Serialization** - Proper handling of Prisma BigInt fields
- ✅ **Dual Kafka Listeners** - Internal (kafka:9092) + External (localhost:9094)
- ✅ **Auto-Migration** - Prisma migrations run automatically on startup
- ✅ **Debug Utilities** - Scripts to inspect Redis & Kafka data

---

## 🎓 Development Workflow

### 1. Start Development
```bash
make backend   # terminal 1
make frontend  # terminal 2
```

### 2. Make Code Changes
Edit files in `services/*/src/` - changes auto-reload in 2-3 seconds!

### 3. View Logs
```bash
# All services
make logs

# Specific service
docker compose logs -f auth-service
```

### 4. Test Changes
```bash
# GraphQL Playground (use Apollo Sandbox or Postman)
curl http://localhost:4000/graphql

# Service health checks
curl http://localhost:5001/health  # Auth
curl http://localhost:5002/health  # Post
curl http://localhost:5003/health  # Interaction
curl http://localhost:5004/health  # Feed
curl http://localhost:4000/health  # API Gateway
```

### 5. Debug Data
```bash
# View Redis & Kafka data
cd debug
npm install
npx tsx view-redis.ts   # View feeds, likes, seen posts
npx tsx view-kafka.ts   # View all Kafka events
```

### 6. Database Management
```bash
# Open Prisma Studio
make studio

# Run migrations
make migrate
```

### 7. Stop Development
```bash
make stop    # Keeps data
make clean   # Deletes all data
```

---

## 🔄 Rebuild Options

### When to rebuild:

**Added new npm package:**
```bash
# Rebuild specific service
docker compose up -d --build auth-service

# Or rebuild all services
make backend  # Automatically rebuilds
```

**Changed Dockerfile:**
```bash
# Rebuild specific service
docker compose up -d --build post-service
```

**Changed Prisma schema:**
```bash
# Run migrations
make migrate

# Or generate initial migrations
make init-migrations
```

**Force rebuild everything:**
```bash
# Stop, clean, and restart
make clean
make backend
```

---

## 📊 Monitoring & Observability

### Service Discovery (Consul)
```bash
open http://localhost:8500
```
- View all registered services
- Check health status
- See service addresses

### Distributed Tracing (Jaeger)
```bash
open http://localhost:16686
```
**Note:** Jaeger is scaffolded but not fully implemented. Tracer is initialized but no spans are created yet.

### Database GUI (Prisma Studio)
```bash
make studio
```
- Auth DB: http://localhost:5555
- Post DB: http://localhost:5556
- Interaction DB: http://localhost:5557

### Debug Utilities
```bash
cd debug
npx tsx view-redis.ts   # View all Redis data
npx tsx view-kafka.ts   # View all Kafka events
npx tsx cleanup.ts      # Clear Redis & Kafka (keeps DBs)
```

### Container Status
```bash
make status
```

### Live Logs
```bash
make logs                          # All services
docker compose logs -f api-gateway # Specific service
```

### Request Tracing
All requests have a unique `x-request-id` header for tracing across services:
```
[API-GATEWAY] [abc-123] --> POST /graphql
[AUTH-SERVICE] [abc-123] --> POST /auth/validate
[POST-SERVICE] [abc-123] --> GET /posts/user/xyz
```

---

## 🧹 Cleanup

### Stop services (keep data)
```bash
make stop
```
Stops all containers but preserves:
- PostgreSQL data
- Redis data
- Kafka topics

### Clear cache & events only
```bash
cd debug
npx tsx cleanup.ts
```
Clears:
- All Redis data (feeds, likes, seen posts)
- All Kafka topics and events
- **Does NOT touch databases**

### Delete everything (including data)
```bash
make clean
```
Deletes:
- All containers
- All volumes (databases, Redis, Kafka)
- All networks
- **Complete reset**

---

## 📚 Getting Started

1. ✅ Run `make backend` to start all services
2. ✅ Open http://localhost:4000/graphql (API Gateway)
3. ✅ Open http://localhost:8500 (Consul UI)
4. ✅ Run `make studio` to view databases
5. ✅ Check `debug/` folder for Redis/Kafka inspection tools
6. ✅ Start coding - changes auto-reload!
7. ✅ Read [Scope-overview.md](../Scope-overview.md) for architecture details

---

## 💡 Tips & Best Practices

- **Hot-reload works for all services** - just save your file and wait 2-3 seconds
- **Use request IDs for debugging** - all logs include `[request-id]` for tracing
- **Check Consul UI** - verify all services are registered and healthy
- **Use debug scripts** - `debug/view-redis.ts` and `debug/view-kafka.ts` are your friends
- **Prisma Studio is powerful** - use `make studio` to inspect/edit database records
- **Rate limiting is active** - 1000 req/15min per IP, 30 mutations/min per user
- **Kafka has dual listeners** - Services use `kafka:9092`, debug scripts use `localhost:9094`
- **Redis keys are prefixed** - `feed:`, `like:`, `seen:`, `rl:` (rate limit)
- **BigInt fields are serialized** - Post counts are converted to Number for JSON
- **Events are logged** - Check logs for Kafka publish/consume confirmations

---

## 📖 Documentation

- **[PROJECT-OVERVIEW.md](../PROJECT-OVERVIEW.md)** - Project goals & feed algorithm
- **[Scope-overview.md](../Scope-overview.md)** - Complete architecture overview
- **[debug/README.md](debug/README.md)** - Debug utilities documentation

---

**Happy coding! 🚀**
