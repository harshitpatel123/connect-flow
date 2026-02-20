# Jaeger Distributed Tracing Setup

## What is Jaeger?

Jaeger is a distributed tracing system that helps you:
- Track requests across multiple microservices
- Debug performance issues
- Identify bottlenecks
- Visualize service dependencies
- Monitor errors across services

## Quick Start

### 1. Start Jaeger (Docker)

```bash
docker run -d --name jaeger \
  -p 5775:5775/udp \
  -p 6831:6831/udp \
  -p 6832:6832/udp \
  -p 5778:5778 \
  -p 16686:16686 \
  -p 14268:14268 \
  -p 9411:9411 \
  jaegertracing/all-in-one:latest
```

### 2. Access Jaeger UI

Open: http://localhost:16686

### 3. Services Auto-Report Traces

All services automatically send traces to Jaeger:
- **feed-service** - Feed operations
- **post-service** - Post operations  
- **interaction-service** - Interactions
- **auth-service** - Authentication
- **api-gateway** - Gateway routing

## How It Works

### Request Flow with Tracing

```
User Request → API Gateway
    ↓ (trace context propagated)
Feed Service → GET /feed/:userId
    ↓ (creates child span)
Post Service → POST /posts/batch
    ↓ (creates child span)
Response ← All spans sent to Jaeger
```

### What Gets Traced

1. **HTTP Requests**
   - Method, URL, status code
   - Request/response times
   - Headers propagation

2. **Service Calls**
   - Inter-service communication
   - Database queries
   - Redis operations
   - Kafka events

3. **Errors**
   - Exception messages
   - Stack traces
   - Error tags

## Using Jaeger UI

### 1. Find Traces

1. Go to http://localhost:16686
2. Select service: `feed-service`, `post-service`, etc.
3. Click "Find Traces"

### 2. View Trace Details

Click on any trace to see:
- **Timeline**: Visual representation of spans
- **Duration**: Time spent in each service
- **Tags**: Request metadata (user.id, post.id, etc.)
- **Logs**: Error messages and events

### 3. Debug Failures

When a request fails:
1. Search for traces with errors (red icon)
2. Click the trace
3. Find the span with `error=true` tag
4. Check logs for error message
5. See which service failed and why

## Example: Debugging Slow Feed

### Scenario
User reports slow feed loading

### Steps
1. Open Jaeger UI
2. Select `feed-service`
3. Set operation: `GET /feed/:userId`
4. Find traces > 1 second
5. Click slowest trace
6. Analyze timeline:
   - Feed service: 50ms
   - Post service call: 950ms ← **BOTTLENECK**
   - Database query: 900ms ← **ROOT CAUSE**

### Solution
Optimize database query or add caching

## Trace Context Propagation

### How Spans Are Connected

```typescript
// API Gateway creates root span
const rootSpan = tracer.startSpan('GET /feed/:userId');

// Inject trace context into HTTP headers
const headers = {};
tracer.inject(rootSpan, FORMAT_HTTP_HEADERS, headers);

// Feed Service extracts context
const parentSpan = tracer.extract(FORMAT_HTTP_HEADERS, req.headers);

// Create child span
const childSpan = tracer.startSpan('post-service.getPostsByIds', {
  childOf: parentSpan
});
```

## Tags and Logs

### Tags (Indexed Metadata)
```typescript
span.setTag('user.id', userId);
span.setTag('http.status_code', 200);
span.setTag('error', true);
```

### Logs (Events)
```typescript
span.log({ event: 'error', message: 'Database timeout' });
span.log({ event: 'cache_hit', key: 'feed:user123' });
```

## Common Queries

### Find All Errors
- Service: `Any`
- Tags: `error=true`

### Find Slow Requests
- Min Duration: `1s`

### Find User's Requests
- Tags: `user.id=<userId>`

### Find Failed Post Creations
- Service: `post-service`
- Operation: `POST /posts`
- Tags: `error=true`

## Environment Variables

```bash
# Jaeger Agent (UDP)
JAEGER_AGENT_HOST=localhost
JAEGER_AGENT_PORT=6831

# Service Name (auto-set per service)
JAEGER_SERVICE_NAME=feed-service
```

## Production Considerations

### Sampling
Currently: 100% (all requests traced)

For production:
```typescript
sampler: {
  type: 'probabilistic',
  param: 0.1  // Sample 10% of requests
}
```

### Storage
Default: In-memory (lost on restart)

For production: Use Elasticsearch or Cassandra backend

## Benefits

1. **Faster Debugging**
   - See exact service that failed
   - View error messages in context
   - Trace request path

2. **Performance Optimization**
   - Identify slow services
   - Find bottlenecks
   - Measure latency

3. **Service Dependencies**
   - Visualize architecture
   - Understand call patterns
   - Detect circular dependencies

4. **Monitoring**
   - Track error rates
   - Monitor latency trends
   - Alert on anomalies

## Example Traces

### Successful Feed Request
```
api-gateway (50ms)
  └─ feed-service.GET /feed/:userId (45ms)
      └─ post-service.getPostsByIds (40ms)
          └─ database.query (35ms)
```

### Failed Like Request
```
api-gateway (100ms)
  └─ interaction-service.POST /like (95ms) [ERROR]
      └─ redis.increment (90ms) [ERROR: Connection refused]
```

## Next Steps

1. Start Jaeger: `docker run ...`
2. Start all services
3. Make some requests
4. Open Jaeger UI: http://localhost:16686
5. Explore traces!

## Troubleshooting

### No traces appearing?
- Check Jaeger is running: `docker ps | grep jaeger`
- Check service logs for Jaeger connection
- Verify port 6831 is accessible

### Traces incomplete?
- Ensure all services use same Jaeger agent
- Check trace context propagation in HTTP headers
- Verify spans are finished: `span.finish()`
