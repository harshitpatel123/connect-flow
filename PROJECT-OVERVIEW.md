# Connect Flow - Project Overview

A **production-grade social media platform** demonstrating advanced backend engineering concepts through **microservices architecture**, **event-driven design**, **feed personalization algorithms**, and **distributed system patterns**.

> **Architecture Evolution**: Started as a **Modular Monolith** (see `modular-monolith` branch), then migrated to **Microservices** (current `main` branch) to demonstrate real-world architectural transformation.

---

## 🎯 Implemented Concepts

### Architecture & Design Patterns
- ✅ **Microservices Architecture** - 5 independent services with API Gateway
- ✅ **Modular Monolith** - Initial implementation with clear boundaries (separate branch)
- ✅ **Domain-Driven Design (DDD)** - Layered architecture (API, Application, Domain, Infrastructure)
- ✅ **Event-Driven Architecture** - Kafka-based async communication with 6 topics
- ✅ **Event Chaining Pattern** - Cascading events for complex workflows
- ✅ **Database per Service** - Complete data isolation across microservices
- ✅ **API Gateway Pattern** - Centralized routing, authentication, and rate limiting

### Distributed Systems
- ✅ **Service Discovery** - Consul-based registration and health checks
- ✅ **Distributed Tracing** - Jaeger integration (scaffolded)
- ✅ **Request ID Propagation** - Cross-service tracing with unique IDs
- ✅ **Graceful Shutdown** - Proper cleanup and deregistration
- ✅ **Health Checks** - All services expose health endpoints

### Performance & Scalability
- ✅ **Redis Caching** - Multi-level caching (feeds, likes, views, rate limits)
- ✅ **Batch Processing** - 100x DB load reduction with batched writes
- ✅ **Rate Limiting** - IP-based (1000/15min) + User-based (30 mutations/min, 100 queries/min)
- ✅ **Redis-Backed Rate Limiting** - Distributed rate limiting across instances
- ✅ **Sorted Sets for Feeds** - O(log N) feed retrieval with scoring
- ✅ **Eventual Consistency** - Async processing for non-critical operations

### Message Queue & Events
- ✅ **Apache Kafka** - Event streaming with dual listeners (internal + external)
- ✅ **Producer-Consumer Pattern** - 6 Kafka topics with multiple consumers
- ✅ **Event Sourcing** - All interactions tracked as events
- ✅ **Async Processing** - Non-blocking operations for better UX

### Observability & Monitoring
- ✅ **Comprehensive Logging** - Request ID tracking, service prefixes, duration timing
- ✅ **Structured Logging** - Consistent log format across all services
- ✅ **Event Logging** - Kafka publish/consume confirmations
- ✅ **Redis Operation Logging** - Cache hit/miss tracking
- ✅ **Error Tracking** - Detailed 404 and error logging

### Security & Reliability
- ✅ **JWT Authentication** - Stateless token-based auth
- ✅ **Password Hashing** - Bcrypt with salt
- ✅ **Protected Endpoints** - Middleware-based authorization
- ✅ **Rate Limiting** - DDoS protection and abuse prevention
- ✅ **Input Validation** - GraphQL schema validation

### Data Management
- ✅ **PostgreSQL** - 3 separate databases (auth, post, interaction)
- ✅ **Prisma ORM** - Type-safe database access
- ✅ **Database Migrations** - Automated migration on startup
- ✅ **BigInt Serialization** - Proper handling of large numbers
- ✅ **Indexing Strategy** - Optimized queries with proper indexes

### DevOps & Infrastructure
- ✅ **Docker Containerization** - All services containerized
- ✅ **Docker Compose** - Multi-container orchestration
- ✅ **Hot-Reload Development** - Live code reloading in containers
- ✅ **Volume Mounting** - Persistent data and code sync
- ✅ **Health Checks** - Container-level health monitoring
- ✅ **Makefile Automation** - One-command setup and deployment

### Feed Personalization (Core Feature)
- ✅ **Three-Model Approach** - Push, Pull, Re-rank models
- ✅ **Interest Tracking** - User affinity scoring per category
- ✅ **Time-Decay Algorithm** - Recency-based feed ranking
- ✅ **Discovery Injection** - Trending posts for content discovery
- ✅ **Real-time Adaptation** - Feed re-ranking on user interactions

### Development Tools
- ✅ **Debug Utilities** - Redis/Kafka inspection scripts
- ✅ **Prisma Studio** - Database GUI on multiple ports
- ✅ **GraphQL Playground** - API testing interface
- ✅ **Cleanup Scripts** - Selective data clearing

---

## 🏗️ Architecture Evolution

### Phase 1: Modular Monolith (Branch: `modular-monolith`)
**Why Start Here?**
- Faster initial development
- Clear module boundaries from day one
- Single deployment unit
- Easier debugging and testing

**Structure:**
```
backend/
├── modules/
│   ├── auth/          # JWT authentication
│   ├── post/          # Post management
│   ├── interaction/   # Likes, comments, views
│   └── feed/          # Personalized feeds
├── shared/            # Common utilities
└── server.ts          # Single entry point
```

**Key Characteristics:**
- Single codebase, single deployment
- Internal event bus (Kafka)
- Shared database (with logical separation)
- Module-to-module communication via function calls

---

### Phase 2: Microservices (Branch: `main` - Current)
**Why Migrate?**
- Independent scaling per service
- Technology diversity (different languages/frameworks per service)
- Fault isolation (one service failure doesn't crash entire system)
- Team autonomy (different teams own different services)

**Structure:**
```
backend/
├── services/
│   ├── auth-service/          # Port 5001 | Auth DB
│   ├── post-service/          # Port 5002 | Post DB
│   ├── interaction-service/   # Port 5003 | Interaction DB
│   ├── feed-service/          # Port 5004 | Redis only
│   └── api-gateway/           # Port 4000 | GraphQL endpoint
└── docker-compose.yml         # Orchestration
```

**Key Characteristics:**
- 5 independent services
- Database per service
- REST communication between services
- GraphQL at API Gateway
- Kafka for async events
- Consul for service discovery

**Migration Strategy:**
1. Identified module boundaries (already clear in monolith)
2. Extracted each module into separate service
3. Created dedicated databases per service
4. Implemented API Gateway for routing
5. Added service discovery (Consul)
6. Maintained Kafka for events (no change needed)

---

## 🚀 Quick Setup & Run

### Prerequisites
- Node.js 18+
- Docker & Docker Compose

### Microservices Backend (Current - `main` branch)
```bash
cd backend

# Start all services (auto-migration included)
make start

# View logs
make logs

# Open Prisma Studio
make studio
```
Backend runs on `http://localhost:4000/graphql`

### Modular Monolith Backend (Legacy - `modular-monolith` branch)
```bash
git checkout modular-monolith
cd backend

# Install dependencies
npm install

# Start infrastructure
docker-compose up -d

# Run migrations
npx prisma migrate dev

# Start server
npm run dev
```
Backend runs on `http://localhost:4000`

### Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start frontend
npm run dev
```
Frontend runs on `http://localhost:3000`

---

## 📋 Project Summary

Connect Flow is a **production-grade social media platform** built to demonstrate advanced backend engineering and distributed systems concepts. The project showcases a complete architectural evolution from **Modular Monolith** to **Microservices**, implementing industry-standard patterns for scalability, reliability, and performance.

### Core Philosophy
- **Architecture Evolution** - Modular Monolith → Microservices migration
- **Event-Driven** - Kafka-based async communication with 6 topics
- **Domain-Driven Design (DDD)** - Proper layering and bounded contexts
- **Eventual Consistency** - Async processing for non-critical operations
- **Performance-First** - Redis caching, batch processing, rate limiting
- **Production-Ready** - Logging, monitoring, health checks, graceful shutdown

---

## 🏗 Architecture Overview

### Current Tech Stack (Microservices)
- **Backend**: Node.js + TypeScript + Apollo GraphQL
- **Databases**: PostgreSQL × 3 (auth, post, interaction) + Prisma ORM
- **Cache**: Redis (feeds, likes, views, rate limits, seen posts)
- **Message Queue**: Apache Kafka (6 topics, dual listeners)
- **Service Discovery**: Consul (health checks, registration)
- **Tracing**: Jaeger (scaffolded)
- **Frontend**: Next.js 14 + Tailwind CSS + Apollo Client
- **Infrastructure**: Docker + Docker Compose

### Microservices Structure
```
services/
├── auth-service/          # JWT authentication (Port 5001)
│   ├── Auth DB (PostgreSQL)
│   └── User management
├── post-service/          # Post management (Port 5002)
│   ├── Post DB (PostgreSQL)
│   └── Kafka producer (post-created)
├── interaction-service/   # Interactions (Port 5003)
│   ├── Interaction DB (PostgreSQL)
│   ├── Redis (likes, views)
│   ├── Batch workers
│   └── Kafka producer (post-liked, post-unliked, post-commented, post-viewed)
├── feed-service/          # Personalized feeds (Port 5004)
│   ├── Redis (feeds, seen posts)
│   ├── Kafka consumer (post-created, user-interests-updated)
│   └── Feed algorithms (Push, Pull, Re-rank)
└── api-gateway/           # GraphQL endpoint (Port 4000)
    ├── Rate limiting (Redis-backed)
    ├── Authentication middleware
    ├── Request logging
    └── Service routing
```

Each service follows **DDD layers**:
- `api/` - REST endpoints (Express) or GraphQL resolvers
- `application/` - Use cases (business logic)
- `domain/` - Entities & types
- `infrastructure/` - Repositories & external integrations
- `events/` - Kafka producers & consumers
- `middleware/` - Logging, error handling

### Service Communication

**Synchronous (REST):**
```
API Gateway → Auth Service (validate token)
API Gateway → Post Service (get posts)
API Gateway → Interaction Service (like post)
API Gateway → Feed Service (get feed)
Feed Service → Post Service (fetch post details)
Feed Service → Interaction Service (get user interests)
```

**Asynchronous (Kafka):**
```
Post Service → post-created → Feed Service
Interaction Service → post-liked → Interaction Service (interest update)
Interaction Service → user-interests-updated → Feed Service (re-rank)
```

### Production Features Implemented

**Logging & Monitoring:**
- Request ID tracking across all services
- Service-prefixed logs ([AUTH-SERVICE], [POST-SERVICE], etc.)
- Duration timing for all requests
- Status code emojis (✅/❌)
- Detailed 404 error messages
- Kafka event logging (publish/consume confirmations)
- Redis operation logging (cache hits/misses)

**Rate Limiting:**
- Global IP-based: 1000 req/15min (DDoS protection)
- Mutation rate: 30/min per user
- Query rate: 100/min per user
- Redis-backed (distributed across instances)
- RFC-compliant headers (RateLimit-Limit, RateLimit-Remaining, Retry-After)
- Health check exclusion

**Reliability:**
- Graceful shutdown with Consul deregistration
- Health checks for all services
- Batch processing (100x DB load reduction)
- Graceful degradation (Redis/Kafka failures don't block users)
- BigInt serialization for JSON responses

**Developer Experience:**
- Hot-reload for all services (2-3 second restart)
- Debug utilities (view-redis.ts, view-kafka.ts, cleanup.ts)
- Prisma Studio on ports 5555-5557
- One-command setup (make start)
- Comprehensive README documentation

---

## ⚡ Core Features

### 1. Authentication & User Management
- JWT-based stateless authentication
- Secure password hashing (bcrypt)
- Token-based session management
- Protected GraphQL endpoints

### 2. Post Management
- Create posts with multi-category tagging
- View user post history with statistics
- Real-time engagement metrics (likes, comments, views)
- Event-driven post creation (non-blocking)

### 3. Interaction System
- **Like/Unlike**: Instant Redis feedback + batched DB writes
- **Comments**: Real-time commenting with immediate persistence
- **Views**: Automatic tracking via Intersection Observer (70% visibility)
- **Batch Worker**: Processes 100 items/second to reduce DB load

### 4. Interest Tracking
- Tracks user affinity for content categories
- **Scoring**: Like +5, Comment +10, Unlike -5
- Stores in `UserInterest` table (userId, category, affinityScore)
- Powers feed personalization

### 5. Personalized Feed System ⭐
The core feature implementing a **three-model approach** for intelligent content delivery.

---

## 🎯 Feed Personalization System

### Three-Model Architecture

#### **1. PUSH MODEL** (Post Creation)
**When**: New post is created  
**What**: Pre-populate feeds for interested users

**Flow**:
```
Post Created → Kafka Event → Feed Consumer
  ↓
Fetch Post Categories
  ↓
Find Users with Affinity ≥ 10 for ANY Category
  ↓
Calculate Score: (userAffinity × 20) - (ageInHours × 5)
  ↓
Add to User's Redis Feed (Sorted Set)
```

**Key Points**:
- Only pushes to users with demonstrated interest
- Personalized scoring per user
- Non-blocking, async processing

---

#### **2. PULL MODEL** (User Request)
**When**: User clicks "Regenerate Feed" button  
**What**: Generate fresh feed with personalization + discovery

**Flow**:
```
User Clicks Regenerate
  ↓
Fetch 15 Personalized Posts (from Redis)
  ↓
Inject 5 Trending Posts (high engagement, outside user interests)
  ↓
Ensure Minimum 10 Posts (add recent if needed)
  ↓
Clear Old Feed → Save New Feed to Redis
  ↓
Return Combined Feed
```

**Key Points**:
- Balances personalization (75%) with discovery (25%)
- Trending posts filtered by engagement: `(likes × 2) + (comments × 3)`
- User-initiated, not automatic

---

#### **3. RE-RANK MODEL** (Real-time Adaptation)
**When**: User interacts (like/unlike/comment)  
**What**: Adapt feed to changing preferences

**Flow**:
```
User Interacts → Kafka Event → Interest Consumer
  ↓
Update User Affinity Scores
  ↓
Fire "user-interests-updated" Event (Event Chaining)
  ↓
Re-rank Consumer Triggered
  ↓
Fetch Current Feed (top 50 posts)
  ↓
Recalculate Scores with NEW Affinity
  ↓
Re-sort Redis Feed
```

**Key Points**:
- Real-time feed adaptation
- Event chaining prevents race conditions
- Re-ranks existing feed, doesn't fetch new posts

---

### Feed Scoring Formula

```typescript
// Time-Decay Scoring
const now = Date.now() / 1000;
const ageInHours = (now - postCreatedAt / 1000) / 3600;

const affinityBoost = userCategoryAffinity × 20;
const recencyPenalty = ageInHours × 5;
const finalScore = affinityBoost - recencyPenalty;
```

**Example**:
- User affinity: 10 for "Technology"
- Post age: 2 hours
- Score: (10 × 20) - (2 × 5) = 190

**Benefits**:
- User interests prioritized (×20 multiplier)
- Recent posts favored (lower penalty)
- Gradual decay (-5 per hour)
- Post with affinity 10 stays relevant ~40 hours

---

## 🔄 Event-Driven Architecture

### Kafka Topics & Event Flow

| Topic | Producer | Consumer | Purpose |
|-------|----------|----------|---------|
| `post-created` | Post Service | Feed Service | Trigger PUSH model |
| `post-liked` | Interaction Service | Interaction Service | Update user interests |
| `post-unliked` | Interaction Service | Interaction Service | Update user interests |
| `post-commented` | Interaction Service | Interaction Service | Update user interests |
| `user-interests-updated` | Interaction Service | Feed Service | Trigger feed re-ranking |
| `post-viewed` | Interaction Service | (Analytics only) | Track views |

### Event Chaining Pattern
```
User Likes Post
  ↓
Kafka: post-liked
  ↓
Interest Consumer: Update affinity (+5)
  ↓
Kafka: user-interests-updated
  ↓
Re-rank Consumer: Recalculate feed scores
  ↓
Feed Updated with New Preferences
```

**Why Event Chaining?**  
Re-rank consumer listens to `user-interests-updated` (not direct interactions) to ensure it always uses the **latest affinity scores**, avoiding race conditions.

---

## 💾 Data Storage Strategy

### Database per Service (Microservices)

**Auth Service DB (Port 5432):**
- `users` - User accounts with hashed passwords

**Post Service DB (Port 5433):**
- `posts` - Post content, category tags, engagement counts
- Index: `posts(userId)` for fast user post lookup

**Interaction Service DB (Port 5434):**
- `post_likes` - Like records with unique constraint
- `comments` - Comment records
- `user_interests` - Affinity scores per category
- Indexes: `post_likes(userId, postId)`, `user_interests(userId, category)`

**Feed Service:**
- No database (Redis only)

### Redis Data Structures (Shared)

**1. Feed Storage** (Sorted Set)
```
Key: feed:{userId}
Type: ZSET
Score: Personalized score (affinity × 20 - age × 5)
Members: Post IDs
TTL: 7 days
```

**2. Like Storage**
```
Key: like:{userId}:{postId}
Type: String
Value: "1"
TTL: 30 days

Key: post:like:count
Type: ZSET
Score: Like count
Members: Post IDs
```

**3. Seen Storage**
```
Key: seen:{userId}
Type: SET
Members: Post IDs
TTL: 30 days
```

**4. Rate Limiting**
```
Key: rl:global:{ip}
Key: rl:mutation:{userId}
Key: rl:query:{userId}
Type: String (counter)
TTL: Window duration (15min or 1min)
```

---

## 🎨 Frontend Features

### Pages
1. **Login/Signup** (`/auth/login`, `/auth/signup`)
   - JWT authentication
   - Form validation

2. **Dashboard** (`/dashboard`)
   - Create posts with category selection
   - View post statistics
   - User profile card

3. **Feed** (`/feed`)
   - Personalized post feed
   - "Regenerate Feed" button (PULL MODEL)
   - Real-time interaction updates

4. **History** (`/history`)
   - Liked posts tab
   - Commented posts tab
   - Interaction history

### Key Components
- **PostCard**: Like/unlike, comment, view tracking (70% visibility)
- **CreatePostPopup**: Multi-select categories, content input
- **Header**: Navigation, user email display, logout

---

## 📊 Performance Optimizations

### 1. Redis Caching
- Feed retrieval: O(log N) with sorted sets
- Like checks: O(1) with string keys
- View tracking: O(1) with set membership
- Rate limiting: O(1) with counters
- Multi-level caching (feeds, likes, views, rate limits)

### 2. Batch Processing
- Likes/unlikes batched every 1 second (100 items/batch)
- Views batched every 1 second (100 items/batch)
- Reduces database load by **100x**
- Separate batch workers per operation type

### 3. Event-Driven Architecture
- Non-blocking post creation (user doesn't wait for feed updates)
- Async feed building (parallel processing)
- Parallel interest tracking and re-ranking
- Event chaining for complex workflows

### 4. Database Optimization
- Proper indexing on frequently queried columns
- Unique constraints to prevent duplicates
- BigInt for large counters (view counts)
- Connection pooling via Prisma

### 5. Graceful Degradation
- Redis failures fall back to DB
- Kafka failures don't block user actions
- Best-effort delivery for non-critical operations
- Rate limiting fails open (allows requests if Redis down)

### 6. Microservices Benefits
- Independent scaling per service
- Feed service can scale horizontally (stateless)
- Interaction service handles high write load
- Database per service prevents bottlenecks

---

## 🔮 Remaining Work

### Microservices Enhancements
- ✅ Service extraction (DONE)
- ✅ API Gateway (DONE)
- ✅ Service discovery (DONE)
- ✅ Rate limiting (DONE)
- ✅ Comprehensive logging (DONE)
- ⏳ Circuit breaker pattern (documented in Scope-overview.md)
- ⏳ Dead Letter Queue (documented in Scope-overview.md)
- ⏳ Full distributed tracing (Jaeger spans)
- ⏳ Metrics collection (Prometheus + Grafana)
- ⏳ Kubernetes deployment
- ⏳ Service mesh (Istio/Linkerd)

### Auth Module
- ✅ JWT authentication (DONE)
- ✅ User registration/login (DONE)
- ⏳ Refresh token rotation
- ⏳ Password reset flow
- ⏳ Email verification

### Post Module
- ✅ Create posts with categories (DONE)
- ✅ Fetch user posts (DONE)
- ✅ Fetch posts by IDs (DONE)
- ⏳ Edit post functionality
- ⏳ Delete post functionality
- ⏳ Post media upload (images/videos)
- ⏳ Post search functionality

### Interaction Module
- ✅ Like/unlike posts (DONE)
- ✅ Comment on posts (DONE)
- ✅ View tracking (DONE)
- ✅ Interest tracking (DONE)
- ✅ Batch processing worker (DONE)
- ⏳ Edit/delete comments
- ⏳ Nested comments (replies)
- ⏳ Comment reactions

### Feed Module
- ✅ PUSH model (DONE)
- ✅ PULL model (DONE)
- ✅ RE-RANK model (DONE)
- ✅ Interest-based scoring (DONE)
- ⏳ Seen penalty implementation (reduce score by 50% for seen posts)
- ⏳ Follow/unfollow users
- ⏳ Follower-based feed (in addition to interest-based)
- ⏳ Hashtag support
- ⏳ Trending topics page
- ⏳ Feed pagination (infinite scroll)

### Infrastructure
- ✅ Kafka event streaming (DONE)
- ✅ Redis caching (DONE)
- ✅ Batch workers (DONE)
- ✅ Rate limiting (DONE)
- ✅ Request logging (DONE)
- ✅ Service discovery (DONE)
- ⏳ Dead Letter Queue (DLQ) for failed events
- ⏳ Retry strategies with exponential backoff
- ⏳ Circuit breakers for external services
- ⏳ Full distributed tracing (Jaeger spans)
- ⏳ Centralized logging (ELK stack)
- ⏳ Metrics collection (Prometheus + Grafana)

### Frontend
- ✅ Authentication pages (DONE)
- ✅ Dashboard with post creation (DONE)
- ✅ Personalized feed (DONE)
- ✅ Interaction history (DONE)
- ✅ User email in header (DONE)
- ⏳ User profile pages
- ⏳ Post detail page
- ⏳ Real-time notifications
- ⏳ Infinite scroll for feed
- ⏳ Image/video upload UI
- ⏳ Search functionality
- ⏳ Dark mode

---

## 📝 Notes

### Branch Structure
- **`main`** - Microservices architecture (current - production-ready)
- **`modular-monolith`** - Modular monolith architecture (legacy - learning reference)

### Out of Scope (Not Planned)
The following modules from `Scope-overview.md` are **NOT** being implemented:
- ❌ Chat Module (WebSocket messaging)
- ❌ Notification Module (push notifications)
- ❌ Background Jobs & Scheduler Module (cron jobs)
- ❌ Observability Module (full ELK stack)
- ❌ Chaos & Resilience Module (fault injection)

**Focus**: Core social media features + Microservices architecture + Production patterns

### Key Learning Outcomes
- Microservices architecture and migration strategy
- Event-driven architecture with Kafka
- Feed personalization algorithms
- Redis caching strategies (multi-level)
- Batch processing patterns
- Rate limiting (distributed)
- Domain-Driven Design
- GraphQL API design
- Service discovery and health checks
- Request tracing across services
- Docker containerization and orchestration
- Real-time UI updates

---

## 👨💻 Author

Built with ❤️ by Harshit Patel

**Purpose**: Production-grade learning platform for advanced backend engineering and distributed system concepts
