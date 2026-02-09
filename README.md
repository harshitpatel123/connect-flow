# Connect Flow - Social Media Platform with AI-Powered Personalization

A modern, scalable social media platform built with **Domain-Driven Design (DDD)** and **Modular Monolith Architecture**, featuring an intelligent feed personalization system that learns from user interactions.

> **Note**: This project follows a **Modular Monolith Architecture** for simplicity and ease of development. A **Microservices Architecture** version of this project is available in the `microservices` branch, where each module (Auth, Post, Interaction, Feed) runs as an independent service.

---

## 📋 Table of Contents

- [Project Overview](#-project-overview)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Core Features](#-core-features)
- [Feed Personalization System](#-feed-personalization-system)
- [Data Flow](#-data-flow)
- [Setup & Installation](#-setup--installation)
- [API Documentation](#-api-documentation)

---

## 🎯 Project Overview

Connect Flow is a full-stack social media application that provides users with a personalized content feed based on their interactions. The platform uses a sophisticated three-model approach (Push, Pull, Re-rank) to deliver relevant content while maintaining discovery and freshness.

### Key Highlights

- **Real-time Personalization**: Feed adapts instantly to user preferences
- **Scalable Architecture**: Event-driven design with Kafka for async processing
- **High Performance**: Redis caching for sub-millisecond feed retrieval
- **Smart Discovery**: Balances personalized content with trending posts
- **Category-Based Interests**: Tracks user affinity across multiple content categories

---

## 🛠 Tech Stack

### Backend
- **Runtime**: Node.js with TypeScript
- **API Layer**: Apollo GraphQL Server
- **Database**: PostgreSQL (via Prisma ORM)
- **Cache**: Redis (for feeds, likes, views)
- **Message Queue**: Apache Kafka (event streaming)
- **Authentication**: JWT tokens

### Frontend
- **Framework**: Next.js 14 (React)
- **Styling**: Tailwind CSS
- **State Management**: Apollo Client (GraphQL)
- **UI Components**: Custom components with modern design

### Infrastructure
- **Containerization**: Docker & Docker Compose
- **Database Migrations**: Prisma Migrate
- **Development**: Hot reload for both frontend and backend

---

## 🏗 Architecture

### Modular Monolith Architecture

This project uses a **Modular Monolith** approach, combining the simplicity of a monolithic deployment with the organizational benefits of microservices:

**Benefits**:
- ✅ Single deployment unit (easier to manage)
- ✅ Shared database with transactional consistency
- ✅ Lower operational complexity
- ✅ Easy to migrate to microservices later

**Module Structure**:
```
modules/
├── auth/           # User authentication & authorization
├── post/           # Post creation & management
├── interaction/    # Likes, comments, views, interests
└── feed/           # Feed generation & personalization
```

Each module follows **Domain-Driven Design (DDD)** with:
- **api/**: GraphQL resolvers and schemas
- **application/**: Use cases (business logic)
- **domain/**: Entities and types
- **infrastructure/**: Repositories, event producers/consumers
- **events/**: Kafka event handlers

> **Microservices Version**: A microservices implementation is available in the `microservices` branch, where each module runs as an independent service with its own database and API gateway.

### Event-Driven Architecture

```
┌─────────────┐      ┌─────────┐      ┌──────────────┐
│   Client    │─────▶│ GraphQL │─────▶│   Use Case   │
└─────────────┘      └─────────┘      └──────┬───────┘
                                              │
                                              ▼
                                      ┌───────────────┐
                                      │  Repository   │
                                      └───────┬───────┘
                                              │
                          ┌───────────────────┼───────────────────┐
                          ▼                   ▼                   ▼
                    ┌──────────┐        ┌─────────┐        ┌─────────┐
                    │ Database │        │  Redis  │        │  Kafka  │
                    └──────────┘        └─────────┘        └────┬────┘
                                                                 │
                                                                 ▼
                                                         ┌───────────────┐
                                                         │   Consumers   │
                                                         └───────────────┘
```

---

## ⚡ Core Features

### 1. **User Authentication**
- **Technology**: JWT-based authentication
- **Features**:
  - Secure registration and login
  - Password hashing with bcrypt
  - Token-based session management
  - Protected routes and API endpoints

### 2. **Post Management**
- **Technology**: PostgreSQL + Kafka events
- **Features**:
  - Create posts with content and category tags
  - View user's post history
  - Real-time post statistics (likes, comments, views)
  - Category-based organization

### 3. **Interactions**
- **Technology**: Redis (cache) + PostgreSQL (persistence) + Kafka (events)
- **Features**:
  - **Like/Unlike**: Instant feedback with Redis, batched DB writes
  - **Comments**: Real-time commenting with immediate persistence
  - **Views**: Automatic view tracking with intersection observer
  - **Batch Processing**: Background worker for efficient DB writes

### 4. **Feed Personalization** ⭐
See detailed section below

---

## 🎯 Feed Personalization System

The heart of Connect Flow is its intelligent feed personalization system that uses a **three-model approach** to deliver relevant content.

### The Three Models

#### 1. **PUSH MODEL** (On Post Creation)
**Trigger**: When a new post is created  
**Purpose**: Pre-populate feeds for interested users

**Flow**:
```
Post Created Event
    ↓
Fetch Post Categories
    ↓
Find Users with Affinity ≥ 10 for ANY category
    ↓
Calculate Score: (userAffinity × 10) + (recency × 5)
    ↓
Add to User's Redis Feed (Sorted Set)
```

**Key Points**:
- Only pushes to users who have shown interest (affinity ≥ 10)
- Personalized scoring based on user's category affinity
- Efficient: Doesn't spam all users, only relevant ones

**Implementation**:
- **Consumer**: `feed-event.consumer.ts`
- **Use Case**: `build-feed.usecase.ts`
- **Kafka Topic**: `post-created`

---

#### 2. **PULL MODEL** (On User Request)
**Trigger**: User clicks "Regenerate Feed" button  
**Purpose**: Generate fresh feed with personalization + discovery

**Flow**:
```
User Clicks "Regenerate Feed"
    ↓
Fetch 15 Personalized Posts (from Redis feed)
    ↓
Inject 5 Trending Posts (high engagement, outside user interests, not duplicates)
    ↓
Ensure Minimum 10 Posts (add recent posts if needed)
    ↓
Clear Old Redis Feed
    ↓
Save New Feed to Redis
    ↓
Return Combined Feed
```

**Trending Post Selection**:
- Filters out posts from user's interest categories
- Sorts by engagement score: `(likes × 2) + (comments × 3)`
- Provides discovery of new content categories

**Key Points**:
- Balances personalization (75%) with discovery (25%)
- Guarantees minimum feed size
- User-initiated (not automatic)
- **Clears and updates Redis feed** for persistence

**Implementation**:
- **Use Case**: `regenerate-feed.usecase.ts`
- **GraphQL Mutation**: `regenerateFeed`

---

#### 3. **RE-RANK MODEL** (On Interaction)
**Trigger**: User likes, unlikes, or comments on a post  
**Purpose**: Adapt feed in real-time to changing preferences

**Flow**:
```
User Interacts with Post
    ↓
Update User Interest Scores
    ↓
Fetch Current Feed Posts (top 50)
    ↓
Recalculate Scores with NEW affinity values
    ↓
Re-sort Redis Feed
```

**Key Points**:
- Real-time adaptation to user behavior
- Re-ranks existing feed, doesn't fetch new posts
- Ensures most relevant content surfaces to top

**Implementation**:
- **Consumer**: `rerank-event.consumer.ts`
- **Use Case**: `rerank-feed.usecase.ts`
- **Kafka Topics**: `post-liked`, `post-unliked`, `post-commented`

---

### Interest Tracking System

**Purpose**: Track user affinity for content categories

**Scoring System**:
```
Like:     +5 points
Comment:  +10 points
Unlike:   -5 points
View:     NOT tracked (analytics only)
```

**Database Schema**:
```sql
UserInterest {
  id            UUID
  userId        UUID
  category      String
  affinityScore Float
  lastUpdated   DateTime
}
```

**How It Works**:
1. User interacts with a post (like/comment/unlike)
2. Kafka event fired: `post-liked`, `post-commented`, `post-unliked`
3. Interest consumer fetches post categories
4. For each category, update user's affinity score
5. Trigger feed re-ranking

**Implementation**:
- **Repository**: `interest.repository.ts`
- **Consumer**: `interest-event.consumer.ts`
- **Events**: Fired by `interaction.event.producer.ts`

---

### Feed Scoring Formula

```typescript
// Time-Decay Scoring Formula
const now = Date.now() / 1000; // current time in seconds
const ageInSeconds = now - (postCreatedAt / 1000);
const ageInHours = ageInSeconds / 3600;

const affinityBoost = userCategoryAffinity × 20;
const recencyPenalty = ageInHours × 5;
const finalScore = affinityBoost - recencyPenalty;
```

**Example**:
- User has affinity 10 for "Technology"
- Post is 2 hours old
- Affinity Boost: 10 × 20 = +200
- Recency Penalty: 2 × 5 = -10
- Final Score: 190

**Benefits**:
- User interests have high priority (affinity × 20)
- Recent posts get higher scores (lower penalty)
- Older posts gradually decay (-5 per hour)
- Scores are human-readable (not billions)
- A post with affinity 10 stays relevant for ~40 hours

---

### Kafka Topics

| Topic | Producer | Consumer | Purpose |
|-------|----------|----------|---------|
| `post-created` | Post Module | Feed Consumer | Trigger PUSH model |
| `post-liked` | Interaction Module | Interest Consumer | Update user interests |
| `post-unliked` | Interaction Module | Interest Consumer | Update user interests |
| `post-commented` | Interaction Module | Interest Consumer | Update user interests |
| `user-interests-updated` | Interest Consumer | Re-rank Consumer | Trigger feed re-ranking (event chaining) |
| `post-viewed` | Interaction Module | (Analytics only) | Track views |

**Event Chaining**: To avoid race conditions, the re-rank consumer listens to `user-interests-updated` (fired AFTER interest updates complete) instead of direct interaction events. This guarantees feed re-ranking always uses the latest affinity scores.

---

### Redis Data Structures

#### 1. **Feed Storage** (Sorted Set)
```
Key: feed:{userId}
Type: ZSET (Sorted Set)
Score: Personalized score
Members: Post IDs

Example:
feed:user-123 = {
  "post-abc": 8530000000150,
  "post-def": 8530000000120,
  "post-ghi": 8530000000090
}
```

#### 2. **Like Storage**
```
Key: like:{userId}:{postId}
Type: String
Value: "1"

Key: post:like:count
Type: ZSET
Score: Like count
Members: Post IDs
```

#### 3. **Seen Storage**
```
Key: seen:{userId}
Type: SET
Members: Post IDs user has viewed
```

---

## 🔄 Data Flow

### Complete Flow: Post Creation to Personalized Feed

```
1. USER CREATES POST
   ↓
2. POST SAVED TO DATABASE
   ↓
3. KAFKA EVENT: post-created
   ↓
4. FEED CONSUMER (PUSH MODEL)
   ├─ Fetch post categories
   ├─ Find users with affinity ≥ 10
   ├─ Calculate personalized scores
   └─ Add to Redis feeds
   ↓
5. USER VIEWS FEED
   ├─ Fetch from Redis (fast)
   └─ Hydrate with post details from DB
   ↓
6. USER LIKES POST
   ↓
7. KAFKA EVENTS: post-liked
   ↓
8. EVENT CHAINING:
   ├─ INTEREST CONSUMER
   │  ├─ Fetch post categories
   │  ├─ Update user affinity (+5 per category)
   │  └─ Fire event: user-interests-updated
   │
   └─ RE-RANK CONSUMER (listens to user-interests-updated)
      ├─ Fetch current feed
      ├─ Recalculate scores with NEW affinity
      └─ Re-sort Redis feed
   ↓
9. FEED NOW REFLECTS USER'S UPDATED PREFERENCES
```

---

## 🚀 Setup & Installation

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- PostgreSQL (via Docker)
- Redis (via Docker)
- Kafka (via Docker)

### Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit .env with your configuration

# Start infrastructure (PostgreSQL, Redis, Kafka)
docker-compose up -d

# Run database migrations
npx prisma migrate dev

# Start backend server
npm run dev
```

The backend will start on `http://localhost:4000`

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit .env with backend URL

# Start frontend
npm run dev
```

The frontend will start on `http://localhost:3000`

---

## 📡 API Documentation

### GraphQL Endpoint
```
http://localhost:4000/graphql
```

### Key Mutations

#### Authentication
```graphql
mutation Register {
  register(email: "user@example.com", password: "password123") {
    token
    user {
      id
      email
    }
  }
}

mutation Login {
  login(email: "user@example.com", password: "password123") {
    token
    user {
      id
      email
    }
  }
}
```

#### Posts
```graphql
mutation CreatePost {
  createPost(
    content: "Hello World!"
    categoryTags: ["Technology", "Programming"]
  ) {
    id
    content
    categoryTags
    createdAt
  }
}
```

#### Interactions
```graphql
mutation LikePost {
  likePost(postId: "post-id-here")
}

mutation UnlikePost {
  unlikePost(postId: "post-id-here")
}

mutation CommentPost {
  commentPost(postId: "post-id-here", content: "Great post!")
}
```

#### Feed
```graphql
query MyFeed {
  myFeed {
    id
    content
    categoryTags
    likeCount
    commentCount
    viewCount
    isLiked
    createdAt
    user {
      email
    }
  }
}

mutation RegenerateFeed {
  regenerateFeed {
    id
    content
    categoryTags
    likeCount
    commentCount
    viewCount
    isLiked
    createdAt
    user {
      email
    }
  }
}
```

---

## 🎨 Frontend Features

### Pages

1. **Authentication** (`/auth`)
   - Login and registration forms
   - JWT token management
   - Automatic redirect on auth

2. **Feed** (`/feed`)
   - Personalized post feed
   - "Regenerate Feed" button (PULL MODEL)
   - Infinite scroll (future)
   - Real-time interaction updates

3. **Dashboard** (`/dashboard`)
   - Create new posts
   - Category tag selection
   - Post preview

4. **History** (`/history`)
   - User's post history
   - Post statistics
   - Edit/delete posts (future)

### Components

- **PostCard**: Displays post with interactions
  - Like/Unlike button
  - Comment section
  - View tracking (70% visibility threshold)
  - Category tags
  - User info

- **CreatePostPopup**: Modal for creating posts
  - Rich text input
  - Category selection
  - Character limit

- **Header**: Navigation bar
  - User profile
  - Logout
  - Page navigation

---

## 📊 Performance Optimizations

### 1. **Redis Caching**
- Feed retrieval: O(log N) with sorted sets
- Like checks: O(1) with hash lookups
- View tracking: O(1) with set membership

### 2. **Batch Processing**
- Likes/unlikes batched every 1 second
- Views batched every 1 second
- Reduces database load by 100x

### 3. **Event-Driven Architecture**
- Non-blocking post creation
- Async feed building
- Parallel interest tracking and re-ranking

### 4. **Database Indexing**
```sql
-- Prisma schema indexes
@@index([userId])        -- Fast user post lookup
@@index([postId])        -- Fast post interaction lookup
@@unique([userId, category])  -- Fast interest lookup
```

---

## 🔮 Future Enhancements

### Planned Features
- [ ] Seen penalty implementation (50% score reduction)
- [ ] Follow/unfollow users
- [ ] Hashtag support
- [ ] Image/video posts
- [ ] Real-time notifications
- [ ] Post sharing
- [ ] User profiles
- [ ] Search functionality
- [ ] Trending topics page
- [ ] Analytics dashboard

### Scalability Improvements
- [ ] Kafka partitioning for parallel processing
- [ ] Redis cluster for horizontal scaling
- [ ] Database read replicas
- [ ] CDN for static assets
- [ ] GraphQL query optimization
- [ ] Caching layer for post hydration

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

## 👨‍💻 Author

Built with ❤️ by the Connect Flow team

---

## 🙏 Acknowledgments

- **Domain-Driven Design** principles by Eric Evans
- **Event Sourcing** patterns by Martin Fowler
- **Feed Ranking Algorithms** inspired by major social platforms
- **Redis** for blazing-fast caching
- **Kafka** for reliable event streaming
- **Prisma** for type-safe database access

---

**Happy Coding! 🚀**
