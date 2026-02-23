# Auth Service

Microservice for user authentication and management.

## Quick Start

```bash
# 1. Start infrastructure
cd ../../infrastructure
docker-compose up -d

# 2. Setup service
cd ../services/auth-service
./setup.sh

# 3. Start service
npm run dev
```

## API Endpoints

### POST /auth/register
```bash
curl -X POST http://localhost:5001/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
```

### POST /auth/login
```bash
curl -X POST http://localhost:5001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
```

### POST /auth/validate (Internal)
```bash
curl -X POST http://localhost:5001/auth/validate \
  -H "Content-Type: application/json" \
  -d '{"token":"YOUR_JWT_TOKEN"}'
```

### GET /auth/user/:id (Internal)
```bash
curl http://localhost:5001/auth/user/USER_ID
```

### POST /auth/users/batch (Internal)
```bash
curl -X POST http://localhost:5001/auth/users/batch \
  -H "Content-Type: application/json" \
  -d '{"ids":["id1","id2"]}'
```

### GET /health
```bash
curl http://localhost:5001/health
```

## Environment Variables

```env
PORT=5001
DATABASE_URL=postgresql://auth_user:auth_pass@localhost:5432/auth_db
JWT_SECRET=your_jwt_secret
CONSUL_HOST=localhost
CONSUL_PORT=8500
SERVICE_NAME=auth-service
SERVICE_ID=auth-service-1
```

## Architecture

```
src/
├── api/              # REST endpoints
├── application/      # Use cases (Register, Login)
├── domain/           # Types & validation
├── infrastructure/   # Repository, JWT, Password, Prisma
├── config/           # Consul configuration
└── server.ts         # Entry point
```

## Database Schema

```prisma
model User {
  id           String   @id @default(uuid())
  email        String   @unique
  passwordHash String
  isActive     Boolean  @default(true)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}
```

## Features

- JWT authentication (7-day expiry)
- Password hashing (bcrypt)
- Email & password validation
- Consul service discovery
- Health check endpoint
- Graceful shutdown
