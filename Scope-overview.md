# ConnectFlow – Backend Architecture Overview

ConnectFlow is a learning-focused, production-inspired backend platform designed to practice advanced backend and distributed system concepts.  
The system is initially implemented as a **Modular Monolith**, with clear boundaries that allow gradual extraction into **Microservices** later.

The goal is not feature completeness, but **correct architectural decisions**, **event-driven workflows**, and **resilience patterns** inspired by real-world systems.

---

## Architectural Principles

- Modular Monolith first, Microservices later
- Event-driven internal communication
- Asynchronous processing wherever possible
- Eventual consistency over strong consistency
- Failure-aware design (retries, DLQ, graceful degradation)
- Observability as a first-class concern
- User experience should not be blocked by non-critical services

---

## High-Level Modules

Each module owns its data and exposes functionality via APIs or events.  
No module directly accesses another module’s database.

---

## 1. Auth & Identity Module

### Responsibilities
- User registration and authentication
- Token generation and validation
- Identity propagation across requests

### Backend Design
- Stateless authentication using JWT (access + refresh tokens)
- Rate-limited authentication endpoints
- Auth context injected into all downstream modules

### Concepts Covered
- API Gateway authentication hook
- Rate limiting
- Graceful degradation for auth-related failures

---

## 2. User Profile Module

### Responsibilities
- User profile creation and updates
- Storing user interaction signals (likes, views, interests)
- Fetching public user profiles

### Backend Design
- Read-heavy module with aggressive caching
- Logical separation of read and write paths (CQRS-style)
- Interaction signals used by Feed Module for personalization

### Concepts Covered
- Caching strategies
- Read replicas vs write DB
- Cache invalidation
- User preference modeling (lightweight)

---

## 3. Post Module (Content Creation)

### Responsibilities
- Creating user posts
- Persisting post metadata
- Emitting post-related events

### Backend Design
- Synchronous write to primary database
- Post creation must succeed independently of downstream consumers
- Emits `PostCreated` event for async processing

### Failure Handling
- Downstream failures (e.g., notifications) must **not block** post creation
- User should never see delays due to non-critical async workflows

### Concepts Covered
- Event-driven architecture
- Kafka event publishing
- Idempotent write operations
- Saga initiation point
- Graceful degradation

---

## 4. Feed Module (Personalized Feed System)

### Responsibilities
- Generating personalized feeds per user
- Ranking content based on user preferences
- Ensuring already-seen content is not resurfaced

### Feed Strategy (Simplified, Learning-Focused)
- No follower/following graph
- Feed is personalized using:
  - Liked content
  - Viewed content
  - Interaction signals from User Profile Module

### Ranking Logic
Feed ranking uses a weighted scoring model: Score = (EngagementScore × EngagementWeight) + (RecencyScore × RecencyWeight) - (SeenPenalty)



### Seen Content Management
- Use **Bloom Filters in Redis** to track seen `post_id`s per user
- Space-efficient and fast membership checks
- Prevents resurfacing already-consumed content

### Backend Design
- Asynchronous feed fan-out (push model)
- Precomputed feeds stored in Redis
- Partitioned event consumption based on `userId`

### Concepts Covered
- Kafka consumers
- Message ordering and partitioning
- Eventual consistency
- Sharding (user-based)
- Caching strategies
- Lightweight recommendation systems

---

## 5. Interaction Module (Likes & Comments)

### Responsibilities
- Handling likes and comments
- Updating interaction counters
- Producing interaction events

### Backend Design
- Event-first interaction handling
- Counters updated asynchronously
- Failures routed to DLQ

### Concepts Covered
- Eventual consistency
- Retry strategies
- Dead Letter Queues (DLQ)
- Idempotent event processing

---

## 6. Chat Module

### Responsibilities
- One-to-one messaging between users
- Near real-time message delivery
- Message persistence

### Backend Design
- WebSocket-based real-time communication
- Messages persisted asynchronously
- Ordered message processing per conversation

### Concepts Covered
- WebSockets
- Message ordering
- Queue-backed persistence
- Graceful degradation (fallback polling if needed)

---

## 7. Notification Module

### Responsibilities
- Sending notifications for posts, likes, comments, and messages
- Managing delivery retries
- Supporting delayed notifications

### Backend Design
- Fully event-driven notification pipeline
- Best-effort delivery model
- Notification failures must not impact core user flows

### Failure Isolation
- If Notification processing is slow or down:
  - Post creation still succeeds
  - Feed generation still proceeds
  - Failures handled via retries and DLQ

### Concepts Covered
- Pub/Sub
- Kafka fan-out
- BullMQ for delayed jobs
- Failure isolation
- Graceful degradation

---

## 8. Background Jobs & Scheduler Module

### Responsibilities
- Scheduled maintenance jobs
- Feed rebuilds
- Cleanup and recovery tasks
- Saga compensation retries

### Backend Design
- Worker-based background processing
- Cron-triggered jobs
- Idempotent job execution

### Concepts Covered
- Cron jobs
- Background workers
- Job retries
- Failure recovery

---

## 9. API Gateway & Rate Limiting Module

### Responsibilities
- Central request routing
- Rate limiting per user and per IP
- Circuit breaking for downstream failures

### Backend Design
- Gateway-level middleware
- Redis-backed rate counters
- Timeouts and circuit breaker enforcement

### Circuit Breaker Pattern
- Wraps all service-to-service calls (auth, post, interaction, feed)
- States: CLOSED (normal) → OPEN (failing) → HALF_OPEN (testing recovery)
- Configuration: 50% error threshold, 10 request volume, 30s reset timeout
- Fallback strategies: cached data, empty responses, or 503 errors
- Shared state via Redis for multi-instance coordination

### Concepts Covered
- API Gateway pattern
- Rate limiting strategies
- Circuit breakers (opossum library)
- Graceful degradation
- Cascading failure prevention

---

## 10. Observability Module

### Responsibilities
- Centralized logging
- Distributed request tracing
- Metrics collection

### Backend Design
- Structured logging across all modules
- Trace ID propagation through async events
- Metrics for latency, error rate, and queue lag

### Concepts Covered
- Centralized logging
- Distributed tracing
- System observability
- Debugging async workflows

---

## 11. Chaos & Resilience Module

### Responsibilities
- Injecting failures into the system
- Testing system behavior under stress
- Validating fallback mechanisms

### Backend Design
- Fault injection toggles
- Random delays and failures
- Controlled consumer crashes

### Concepts Covered
- Chaos Monkey
- Resilience testing
- Circuit breaker validation
- Graceful degradation

---

## 12. Dead Letter Queue (DLQ) Module

### Responsibilities
- Capturing failed message processing
- Storing unprocessable events for manual inspection
- Enabling message reprocessing and recovery

### Backend Design
- DLQ topics: `post-created.dlq`, `post-liked.dlq`, `user-interests-updated.dlq`
- Retry logic: 3 attempts with exponential backoff (5s, 30s, 5min)
- Message metadata: original payload, error trace, retry count, timestamps
- Storage: Kafka DLQ topics (7 days) + database archive for long-term
- Reprocessing: Admin API endpoint for manual retry or automated monitoring

### Concepts Covered
- Message failure handling and recovery
- Exponential backoff retry strategies
- Event replay mechanisms
- Operational debugging tools

---

## Cross-Cutting Saga: User Deletion (Choreography)

### Workflow
1. User deletion requested
2. `UserDeleted` event published to Kafka
3. Post Module deletes user posts
4. Feed Module clears cached feeds
5. Media Module deletes associated media (e.g., S3)
6. Notification Module cancels pending notifications

### Concepts Covered
- Saga pattern (Choreography)
- Eventual consistency
- Failure handling and retries
- Distributed cleanup workflows

---

## Modular Monolith Strategy

- All modules live in a single codebase initially
- Strict boundaries enforced via:
  - Clear folder structure
  - Explicit module interfaces
  - Internal event bus
- No direct database access across modules
- Internal async communication mirrors future microservice design

---

## Future Evolution

- Gradual extraction of modules into microservices
- Kafka and queues already define natural service boundaries
- API Gateway becomes external
- Observability and resilience patterns remain unchanged

---

## Summary

ConnectFlow simulates how real-world social platforms design their backend systems internally, with a focus on event-driven architecture, resilience, and scalability rather than UI complexity.

This project acts as a deep backend and system design practice platform.
