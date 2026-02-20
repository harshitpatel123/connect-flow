# Connect Flow - Microservices Backend (Docker)

Complete microservices architecture with **hot-reload** support.

---

## 🚀 Quick Start

```bash
make start    # Start all services (Docker handles everything!)
```

That's it! Docker will:
- ✅ Build images
- ✅ Install dependencies  
- ✅ Run migrations
- ✅ Start all services
- ✅ Enable hot-reload
- ✅ Show API Gateway logs

**Note:** `make start` automatically shows API Gateway logs. Press `Ctrl+C` to exit logs (services keep running).

---

## 📊 Commands

| Command | Description |
|---------|-------------|
| `make start` | Start all services (shows API Gateway logs) |
| `make stop` | Stop all services |
| `make clean` | Stop and delete all data |
| `make logs` | Show all services logs |
| `make status` | Show service status |

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

---

## 🌐 Service URLs

| Service | URL |
|---------|-----|
| **API Gateway** | http://localhost:4000 |
| Auth Service | http://localhost:5001 |
| Post Service | http://localhost:5002 |
| Interaction Service | http://localhost:5003 |
| Feed Service | http://localhost:5004 |
| **Consul UI** | http://localhost:8500 |
| **Jaeger UI** | http://localhost:16686 |

---

## 🔥 Hot-Reload Development

**All services support hot-reload!** Changes to source code automatically restart the service.

### How it works:
- Source code is **mounted as volumes** in containers
- Services use **nodemon** to watch for changes
- On file change → service auto-restarts

### Example workflow:
```bash
# 1. Start services
make dev

# 2. Edit code in services/auth-service/src/...
# → Auth service automatically restarts

# 3. View logs to see restart
make logs-svc SVC=auth-service

# 4. Test changes immediately
curl http://localhost:5001/health
```

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Port 3000)                      │
└──────────────────────────┬──────────────────────────────────┘
                           │ GraphQL
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                 API Gateway (Port 4000)                      │
│              [Docker Container + Hot-Reload]                 │
└──────────────────────────┬──────────────────────────────────┘
                           │ REST
        ┌──────────────────┼──────────────────┬───────────────┐
        ▼                  ▼                  ▼               ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Auth Service │  │ Post Service │  │ Interaction  │  │ Feed Service │
│  (Port 5001) │  │  (Port 5002) │  │  (Port 5003) │  │  (Port 5004) │
│   [Docker]   │  │   [Docker]   │  │   [Docker]   │  │   [Docker]   │
└──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘
       │                 │                  │                  │
       ▼                 ▼                  ▼                  ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  Auth DB     │  │  Post DB     │  │ Interaction  │  │  Redis       │
│  (Port 5432) │  │  (Port 5433) │  │  DB (5434)   │  │  (Port 6379) │
└──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘

┌─────────────────────────────────────────────────────────────┐
│              Shared Infrastructure (Docker)                  │
│  Kafka (9092) | Consul (8500) | Jaeger (16686)              │
└─────────────────────────────────────────────────────────────┘
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
docker-compose restart auth-service
```

### Port already in use
```bash
# Stop all containers
make stop

# Or force clean
make clean
```

### Database connection errors
```bash
# Wait for databases to be ready
docker-compose ps

# Check database health
docker-compose exec auth-db pg_isready -U auth_user
```

### Code changes not reflecting
```bash
# Force rebuild
make dev-rebuild

# Or rebuild specific service
docker-compose up -d --build auth-service
```

### View specific service logs
```bash
make logs-svc SVC=auth-service
make logs-svc SVC=post-service
make logs-svc SVC=interaction-service
make logs-svc SVC=feed-service
make logs-svc SVC=api-gateway
```

---

## 📦 What's Included

### Infrastructure (Docker Containers)
- ✅ PostgreSQL (3 databases: auth, post, interaction)
- ✅ Redis (caching & queues)
- ✅ Kafka (event streaming)
- ✅ Consul (service discovery)
- ✅ Jaeger (distributed tracing)

### Microservices (Docker Containers)
- ✅ Auth Service (JWT authentication)
- ✅ Post Service (post management)
- ✅ Interaction Service (likes, comments, views)
- ✅ Feed Service (personalized feeds)
- ✅ API Gateway (GraphQL endpoint)

### Features
- ✅ Hot-reload for all services
- ✅ Automatic service discovery (Consul)
- ✅ Distributed tracing (Jaeger)
- ✅ Event-driven architecture (Kafka)
- ✅ Database per service pattern
- ✅ Health checks for all services

---

## 🎓 Development Workflow

### 1. Start Development
```bash
make dev
```

### 2. Make Code Changes
Edit files in `services/*/src/` - changes auto-reload!

### 3. View Logs
```bash
# All services
make logs

# Specific service
make logs-svc SVC=auth-service
```

### 4. Test Changes
```bash
# GraphQL Playground
open http://localhost:4000

# Service health
curl http://localhost:5001/health
```

### 5. Stop Development
```bash
make stop
```

---

## 🔄 Rebuild Options

### When to rebuild:

**Rebuild on dependency changes:**
```bash
# Added new npm package
make dev-build
```

**Force rebuild everything:**
```bash
# Major changes or issues
make dev-rebuild
```

**Rebuild specific service:**
```bash
docker-compose up -d --build auth-service
```

---

## 📊 Monitoring

### Service Discovery (Consul)
```bash
open http://localhost:8500
```
View all registered services and their health status.

### Distributed Tracing (Jaeger)
```bash
open http://localhost:16686
```
Trace requests across all microservices.

### Container Status
```bash
make status
```

### Live Logs
```bash
make logs
```

---

## 🧹 Cleanup

### Stop services (keep data)
```bash
make stop
```

### Delete everything (including data)
```bash
make clean
```

---

## 🚀 Production Deployment

For production, use:
- Kubernetes for orchestration
- Separate docker-compose.prod.yml
- Environment-specific configs
- Image registry (Docker Hub, ECR)

---

## 📚 Next Steps

1. ✅ Run `make setup` (first time only)
2. ✅ Run `make dev` to start all services
3. ✅ Open http://localhost:4000 (API Gateway)
4. ✅ Open http://localhost:8500 (Consul UI)
5. ✅ Open http://localhost:16686 (Jaeger UI)
6. ✅ Start coding - changes auto-reload!

---

## 💡 Tips

- **Hot-reload works for all services** - just save your file!
- **Use `make logs-svc SVC=<service>`** to debug specific services
- **Consul UI shows service health** - check if services are registered
- **Jaeger UI shows request traces** - debug cross-service calls
- **Run `make dev-rebuild`** if things get weird

---

**Happy coding! 🚀**
