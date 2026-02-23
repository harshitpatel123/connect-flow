# Rate Limiting Configuration

## Overview
Production-grade rate limiting implemented using Redis-backed storage for distributed rate limiting across multiple API Gateway instances.

## Rate Limit Tiers

### 1. Global Rate Limit (IP-based)
- **Limit**: 1000 requests per 15 minutes per IP
- **Purpose**: DDoS protection
- **Applies to**: All endpoints except health checks
- **Key**: `rl:global:{ip}`

### 2. Authentication Rate Limit
- **Limit**: 5 attempts per 15 minutes per IP
- **Purpose**: Brute force protection
- **Applies to**: Login and register mutations
- **Key**: `rl:auth:{ip}`
- **Special**: Doesn't count successful authentications

### 3. Mutation Rate Limit (User-based)
- **Limit**: 30 mutations per minute per user
- **Purpose**: Prevent spam and abuse
- **Applies to**: All GraphQL mutations
- **Key**: `rl:mutation:{userId}`

### 4. Query Rate Limit (User-based)
- **Limit**: 100 queries per minute per user
- **Purpose**: Prevent excessive data scraping
- **Applies to**: All GraphQL queries
- **Key**: `rl:query:{userId}`

### 5. Authenticated User Rate Limit
- **Limit**: 60 requests per minute per user
- **Purpose**: General user protection
- **Applies to**: All authenticated requests
- **Key**: `rl:user:{userId}`

## Response Headers

When rate limited, the following headers are returned:
```
RateLimit-Limit: 100
RateLimit-Remaining: 0
RateLimit-Reset: 1640000000
Retry-After: 60
```

## Error Response

```json
{
  "error": "Too Many Requests",
  "message": "Rate limit exceeded. Please try again later.",
  "retryAfter": 60
}
```

## Configuration

Rate limits can be adjusted in `src/middleware/rateLimiter.ts`:

```typescript
const RATE_LIMITS = {
  global: { windowMs: 15 * 60 * 1000, max: 1000 },
  auth: { windowMs: 15 * 60 * 1000, max: 5 },
  mutations: { windowMs: 60 * 1000, max: 30 },
  queries: { windowMs: 60 * 1000, max: 100 },
  authenticated: { windowMs: 60 * 1000, max: 60 },
};
```

## Monitoring

Rate limit violations are logged:
```
[RATE-LIMIT] Blocked request from 192.168.1.1 to /graphql
```

## Redis Keys

All rate limit data is stored in Redis with prefixes:
- `rl:global:*` - Global IP-based limits
- `rl:auth:*` - Authentication limits
- `rl:mutation:*` - Mutation limits
- `rl:query:*` - Query limits
- `rl:user:*` - User-based limits

Keys automatically expire after the window period.

## Production Considerations

1. **Distributed Systems**: Redis ensures rate limits work across multiple API Gateway instances
2. **IP Detection**: Handles `X-Forwarded-For` header for proxied requests
3. **Health Checks**: Excluded from rate limiting to prevent monitoring failures
4. **Graceful Degradation**: If Redis fails, requests pass through (fail-open)
5. **Standard Headers**: Uses RFC-compliant `RateLimit-*` headers
