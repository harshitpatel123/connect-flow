# Connect Flow - Project Overview

A production-grade social media platform demonstrating **event-driven architecture**, **feed personalization**, and **distributed system patterns** using a **Modular Monolith** approach.

---

## 🚀 Quick Setup & Run

### Prerequisites
- Node.js 18+
- Docker & Docker Compose

### Backend Setup
```bash
cd backend

# Install dependencies
npm install

# Start infrastructure (PostgreSQL, Redis, Kafka)
docker-compose up -d

# Setup database
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

Connect Flow is a **learning-focused social media platform** built to practice advanced backend concepts including event-driven architecture, feed personalization algorithms, caching strategies, and distributed system patterns.

### Core Philosophy
- **Modular Monolith** architecture with clear module boundaries
- **Event-driven** communication using Apache Kafka
- **Domain-Driven Design (DDD)** with proper layering
- **Eventual consistency** over strong consistency
- **Performance-first** with Redis caching and batch processing

---

## 🏗 Architecture Overview

### Tech Stack
- **Backend**: Node.js + TypeScript + Apollo GraphQL
- **Database**: PostgreSQL (Prisma ORM)
- **Cache**: Redis (feeds, likes, views)
- **Message Queue**: Apache Kafka
- **Frontend**: Next.js 14 + Tailwind CSS + Apollo Client

### Module Structure
```
modules/
├── auth/          # JWT authentication & user management
├── post/          # Post creation & retrieval
├── interaction/   # Likes, comments, views, interest tracking
└── feed/          # Personalized feed generation & ranking
```

Each module follows **DDD layers**:
- `api/` - GraphQL resolvers & schemas
- `application/` - Use cases (business logic)
- `domain/` - Entities & types
- `infrastructure/` - Repositories & event handlers
- `events/` - Kafka producers & consumers

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
| `post-created` | Post Module | Feed Consumer | Trigger PUSH model |
| `post-liked` | Interaction Module | Interest Consumer | Update user interests |
| `post-unliked` | Interaction Module | Interest Consumer | Update user interests |
| `post-commented` | Interaction Module | Interest Consumer | Update user interests |
| `user-interests-updated` | Interest Consumer | Re-rank Consumer | Trigger feed re-ranking |
| `post-viewed` | Interaction Module | (Analytics only) | Track views |

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

### Redis Data Structures

**1. Feed Storage** (Sorted Set)
```
Key: feed:{userId}
Type: ZSET
Score: Personalized score
Members: Post IDs
```

**2. Like Storage**
```
Key: like:{userId}:{postId}
Type: String
Value: "1"

Key: post:like:count
Type: ZSET
Score: Like count
```

**3. Seen Storage**
```
Key: seen:{userId}
Type: SET
Members: Post IDs
```

### Database Schema (PostgreSQL)

**Core Tables**:
- `users` - User accounts
- `posts` - Post content + category tags
- `post_likes` - Like records
- `comments` - Comment records
- `user_interests` - Affinity scores per category

**Key Indexes**:
- `posts(userId)` - Fast user post lookup
- `user_interests(userId, category)` - Unique constraint + fast lookup

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
- **Header**: Navigation, logout

---

## 📊 Performance Optimizations

### 1. Redis Caching
- Feed retrieval: O(log N) with sorted sets
- Like checks: O(1) with hash lookups
- View tracking: O(1) with set membership

### 2. Batch Processing
- Likes/unlikes batched every 1 second
- Views batched every 1 second
- Reduces database load by **100x**

### 3. Event-Driven Architecture
- Non-blocking post creation
- Async feed building
- Parallel interest tracking and re-ranking

### 4. Graceful Degradation
- Redis failures fall back to DB
- Kafka failures don't block user actions
- Best-effort delivery for non-critical operations

---

## 🔮 Remaining Work

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
- ⏳ Dead Letter Queue (DLQ) for failed events
- ⏳ Retry strategies with exponential backoff
- ⏳ Circuit breakers for external services
- ⏳ Rate limiting per user/IP
- ⏳ Distributed tracing (OpenTelemetry)
- ⏳ Centralized logging (ELK stack)
- ⏳ Metrics collection (Prometheus + Grafana)

### Frontend
- ✅ Authentication pages (DONE)
- ✅ Dashboard with post creation (DONE)
- ✅ Personalized feed (DONE)
- ✅ Interaction history (DONE)
- ⏳ User profile pages
- ⏳ Post detail page
- ⏳ Real-time notifications
- ⏳ Infinite scroll for feed
- ⏳ Image/video upload UI
- ⏳ Search functionality
- ⏳ Dark mode

### Microservices Architecture (Separate Branch)
- ⏳ Extract Auth module into independent service
- ⏳ Extract Post module into independent service
- ⏳ Extract Interaction module into independent service
- ⏳ Extract Feed module into independent service
- ⏳ Implement API Gateway (routing, authentication, rate limiting)
- ⏳ Service-to-service communication (REST/gRPC)
- ⏳ Separate databases per service
- ⏳ Service discovery (Consul/Eureka)
- ⏳ Distributed tracing (Jaeger/Zipkin)
- ⏳ Centralized configuration (Spring Cloud Config/Consul)
- ⏳ Container orchestration (Docker Compose → Kubernetes)
- ⏳ Service mesh (Istio/Linkerd) - optional
- ⏳ Database per service migration strategy
- ⏳ Saga pattern for distributed transactions
- ⏳ Circuit breakers (Resilience4j/Hystrix)

---

## 📝 Notes

### Out of Scope (Not Planned)
The following modules from `architecture-overview.md` are **NOT** being implemented:
- ❌ Chat Module (WebSocket messaging)
- ❌ Notification Module (push notifications)
- ❌ Background Jobs & Scheduler Module (cron jobs)
- ❌ API Gateway & Rate Limiting Module (separate gateway)
- ❌ Observability Module (logging/tracing)
- ❌ Chaos & Resilience Module (fault injection)

**Focus**: Core social media features (Auth, Posts, Interactions, Personalized Feed)

### Key Learning Outcomes
- Event-driven architecture with Kafka
- Feed personalization algorithms
- Redis caching strategies
- Batch processing patterns
- Domain-Driven Design
- GraphQL API design
- Real-time UI updates

---

## 👨‍💻 Author

Built with ❤️ by Harshit Patel

**Purpose**: Learning platform for advanced backend and distributed system concepts
