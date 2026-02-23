# API Gateway

GraphQL API Gateway for Connect Flow microservices architecture.

## Architecture

```
Client (Frontend)
    ↓ GraphQL
API Gateway (This Service)
    ↓ REST API
Microservices (Auth, Post, Interaction, Feed)
```

## Features

- **GraphQL API** - Single endpoint for all client requests
- **Service Discovery** - Consul integration for dynamic service location
- **Distributed Tracing** - Jaeger integration for request tracking
- **JWT Authentication** - Token-based authentication
- **Health Checks** - `/health` endpoint for monitoring

## Setup

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start development server
npm run dev

# Build for production
npm run build
npm start
```

## Environment Variables

See `.env.example` for all required variables.

## GraphQL Schema

### Queries

- `me` - Get current user
- `post(id: ID!)` - Get post by ID
- `userPosts(userId: ID!)` - Get user's posts
- `feed(limit: Int, offset: Int)` - Get personalized feed

### Mutations

- `register(email: String!, password: String!)` - Register new user
- `login(email: String!, password: String!)` - Login user
- `createPost(content: String!, categoryTags: [String!]!)` - Create post
- `likePost(postId: ID!)` - Like a post
- `unlikePost(postId: ID!)` - Unlike a post

## Endpoints

- `POST /graphql` - GraphQL endpoint
- `GET /health` - Health check

## Service Communication

API Gateway communicates with microservices via REST:

- **Auth Service** - User authentication and management
- **Post Service** - Post creation and retrieval
- **Interaction Service** - Likes, comments, interactions
- **Feed Service** - Personalized feed generation

## Development

```bash
# Run in development mode with hot reload
npm run dev

# Access GraphQL Playground
http://localhost:4000/graphql
```

## Production

```bash
# Build TypeScript
npm run build

# Run production server
npm start
```

## Docker

```bash
# Build image
docker build -t api-gateway .

# Run container
docker run -p 4000:4000 --env-file .env api-gateway
```
