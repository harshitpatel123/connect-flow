# Connect Flow - Social Media Platform with Personalization

A production-grade social media platform demonstrating **event-driven architecture**, **feed personalization algorithms**, and **distributed system patterns** using **Domain-Driven Design (DDD)**.

> **📖 For detailed documentation**, see [PROJECT-OVERVIEW.md](./PROJECT-OVERVIEW.md)

---

## 🌿 Branch Structure

- **`main`** - Microservices Architecture (current branch - independent services with API Gateway)
- **`modular-monolith`** - Modular Monolith Architecture (single deployment unit)

---

## 🎯 What is Connect Flow?

Connect Flow is a **learning-focused social media platform** that implements:

- **Intelligent Feed Personalization** using a three-model approach (Push, Pull, Re-rank)
- **Event-Driven Architecture** with Apache Kafka for async processing
- **Real-time Interactions** with Redis caching and batch processing
- **Interest Tracking** that learns from user behavior
- **Modular Design** ready for microservices migration

---

## 🛠 Tech Stack

**Backend**: Node.js + TypeScript + Apollo GraphQL + PostgreSQL + Redis + Kafka  
**Frontend**: Next.js 14 + Tailwind CSS + Apollo Client  
**Infrastructure**: Docker + Docker Compose + Prisma ORM

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Docker & Docker Compose

### Backend Setup
```bash
cd backend
npm install
docker-compose up -d          # Start PostgreSQL, Redis, Kafka
npx prisma migrate dev        # Run database migrations
npm run dev                   # Start backend server
```
Backend runs on `http://localhost:4000`

### Frontend Setup
```bash
cd frontend
npm install
npm run dev                   # Start frontend
```
Frontend runs on `http://localhost:3000`

---

## 📚 Documentation

For detailed information about the project, see:

- **[PROJECT-OVERVIEW.md](./PROJECT-OVERVIEW.md)** - Complete project documentation
  - Architecture deep dive
  - Feed personalization system (Push, Pull, Re-rank models)
  - Event-driven architecture
  - Data storage strategies
  - Performance optimizations
  - Remaining work and roadmap

- **[Scope-overview.md](./Scope-overview.md)** - Backend architecture principles and scopes of future development

---

## 🎯 Key Features

- ✅ **JWT Authentication** - Secure user registration and login
- ✅ **Post Management** - Create posts with multi-category tagging
- ✅ **Real-time Interactions** - Like, comment, view tracking with Redis caching
- ✅ **Interest Tracking** - Learn user preferences from interactions
- ✅ **Personalized Feed** - Three-model approach (Push, Pull, Re-rank)
- ✅ **Event-Driven** - Kafka-based async processing
- ✅ **Batch Processing** - Efficient DB writes (100x reduction)
- ✅ **High Performance** - Redis caching for sub-millisecond responses

---

## 🏗 Architecture Highlights

### Microservices Architecture (Current Branch)
```
services/
├── auth-service/          # JWT authentication (independent)
├── post-service/          # Post creation & retrieval (independent)
├── interaction-service/   # Likes, comments, views, interests (independent)
├── feed-service/          # Personalized feed generation (independent)
└── api-gateway/           # Central routing & authentication
```

### Event-Driven Design
- **Kafka Topics**: `post-created`, `post-liked`, `post-unliked`, `post-commented`, `user-interests-updated`
- **Event Chaining**: Interest updates trigger feed re-ranking
- **Async Processing**: Non-blocking operations for better UX

### Data Storage
- **PostgreSQL**: Persistent storage (users, posts, likes, comments, interests)
- **Redis**: Hot data (feeds, like counts, view counts, seen posts)
- **Batch Workers**: Process 100 items/second to reduce DB load

---

## 📖 Learning Outcomes

This project demonstrates:
- Event-driven architecture with Kafka
- Feed personalization algorithms
- Redis caching strategies
- Batch processing patterns
- Domain-Driven Design (DDD)
- GraphQL API design
- Real-time UI updates
- Modular monolith → microservices migration path

---

## 🔮 Roadmap

See [PROJECT-OVERVIEW.md](./PROJECT-OVERVIEW.md#-remaining-work) for detailed remaining work.

**Current Focus**:
- Seen penalty implementation
- Follow/unfollow users
- Post edit/delete functionality
- Microservices migration (separate branch)

---

## 👨💻 Author

Built with ❤️ by Harshit Patel

**Purpose**: Learning platform for advanced backend and distributed system concepts
