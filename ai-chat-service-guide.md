# ai-chat-service — Detailed Build Guide (Phase 1)

Part of the ConnectFlow AI Chatbot + MCP roadmap.
Scope: standalone AI chat, no MCP. MCP comes in Phase 2-4.

---

## 0. Decisions Locked For This Phase

```
Placement          : new microservice — services/ai-chat-service (Port 5005)
Transport           : REST + SSE, proxied through the existing API Gateway
                       (deliberately NOT GraphQL — see Section 3)
Response delivery   : streaming, token-by-token
History             : persisted to Postgres from message 1, Redis as a read cache only
AI provider          : Gemini (free tier), swappable later behind GeminiClient
```

---

## 1. Why a New Service Instead of a Gateway Feature

ConnectFlow's existing pattern is one service per bounded domain, each with
its own DB, each following the same DDD layering. Chat is its own domain
(sessions, messages, an external AI dependency) — it doesn't belong inside
auth, post, interaction, or feed, and it doesn't belong bolted onto the
gateway either, because the gateway is meant to stay a thin routing/auth
layer, not hold business logic or a database connection.

Putting it in its own service also means:
- It can be scaled independently of the rest (AI calls are slow/expensive
  relative to a Postgres read — you don't want that latency profile
  co-located with, say, the feed service).
- A Gemini outage or slowdown can't take down anything else.
- Phase 3 (your own MCP server) plugs naturally into this same service later,
  since ai-chat-service is the thing that will eventually need to *call*
  MCP tools mid-conversation.

---

## 2. Directory Structure

```
services/
└── ai-chat-service/                    # Port 5005 | Chat DB (Postgres, port 5435)
    ├── src/
    │   ├── api/
    │   │   ├── chat.controller.ts       # SSE response writer, request parsing
    │   │   ├── chat.routes.ts           # Express router
    │   │   └── health.controller.ts
    │   ├── application/
    │   │   ├── create-session.usecase.ts
    │   │   ├── send-message.usecase.ts  # the core streaming use case
    │   │   └── get-history.usecase.ts
    │   ├── domain/
    │   │   ├── chat-session.entity.ts
    │   │   ├── chat-message.entity.ts
    │   │   └── role.value-object.ts
    │   ├── infrastructure/
    │   │   ├── repositories/
    │   │   │   ├── chat-session.repository.ts   # Prisma
    │   │   │   └── chat-message.repository.ts   # Prisma
    │   │   ├── cache/
    │   │   │   └── chat-context.cache.ts         # Redis
    │   │   └── ai/
    │   │       └── gemini.client.ts              # wraps @google/generative-ai
    │   ├── events/                       # empty in Phase 1 — stubbed for Phase 3/4 Kafka producer
    │   ├── middleware/
    │   │   ├── auth.middleware.ts        # verifies JWT, same secret as auth-service
    │   │   ├── request-id.middleware.ts
    │   │   ├── logging.middleware.ts
    │   │   └── rate-limit.middleware.ts  # Redis-backed, same pattern as gateway
    │   ├── config/
    │   │   └── env.ts                    # zod-validated env vars
    │   └── server.ts                     # entry point, graceful shutdown, Consul registration
    ├── prisma/
    │   └── schema.prisma
    ├── Dockerfile
    ├── package.json
    └── .env.example
```

This mirrors the layering already used by auth/post/interaction/feed —
`api → application → domain`, with `infrastructure` implementing the
interfaces that `application` depends on. Keep the dependency direction
one-way: domain knows nothing about infrastructure, application knows
domain but not infrastructure's concrete classes (inject via constructor).

---

## 3. Transport: Why REST + SSE, Not GraphQL

The rest of ConnectFlow speaks GraphQL at the gateway. Chat is the
exception, on purpose:

- Token-by-token streaming needs either GraphQL subscriptions (websocket
  transport, a subscription server, a pub/sub backplane) or a simple HTTP
  streaming response. The gateway has none of the websocket infrastructure
  today — building it just for this one feature is a lot of new surface
  area for a learning-phase feature.
- SSE-over-HTTP is simpler to reason about, debug (you can literally `curl`
  it), and is what most production AI chat products actually use under the
  hood for exactly this reason.
- The gateway still does its job: JWT auth check and rate limiting happen
  before the request is proxied through, exactly like it does for the
  other services. Only the "wrap it in a GraphQL resolver" part is skipped.

Document this explicitly in the service README as an intentional deviation,
not an inconsistency — it'll look like a mistake to a future reader
otherwise.

---

## 4. Data Model — Chat DB (Postgres, port 5435)

```prisma
model ChatSession {
  id        String   @id @default(uuid())
  userId    String                     // from JWT — no FK, auth is a separate DB
  title     String?                    // derived from first message, later
  messages  ChatMessage[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([userId])
}

enum Role {
  user
  assistant
  system
}

model ChatMessage {
  id         String      @id @default(uuid())
  sessionId  String
  session    ChatSession @relation(fields: [sessionId], references: [id])
  role       Role
  content    String
  isPartial  Boolean     @default(false)   // true if a stream was interrupted mid-generation
  createdAt  DateTime    @default(now())

  @@index([sessionId, createdAt])
}
```

`isPartial` matters: if Gemini errors out or the client disconnects
mid-stream, you still want to persist whatever text was generated so far
(both for the user's sake and for your own debugging), but flagged so the
UI can show "response was interrupted" instead of treating it as complete.

---

## 5. Redis — What It's For (and Isn't)

Redis here is a **cache**, not a second source of truth. Postgres is
authoritative. Two keys:

```
rl:mutation:{userId}          -- reuse the existing gateway rate-limit counter pattern
chat:context:{sessionId}      -- cached array of last N messages, TTL 1h
```

Why cache context: every message send needs "last N messages" to build the
prompt. Reading that from Postgres on every turn is fine at small scale but
is unnecessary DB load once this is under real use — same reasoning
ConnectFlow already applies to feeds and likes. On a cache miss, fall back
to a DB read and repopulate the cache — this is the same graceful-
degradation pattern used elsewhere in the project (Redis down ≠ feature
down).

---

## 6. Endpoints

```
POST   /api/chat/sessions               -> { sessionId }
GET    /api/chat/sessions/:id/messages  -> full history (used on page reload)
POST   /api/chat/sessions/:id/messages  -> SSE stream of the assistant's reply
GET    /health
```

All routes except `/health` go through `auth.middleware` (JWT) and
`rate-limit.middleware` at the gateway before being proxied.

---

## 7. End-to-End Streaming Flow

```
Client                Gateway              ai-chat-service              Gemini
  |--POST /sessions/:id/messages {content}->|
  |                    | verify JWT
  |                    | check rate limit (Redis)
  |                    |----proxy, keep stream open---->|
  |                                          | SendMessageUseCase.execute()
  |                                          |  1. save user ChatMessage      (Postgres)
  |                                          |  2. load context:
  |                                          |       Redis hit  -> use it
  |                                          |       Redis miss -> read last 20 from Postgres,
  |                                          |                     repopulate Redis
  |                                          |  3. GeminiClient.streamGenerate(context) -------->|
  |                                          |  4. for each chunk received:
  |                                          |       write SSE frame  data: {chunk}\n\n
  |                                          |       append chunk to fullText buffer
  |<---SSE chunks, proxied through gateway---|
  |                                          |  5. stream ends normally:
  |                                          |       save assistant ChatMessage(fullText)
  |                                          |       append both messages to Redis context cache
  |                                          |       write SSE  event: done
  |                                          |  6. error mid-stream (Gemini fails, client aborts):
  |                                          |       save assistant ChatMessage(fullText, isPartial=true)
  |                                          |       write SSE  event: error   (if connection still open)
```

Note on the client transport: use `fetch()` with a `POST` body and read the
response as a stream, not the browser's native `EventSource` — `EventSource`
only supports `GET`, so it can't carry the message body you need to send.
Reading a POST response as a stream via `fetch` + `ReadableStream` is what
production chat UIs actually do.

---

## 8. Pseudocode — Every Layer

### 8.1 `infrastructure/ai/gemini.client.ts`

```
class GeminiClient:
  constructor(apiKey, modelName):
    this.model = new GoogleGenerativeAI(apiKey).getGenerativeModel({ model: modelName })
    this.activeStreams = new Map()   // requestId -> abort handle, for client-disconnect cleanup

  async *streamGenerate(messages, requestId):
    formatted = messages.map(m => ({
      role: m.role == "assistant" ? "model" : "user",   // Gemini's role naming
      parts: [{ text: m.content }]
    }))

    result = await this.model.generateContentStream({ contents: formatted })
    this.activeStreams.set(requestId, result)

    try:
      for await (chunk of result.stream):
        text = chunk.text()
        if text: yield text
    finally:
      this.activeStreams.delete(requestId)

  abort(requestId):
    stream = this.activeStreams.get(requestId)
    if stream: stream.controller?.abort?.()   // best-effort, SDK-dependent
```

### 8.2 `domain/chat-message.entity.ts`

```
class ChatMessage:
  constructor(id, sessionId, role: Role, content, isPartial = false, createdAt = now()):
    validate role in [user, assistant, system]
    validate content.length > 0 or isPartial   // empty content only allowed on partial saves
    this.id = id; this.sessionId = sessionId; ...

  static createUserMessage(sessionId, content):
    return new ChatMessage(uuid(), sessionId, Role.user, content)

  static createAssistantMessage(sessionId, content, isPartial):
    return new ChatMessage(uuid(), sessionId, Role.assistant, content, isPartial)
```

Keep entities free of Prisma/DB imports — repositories translate between
entities and Prisma models. This is what makes the AI client swappable
later without touching domain code.

### 8.3 `infrastructure/repositories/chat-message.repository.ts`

```
class ChatMessageRepository:
  constructor(prisma)

  async create(entity: ChatMessage):
    row = await prisma.chatMessage.create({ data: toRow(entity) })
    return toEntity(row)

  async getLastN(sessionId, n):
    rows = await prisma.chatMessage.findMany({
      where: { sessionId }, orderBy: { createdAt: "desc" }, take: n
    })
    return rows.reverse().map(toEntity)   // oldest-first for prompt building
```

### 8.4 `infrastructure/cache/chat-context.cache.ts`

```
class ChatContextCache:
  constructor(redisClient, ttlSeconds = 3600)

  async get(sessionId):
    raw = await redis.get(`chat:context:${sessionId}`)
    return raw ? JSON.parse(raw) : null

  async append(sessionId, newMessages):
    current = await this.get(sessionId) ?? []
    updated = [...current, ...newMessages].slice(-20)   // cap context window
    await redis.set(`chat:context:${sessionId}`, JSON.stringify(updated), "EX", ttlSeconds)
```

### 8.5 `application/send-message.usecase.ts`

```
class SendMessageUseCase:
  constructor(sessionRepo, messageRepo, contextCache, geminiClient, logger)

  async *execute(sessionId, userId, content, requestId):
    session = await sessionRepo.findById(sessionId)
    if !session:
      throw new NotFoundError("session not found")
    if session.userId != userId:
      throw new ForbiddenError("not your session")

    userMsg = ChatMessage.createUserMessage(sessionId, content)
    await messageRepo.create(userMsg)

    context = await contextCache.get(sessionId)
    if !context:
      context = await messageRepo.getLastN(sessionId, 20)

    fullText = ""
    try:
      for await (chunk of geminiClient.streamGenerate([...context, userMsg], requestId)):
        fullText += chunk
        yield { type: "chunk", data: chunk }

      assistantMsg = ChatMessage.createAssistantMessage(sessionId, fullText, false)
      await messageRepo.create(assistantMsg)
      await contextCache.append(sessionId, [userMsg, assistantMsg])
      yield { type: "done", messageId: assistantMsg.id }

    catch (err):
      logger.error("gemini stream failed", { requestId, sessionId, error: err.message })
      if fullText.length > 0:
        partial = ChatMessage.createAssistantMessage(sessionId, fullText, true)
        await messageRepo.create(partial)
      yield { type: "error", message: "response generation was interrupted" }
```

Note this is a generator (`async *execute`) — the controller drives it and
writes each yielded event straight to the SSE response. Keeping the use
case a generator (not something that takes a callback) keeps it testable in
isolation: a unit test can just iterate the generator and assert on the
yielded events, no need to mock a response object.

### 8.6 `api/chat.controller.ts`

```
async function sendMessage(req, res):
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive"
  })

  requestId = req.headers["x-request-id"] ?? uuid()
  clientAborted = false
  req.on("close", () => {
    clientAborted = true
    geminiClient.abort(requestId)
  })

  try:
    for await (event of sendMessageUseCase.execute(
      req.params.id, req.user.id, req.body.content, requestId
    )):
      if clientAborted: break
      res.write(`event: ${event.type}\n`)
      res.write(`data: ${JSON.stringify(event)}\n\n`)
  catch (err):
    if err instanceof NotFoundError: res.write(`event: error\ndata: {"message":"session not found"}\n\n`)
    else if err instanceof ForbiddenError: res.write(`event: error\ndata: {"message":"forbidden"}\n\n`)
    else: res.write(`event: error\ndata: {"message":"internal error"}\n\n`)
  finally:
    res.end()
```

### 8.7 `middleware/auth.middleware.ts`

```
function authMiddleware(req, res, next):
  token = req.headers.authorization?.replace("Bearer ", "")
  if !token: return res.status(401).json({error: "missing token"})
  try:
    payload = jwt.verify(token, env.JWT_SECRET)   // same secret as auth-service
    req.user = { id: payload.sub }
    next()
  catch:
    res.status(401).json({error: "invalid token"})
```

### 8.8 Frontend consumption (Next.js)

```
async function sendMessage(sessionId, content, { onChunk, onDone, onError }):
  res = await fetch(`/api/chat/sessions/${sessionId}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ content })
  })

  reader = res.body.getReader()
  decoder = new TextDecoder()
  buffer = ""

  while true:
    { done, value } = await reader.read()
    if done: break
    buffer += decoder.decode(value, { stream: true })

    frames = buffer.split("\n\n")
    buffer = frames.pop()   // keep incomplete trailing frame for next read

    for frame of frames:
      { event, data } = parseSSEFrame(frame)   // split "event:" / "data:" lines
      parsed = JSON.parse(data)
      if event == "chunk": onChunk(parsed.data)
      if event == "done":  onDone(parsed.messageId)
      if event == "error": onError(parsed.message)
```

React side: append `onChunk` text to the last assistant bubble in state as
it arrives — this is what gives the token-by-token typing effect.

---

## 9. Error Handling & Edge Cases

```
Client disconnects mid-stream
  -> req "close" event fires -> abort Gemini call -> persist partial message (isPartial=true)

Gemini API errors (rate limit, timeout, content filter)
  -> caught in use case -> persist whatever text was generated so far, flagged partial
  -> SSE "error" event sent if connection still open

Invalid/missing session
  -> NotFoundError before any Gemini call is made -> no wasted API call

Session belongs to a different user
  -> ForbiddenError, same treatment

Empty message content
  -> reject at the controller (400) before touching the use case

Redis unavailable
  -> context cache miss path -> straight to Postgres, log a warning, don't fail the request

Gateway rate limit exceeded
  -> rejected before it ever reaches ai-chat-service (consistent with the rest of the project)
```

---

## 10. Production Patterns Carried Over From the Rest of ConnectFlow

```
- Request-ID propagation from gateway through to this service, included in every log line
- [AI-CHAT-SERVICE] log prefix + duration timing on every request, same format as other services
- /health endpoint + Consul registration on boot, deregistration on graceful shutdown
- Rate limiting enforced at the gateway (reuse the 30 mutations/min-per-user bucket)
- Env var validation on boot via zod — fail fast on missing GEMINI_API_KEY / DATABASE_URL, don't
  discover it on the first request
- Secrets via .env, never committed — .env.example checked in instead
- Added to docker-compose.yml and the Makefile (make backend should start this service too)
```

`config/env.ts` sketch:

```
schema = z.object({
  PORT: z.string().default("5005"),
  DATABASE_URL: z.string(),
  REDIS_URL: z.string(),
  GEMINI_API_KEY: z.string().min(1),
  JWT_SECRET: z.string().min(1),
  CONSUL_HOST: z.string().default("consul")
})

export const env = schema.parse(process.env)   // throws on boot if anything's missing
```

---

## 11. Build Order

```
1. Prisma schema + migration for the Chat DB; add to docker-compose (port 5435) and
   Prisma Studio port list (5558)
2. Domain entities + repositories — verify create-session / save-message works end-to-end
   with no AI involved yet (just Postgres CRUD)
3. GeminiClient in isolation — a small standalone script that streams a response to stdout,
   confirms the API key and SDK usage work before wiring it into the service
4. SendMessageUseCase — wire repo + cache + client together, unit-test by iterating the
   generator against a mocked GeminiClient
5. SSE controller + routes
6. Gateway: add the proxy route, auth check, rate limit
7. ChatContextCache (Redis)
8. Frontend chat page consuming the stream
9. Health check, logging, Consul registration, docker-compose + Makefile entries
```

---

## 12. What's Deliberately Deferred to Later Phases

```
- No MCP client/host logic yet (Phase 2)
- No Kafka producer from this service yet — events/ stays empty (Phase 3/4 wires it up
  so tool calls like createPost can fire the same kind of events post-service already does)
- No tool/function-calling on the Gemini call yet — plain text in, text out
- No conversation title generation, no multi-model support, no retry/circuit-breaker around
  the Gemini call — add these once the base flow is solid
```
