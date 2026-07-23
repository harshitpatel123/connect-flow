# ai-chat-service — Detailed Build Guide (Phase 2: Linear MCP Integration)

Part of the ConnectFlow AI Chatbot + MCP roadmap.
Builds on Phase 1 (standalone chat, no tools). This phase adds MCP
host/client capability to ai-chat-service and connects it to Linear's
official remote MCP server, so users can manage Linear issues from
the chat.

---

## 0. Decisions Locked For This Phase

```
MCP server used     : Linear (official, hosted) — https://mcp.linear.app/mcp
Auth model           : OAuth 2.1, one connection per ConnectFlow user
                        (NOT per-app static token — this is what makes it
                        multi-tenant without forking anything)
Where OAuth lives    : ai-chat-service (same service that will host the
                        custom MCP server in Phase 3/4)
Where tokens live    : new table in the existing Chat DB (Postgres, 5435)
                        — tokens encrypted at rest, never sent to frontend
Tool-calling         : Gemini function-calling turned on for the first time
                        (Phase 1 was plain text in/out — this phase adds
                        the tool loop)
Transport to Linear  : Streamable HTTP, JSON-RPC (standard MCP), ai-chat-
                        service acts as the MCP client
```

---

## 1. Why Linear, and Why This Is Different From Trello

Community MCP servers (Trello, etc.) assume one human at a keyboard —
auth is a static API key + token read from a `.env` file at boot, meaning
one server process serves exactly one Trello account. That doesn't work
for a public ConnectFlow deployment where many strangers connect their
own accounts.

Linear's MCP server is built the opposite way on purpose: it's a hosted,
multi-tenant endpoint. Every tool call carries a per-user OAuth token in
the request itself (either via the interactive OAuth handshake or a
Bearer header), and Linear's server figures out *which* user's data to
touch from that token — same request URL for everyone, no forking, no
per-user server instance.

That means ai-chat-service's job is narrow: do the OAuth handshake once
per ConnectFlow user, keep their Linear token on file, and attach it to
every MCP call made on their behalf.

---

## 2. Directory Additions to ai-chat-service

```
services/ai-chat-service/
├── src/
│   ├── api/
│   │   ├── integrations.controller.ts   # NEW — /connect, /callback, /disconnect
│   │   └── integrations.routes.ts       # NEW
│   ├── application/
│   │   ├── connect-linear.usecase.ts    # NEW — builds authorize URL
│   │   ├── handle-linear-callback.usecase.ts   # NEW — code -> tokens
│   │   └── send-message.usecase.ts      # MODIFIED — now runs a tool loop
│   ├── domain/
│   │   └── integration-connection.entity.ts    # NEW
│   ├── infrastructure/
│   │   ├── repositories/
│   │   │   └── integration-connection.repository.ts   # NEW — Prisma
│   │   ├── mcp/
│   │   │   └── linear-mcp.client.ts     # NEW — JSON-RPC client for mcp.linear.app
│   │   ├── crypto/
│   │   │   └── token-cipher.ts          # NEW — AES-256-GCM encrypt/decrypt
│   │   └── ai/
│   │       └── gemini.client.ts         # MODIFIED — add function-calling support
```

---

## 3. Data Model — New Table in the Chat DB

```prisma
model IntegrationConnection {
  id            String   @id @default(uuid())
  userId        String                      // ConnectFlow user, from JWT
  provider      String                      // "linear" for now, extensible later
  accessToken   String                      // encrypted (AES-256-GCM) before storing
  refreshToken  String?                     // encrypted; Linear tokens are refreshable
  expiresAt     DateTime
  linearUserId  String?                     // Linear's own user id, from the token grant
  scope         String                      // e.g. "read,write"
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@unique([userId, provider])
  @@index([userId])
}
```

One row per (ConnectFlow user, provider) pair. `provider` is a string,
not an enum tied to Linear specifically — Phase 2 only populates
`"linear"`, but the shape holds up if a second MCP integration is ever
added later without a schema rewrite.

---

## 4. Env Vars Needed (New, On Top Of Phase 1's)

```
LINEAR_MCP_URL             = https://mcp.linear.app/mcp
LINEAR_OAUTH_CLIENT_ID     = <from Linear workspace settings -> API -> OAuth Applications>
LINEAR_OAUTH_CLIENT_SECRET = <same place>
LINEAR_OAUTH_REDIRECT_URI  = https://yourdomain.com/api/integrations/linear/callback
LINEAR_OAUTH_SCOPE         = read,write
TOKEN_ENCRYPTION_KEY       = <32-byte key, base64 — for AES-256-GCM on stored tokens>
```

Register a real OAuth application in Linear (Workspace Settings → API →
OAuth Applications) rather than relying on Linear's dynamic client
registration — a stable `client_id`/`client_secret` pair is what you
want for a public-facing app you control, not an ephemeral DCR client
minted per session.

Add all of these to `config/env.ts`'s zod schema so boot fails fast if
any are missing, same pattern as `GEMINI_API_KEY` in Phase 1.

---

## 5. New Endpoints

```
GET    /api/integrations/linear/connect      -> 302 redirect to Linear's OAuth authorize page
GET    /api/integrations/linear/callback     -> exchanges code for tokens, redirects back to chat UI
DELETE /api/integrations/linear              -> revokes + deletes the stored connection
GET    /api/integrations                     -> { linear: { connected: true, connectedAt } } — for UI state
```

All of these (except the callback itself, which Linear redirects the
browser to) sit behind the same `auth.middleware` JWT check as the rest
of ai-chat-service's routes.

---

## 6. OAuth Connection Flow (End-to-End)

```
User (browser)          ai-chat-service              Linear
  |--GET /connect (JWT)------>|
  |                           | build authorize URL:
  |                           |   https://linear.app/oauth/authorize
  |                           |     ?client_id=...
  |                           |     &redirect_uri=.../callback
  |                           |     &response_type=code
  |                           |     &scope=read,write
  |                           |     &state=<signed, contains ConnectFlow userId>
  |<--302 redirect------------|
  |----browser navigates to Linear---------------------->|
  |                                    user logs in, approves
  |<---redirect to redirect_uri?code=...&state=...--------|
  |--GET /callback?code&state->|
  |                           | verify state -> extract ConnectFlow userId
  |                           | POST https://api.linear.app/oauth/token
  |                           |   (code, client_id, client_secret, redirect_uri) --->|
  |                           |<--- { access_token, refresh_token, expires_in } -----|
  |                           | encrypt tokens, upsert IntegrationConnection
  |                           |   (userId, provider="linear")
  |<--302 redirect to /chat (connected)---|
```

`state` is a signed JWT (short-lived, same `JWT_SECRET`) carrying the
ConnectFlow `userId` — this is what ties the OAuth callback back to the
right user, since the callback itself has no session/cookie context by
default.

---

## 7. Tool-Calling Flow (This Is the Part Phase 1 Didn't Have)

Gemini needs to know Linear's tools exist before it can decide to call
one. Fetch the tool list from Linear's MCP server once (cache it — tool
schemas don't change per request), hand it to Gemini as function
definitions, and loop until Gemini stops asking for tool calls.

```
Client              ai-chat-service                 Gemini              Linear MCP
  |--"create a bug ticket for the login timeout"-->|
  |                    | load user's IntegrationConnection (linear)
  |                    | if !connected: reply asking user to connect Linear first
  |                    | decrypt access token, check expiresAt
  |                    |   if near expiry -> refresh via Linear token endpoint, re-save
  |                    | linearTools = LinearMcpClient.listTools()  (cached, 1h TTL)
  |                    |--generate(context, tools=linearTools)-------------->|
  |                    |<--tool_call: create_issue({title, teamId, ...})-----|
  |                    | LinearMcpClient.callTool("create_issue", args, userToken) ------->|
  |                    |<-------------------------------------------------- { issue.url, id }|
  |                    |--generate(context + tool_result)------------------>|
  |                    |<--final text: "Created LIN-142, here's the link"---|
  |<--SSE stream of final text-----------------------|
```

Two Gemini round-trips per tool call: one to decide + emit the call,
one to turn the tool result into a natural-language reply. This is the
standard function-calling pattern — nothing ConnectFlow-specific about
the shape, just new for this project.

---

## 8. Pseudocode — Core Pieces

### 8.1 `infrastructure/crypto/token-cipher.ts`

```
function encrypt(plaintext, key):
  iv = randomBytes(12)
  cipher = createCipheriv("aes-256-gcm", key, iv)
  encrypted = cipher.update(plaintext) + cipher.final()
  authTag = cipher.getAuthTag()
  return base64(iv + authTag + encrypted)   // store as one string

function decrypt(stored, key):
  buf = base64decode(stored)
  iv = buf[0:12]; authTag = buf[12:28]; encrypted = buf[28:]
  decipher = createDecipheriv("aes-256-gcm", key, iv)
  decipher.setAuthTag(authTag)
  return decipher.update(encrypted) + decipher.final()
```

### 8.2 `application/connect-linear.usecase.ts`

```
function buildAuthorizeUrl(connectFlowUserId):
  state = jwt.sign({ userId: connectFlowUserId }, env.JWT_SECRET, { expiresIn: "10m" })
  return `https://linear.app/oauth/authorize` +
    `?client_id=${env.LINEAR_OAUTH_CLIENT_ID}` +
    `&redirect_uri=${env.LINEAR_OAUTH_REDIRECT_URI}` +
    `&response_type=code&scope=${env.LINEAR_OAUTH_SCOPE}` +
    `&state=${state}`
```

### 8.3 `application/handle-linear-callback.usecase.ts`

```
async function execute(code, state):
  { userId } = jwt.verify(state, env.JWT_SECRET)   // throws if tampered/expired

  tokenRes = await fetch("https://api.linear.app/oauth/token", {
    method: "POST",
    body: {
      code, client_id: env.LINEAR_OAUTH_CLIENT_ID,
      client_secret: env.LINEAR_OAUTH_CLIENT_SECRET,
      redirect_uri: env.LINEAR_OAUTH_REDIRECT_URI,
      grant_type: "authorization_code"
    }
  })
  { access_token, refresh_token, expires_in } = await tokenRes.json()

  await integrationRepo.upsert({
    userId, provider: "linear",
    accessToken: encrypt(access_token, env.TOKEN_ENCRYPTION_KEY),
    refreshToken: encrypt(refresh_token, env.TOKEN_ENCRYPTION_KEY),
    expiresAt: now() + expires_in * 1000,
    scope: env.LINEAR_OAUTH_SCOPE
  })

  return { redirectTo: "/chat?linear=connected" }
```

### 8.4 `infrastructure/mcp/linear-mcp.client.ts`

```
class LinearMcpClient:
  constructor(baseUrl = env.LINEAR_MCP_URL)

  async listTools(accessToken):
    res = await jsonRpcCall(this.baseUrl, "tools/list", {}, accessToken)
    return res.tools   // [{ name, description, inputSchema }, ...]

  async callTool(name, args, accessToken):
    res = await jsonRpcCall(this.baseUrl, "tools/call", { name, arguments: args }, accessToken)
    return res.content

  async jsonRpcCall(url, method, params, accessToken):
    response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`
      },
      body: JSON.stringify({ jsonrpc: "2.0", id: uuid(), method, params })
    })
    body = await response.json()
    if body.error: throw new McpToolError(body.error.message)
    return body.result
```

Every call here is stateless from ai-chat-service's side — the Bearer
token is what tells Linear's server whose workspace to touch. No
per-user server process, no per-user URL.

### 8.5 `application/send-message.usecase.ts` (modified — tool loop added)

```
constructor(sessionRepo, messageRepo, contextCache, geminiClient,
            integrationRepo, linearMcpClient, tokenCipher, logger)

async *execute(sessionId, userId, content, requestId):
  session = await sessionRepo.findById(sessionId)
  if !session: throw new NotFoundError()
  if session.userId != userId: throw new ForbiddenError()

  userMsg = ChatMessage.createUserMessage(sessionId, content)
  await messageRepo.create(userMsg)

  context = await contextCache.get(sessionId) ?? await messageRepo.getLastN(sessionId, 20)

  connection = await integrationRepo.find(userId, "linear")
  tools = []
  if connection:
    accessToken = await ensureFreshToken(connection)   // refreshes if near expiry
    tools = await linearMcpClient.listTools(accessToken)   // cached 1h, per user token

  fullText = ""
  messages = [...context, userMsg]

  loop:
    result = await geminiClient.generate(messages, { tools })

    if result.type == "tool_call":
      yield { type: "tool_start", tool: result.toolName }
      toolResult = await linearMcpClient.callTool(result.toolName, result.args, accessToken)
      messages.push(result.toolCallMessage, { role: "tool", content: toolResult })
      continue loop   // let Gemini turn the tool result into a reply

    if result.type == "text_chunk":
      fullText += result.chunk
      yield { type: "chunk", data: result.chunk }

    if result.type == "done":
      break loop

  assistantMsg = ChatMessage.createAssistantMessage(sessionId, fullText, false)
  await messageRepo.create(assistantMsg)
  await contextCache.append(sessionId, [userMsg, assistantMsg])
  yield { type: "done", messageId: assistantMsg.id }
```

`ensureFreshToken` decrypts the stored token, and if `expiresAt` is
within a few minutes, calls Linear's token endpoint with the (decrypted)
refresh token, then re-encrypts and saves the new pair before
proceeding — same idea as any OAuth refresh flow, just tucked behind
this one helper so the use case above doesn't need to know about it.

### 8.6 `api/integrations.controller.ts`

```
async function connectLinear(req, res):
  url = connectLinearUseCase.buildAuthorizeUrl(req.user.id)
  res.redirect(url)

async function linearCallback(req, res):
  { redirectTo } = await handleLinearCallbackUseCase.execute(req.query.code, req.query.state)
  res.redirect(redirectTo)

async function disconnectLinear(req, res):
  await integrationRepo.delete(req.user.id, "linear")
  res.status(204).send()
```

---

## 9. Error Handling & Edge Cases (New, On Top Of Phase 1's List)

```
User has no Linear connection, asks for a Linear action
  -> skip tool discovery, let Gemini reply in plain text prompting them
     to connect Linear first (no tool list = no tool call attempted)

OAuth state invalid/expired
  -> reject callback with 400 before any token exchange is attempted

Linear token expired mid-conversation
  -> ensureFreshToken catches this before the MCP call, refreshes silently
  -> if refresh itself fails (refresh token revoked) -> mark connection as
     stale, prompt user to reconnect, don't crash the chat turn

Linear MCP call fails (rate limited, tool error, network)
  -> caught as McpToolError -> fed back into the Gemini loop as a tool
     error result so Gemini can explain the failure to the user in plain
     language, instead of the whole SSE stream erroring out

User disconnects Linear mid-session
  -> next message re-checks IntegrationConnection -> tools list becomes
     empty again -> falls back to plain text, no stale token used
```

---

## 10. Build Order

```
1. Register the OAuth application in Linear (get client_id/secret, set redirect_uri)
2. Prisma migration: IntegrationConnection table
3. token-cipher.ts — encrypt/decrypt round-trip, unit test in isolation
4. connect-linear + handle-linear-callback use cases, wired to real Linear OAuth
   endpoint (verify a token lands in the DB, encrypted)
5. linear-mcp.client.ts — standalone script hitting mcp.linear.app/mcp with a
   manually-obtained token, confirm tools/list and tools/call work before
   wiring into the chat flow
6. Add function-calling support to gemini.client.ts (tools param, tool_call
   response type)
7. Rewrite send-message.usecase.ts with the tool loop; unit-test the generator
   against mocked LinearMcpClient + mocked GeminiClient tool_call responses
8. integrations.controller.ts + routes, gateway proxy entries
9. Frontend: "Connect Linear" button + connected/disconnected state,
   read from GET /api/integrations
10. docker-compose / Makefile / env.ts schema updates
```

---

## 11. What's Deliberately Deferred to Later Phases

```
- Only Linear is wired up — the IntegrationConnection shape is generic,
  but no second provider is implemented yet
- No token revocation webhook handling (if a user revokes access from
  Linear's side directly, ai-chat-service won't know until the next
  API call fails)
- No per-tool permission gating in the UI (any connected user can
  trigger any Linear tool the OAuth scope allows)
- Phase 3 (your own MCP server) reuses this same tool-loop shape in
  send-message.usecase.ts — the loop doesn't care whether tools come
  from Linear's server or your own
```
