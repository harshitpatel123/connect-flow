# Connect Flow - Microservices Backend

Microservices architecture implementation of Connect Flow.

## Quick Start

```bash
# Start infrastructure (frees ports, preserves data)
make start

# Check status
make status
```

## Makefile Commands

| Command | Description |
|---------|-------------|
| `make start` | Free ports, stop containers, start fresh (data preserved) |
| `make stop` | Stop all services |
| `make restart` | Restart all services |
| `make clean` | Stop and DELETE all data (volumes removed) |
| `make status` | Show service status |
| `make logs` | Show logs |

## Infrastructure Services

After running `make start`, the following services will be available:

| Service | Port | URL |
|---------|------|-----|
| Auth DB | 5432 | postgresql://auth_user:auth_pass@localhost:5432/auth_db |
| Post DB | 5433 | postgresql://post_user:post_pass@localhost:5433/post_db |
| Interaction DB | 5434 | postgresql://interaction_user:interaction_pass@localhost:5434/interaction_db |
| Redis | 6379 | redis://localhost:6379 |
| Kafka | 9092 | localhost:9092 |
| Consul UI | 8500 | http://localhost:8500 |
| Jaeger UI | 16686 | http://localhost:16686 |

## Microservices

| Service | Port | Status |
|---------|------|--------|
| Auth Service | 5001 | ✅ Complete |
| Post Service | 5002 | ⏳ Pending |
| Interaction Service | 5003 | ⏳ Pending |
| Feed Service | 5004 | ⏳ Pending |
| API Gateway | 4000 | ✅ Complete |

## Running Services

### 1. Start Infrastructure
```bash
make start
```

### 2. Start Auth Service
```bash
cd services/auth-service
./setup.sh  # Only first time
npm run dev
```

### 3. Start API Gateway
```bash
cd services/api-gateway
npm run dev
```

## Troubleshooting

### Port Already in Use
```bash
make clean  # This will free all ports
```

### Check Service Health
```bash
make status
```

### View Service Logs
```bash
make logs
```

### Individual Service Logs
```bash
cd infrastructure
docker-compose logs -f consul
docker-compose logs -f kafka
docker-compose logs -f auth-db
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                       Frontend (3000)                        │
└──────────────────────────┬──────────────────────────────────┘
                           │ GraphQL
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Gateway (4000)                        │
└──────────────────────────┬──────────────────────────────────┘
                           │ REST
        ┌──────────────────┼──────────────────┐
        ▼                  ▼                  ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Auth Service │  │ Post Service │  │ Interaction  │
│    (5001)    │  │    (5002)    │  │   (5003)     │
└──────┬───────┘  └──────┬───────┘  └──────┬───────┘
       │                 │                  │
       ▼                 ▼                  ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  Auth DB     │  │  Post DB     │  │ Interaction  │
│   (5432)     │  │   (5433)     │  │  DB (5434)   │
└──────────────┘  └──────────────┘  └──────────────┘

┌─────────────────────────────────────────────────────────────┐
│              Shared Infrastructure                           │
│  Redis (6379) | Kafka (9092) | Consul (8500)               │
└─────────────────────────────────────────────────────────────┘
```
