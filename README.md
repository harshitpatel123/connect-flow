# Connect Flow

> **Production-grade social media platform** showcasing **Microservices Architecture**, **Event-Driven Design**, **Feed Personalization**, and **Distributed System Patterns**.

[![Architecture](https://img.shields.io/badge/Architecture-Microservices-blue)](./PROJECT-OVERVIEW.md)
[![Backend](https://img.shields.io/badge/Backend-Node.js%20%2B%20TypeScript-green)](./backend)
[![Frontend](https://img.shields.io/badge/Frontend-Next.js%2014-black)](./frontend)
[![Database](https://img.shields.io/badge/Database-PostgreSQL-blue)](./backend)
[![Cache](https://img.shields.io/badge/Cache-Redis-red)](./backend)
[![Queue](https://img.shields.io/badge/Queue-Apache%20Kafka-orange)](./backend)

---

## 🎯 What is Connect Flow?

A **full-stack social media platform** demonstrating real-world backend engineering practices through:

- **Microservices Architecture** - 5 independent services with API Gateway
- **Event-Driven Design** - Kafka-based async communication (6 topics)
- **Intelligent Feed Personalization** - Three-model approach (Push, Pull, Re-rank)
- **Production Patterns** - Rate limiting, caching, batch processing, service discovery

> **Architecture Evolution**: Built first as a **Modular Monolith** ([`modular-monolith`](https://github.com/yourusername/connect-flow/tree/modular-monolith) branch), then migrated to **Microservices** ([`main`](https://github.com/yourusername/connect-flow) branch) to demonstrate real-world architectural transformation.

---

## 🌿 Branch Structure

| Branch | Description | Status |
|--------|-------------|--------|
| [`main`](https://github.com/yourusername/connect-flow) | Microservices Architecture | ✅ Current |
| [`modular-monolith`](https://github.com/yourusername/connect-flow/tree/modular-monolith) | Modular Monolith Architecture | 📦 Legacy |

---

## ⚡ Key Features

### Architecture & Scalability
- 🏗️ **Microservices** - 5 services, database per service, API Gateway
- 📡 **Event-Driven** - Apache Kafka with 6 topics, event chaining pattern
- 🔍 **Service Discovery** - Consul-based health checks & registration
- 🛡️ **Rate Limiting** - IP-based (1000/15min) + User-based (30 mutations/min)

### Performance & Caching
- ⚡ **Redis Caching** - Multi-level (feeds, likes, views, rate limits)
- 📦 **Batch Processing** - 100x DB load reduction with batched writes
- 🎯 **Feed Scoring** - O(log N) retrieval with sorted sets
- 🔄 **Eventual Consistency** - Async processing for non-critical ops

### Observability & Reliability
- 📊 **Comprehensive Logging** - Request ID tracking across services
- 🔧 **Graceful Shutdown** - Proper cleanup & deregistration
- 🏥 **Health Checks** - All services expose health endpoints
- 🔍 **Distributed Tracing** - Jaeger integration (scaffolded)

### Feed Personalization (Core Feature)
- 🎨 **Push Model** - Pre-populate feeds on post creation
- 🔄 **Pull Model** - On-demand feed generation with discovery
- 🎯 **Re-rank Model** - Real-time adaptation to user interactions
- 📈 **Interest Tracking** - User affinity scoring per category

---

## 🛠 Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Backend** | Node.js, TypeScript, Apollo GraphQL, Express |
| **Databases** | PostgreSQL × 3 (auth, post, interaction) |
| **Cache** | Redis (feeds, likes, views, rate limits) |
| **Message Queue** | Apache Kafka (6 topics, dual listeners) |
| **Service Discovery** | Consul |
| **Tracing** | Jaeger (scaffolded) |
| **Frontend** | Next.js 14, Tailwind CSS, Apollo Client |
| **ORM** | Prisma |
| **Infrastructure** | Docker, Docker Compose |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Docker & Docker Compose

### Microservices Backend (Current)
```bash
cd backend
make start              # Starts all services with auto-migration
```
- **API Gateway**: http://localhost:4000/graphql
- **Consul UI**: http://localhost:8500
- **Jaeger UI**: http://localhost:16686

### Frontend
```bash
cd frontend
npm install
npm run dev
```
- **Frontend**: http://localhost:3000

### Modular Monolith (Legacy)
```bash
git checkout modular-monolith
cd backend
npm install
docker-compose up -d
npx prisma migrate dev
npm run dev
```

---

## 🏗️ Architecture

### Microservices Structure
```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Port 3000)                      │
│                   Next.js + Apollo Client                    │
└──────────────────────────┬──────────────────────────────────┘
                           │ GraphQL
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                 API Gateway (Port 4000)                      │
│   GraphQL | Rate Limiting | Auth | Request Logging          │
└──────────────────────────┬──────────────────────────────────┘
                           │ REST
        ┌──────────────────┼──────────────────┬───────────────┐
        ▼                  ▼                  ▼               ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Auth Service │  │ Post Service │  │ Interaction  │  │ Feed Service │
│  (Port 5001) │  │  (Port 5002) │  │  (Port 5003) │  │  (Port 5004) │
│   Auth DB    │  │   Post DB    │  │ Interaction  │  │ Redis Feeds  │
│              │  │   + Kafka    │  │ DB + Redis   │  │   + Kafka    │
└──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘

┌─────────────────────────────────────────────────────────────┐
│              Shared Infrastructure                           │
│  Kafka (9092/9094) | Redis (6379) | Consul (8500)           │
└─────────────────────────────────────────────────────────────┘
```

### Event Flow
```
User creates post → Post Service → Kafka (post-created)
                                      ↓
                            Feed Service consumes event
                                      ↓
                            Adds to qualified users' feeds

User likes post → Interaction Service → Kafka (post-liked)
                                           ↓
                                  Updates user interests
                                           ↓
                            Kafka (user-interests-updated)
                                           ↓
                            Feed Service re-ranks feeds
```

---

## 📊 Implemented Concepts

<details>
<summary><b>Click to expand - 50+ Production Concepts</b></summary>

### Architecture Patterns
- Microservices Architecture
- Modular Monolith
- Domain-Driven Design (DDD)
- Event-Driven Architecture
- Event Chaining Pattern
- Database per Service
- API Gateway Pattern

### Distributed Systems
- Service Discovery (Consul)
- Distributed Tracing (Jaeger)
- Request ID Propagation
- Graceful Shutdown
- Health Checks

### Performance
- Redis Caching (multi-level)
- Batch Processing (100x reduction)
- Rate Limiting (distributed)
- Sorted Sets for Feeds
- Eventual Consistency

### Message Queue
- Apache Kafka
- Producer-Consumer Pattern
- Event Sourcing
- Async Processing

### Observability
- Comprehensive Logging
- Structured Logging
- Event Logging
- Redis Operation Logging
- Error Tracking

### Security
- JWT Authentication
- Password Hashing (Bcrypt)
- Protected Endpoints
- Rate Limiting (DDoS protection)
- Input Validation

### Data Management
- PostgreSQL (3 databases)
- Prisma ORM
- Database Migrations
- BigInt Serialization
- Indexing Strategy

### DevOps
- Docker Containerization
- Docker Compose
- Hot-Reload Development
- Volume Mounting
- Makefile Automation

</details>

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [PROJECT-OVERVIEW.md](./PROJECT-OVERVIEW.md) | Complete technical documentation, architecture deep dive, feed algorithms |
| [Scope-overview.md](./Scope-overview.md) | Backend architecture principles, future development scope |
| [backend/README.md](./backend/README.md) | Microservices setup, commands, troubleshooting |
| [frontend/README.md](./frontend/README.md) | Frontend setup, folder structure, GraphQL integration |

---

## 🎓 Learning Outcomes

This project demonstrates:
- ✅ Microservices architecture & migration strategy
- ✅ Event-driven design with Kafka
- ✅ Feed personalization algorithms
- ✅ Redis caching strategies (multi-level)
- ✅ Batch processing patterns
- ✅ Rate limiting (distributed)
- ✅ Domain-Driven Design (DDD)
- ✅ GraphQL API design
- ✅ Service discovery & health checks
- ✅ Request tracing across services
- ✅ Docker containerization & orchestration

---

## 🔮 Roadmap

**Completed:**
- ✅ Microservices extraction (5 services)
- ✅ API Gateway with rate limiting
- ✅ Service discovery (Consul)
- ✅ Comprehensive logging
- ✅ Feed personalization (3 models)
- ✅ Batch processing workers

**Planned:**
- ⏳ Circuit breaker pattern
- ⏳ Dead Letter Queue (DLQ)
- ⏳ Full distributed tracing
- ⏳ Kubernetes deployment
- ⏳ Metrics collection (Prometheus + Grafana)
- ⏳ Service mesh (Istio)

See [PROJECT-OVERVIEW.md](./PROJECT-OVERVIEW.md#-remaining-work) for detailed roadmap.

---

## 🤝 Contributing

This is a learning project. Feel free to fork and experiment!

---

## 👨‍💻 Author

**Harshit Patel**

Built with ❤️ to demonstrate production-grade backend engineering and distributed systems concepts.

---

<div align="center">

**⭐ Star this repo if you find it helpful!**

[View Documentation](./PROJECT-OVERVIEW.md) • [Report Bug](https://github.com/harshitpatel123/connect-flow/issues) • [Request Feature](https://github.com/harshitpatel123/connect-flow/issues)

</div>
