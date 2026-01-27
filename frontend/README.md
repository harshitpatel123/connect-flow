# ConnectFlow – Frontend

This is the frontend application for **ConnectFlow**, built using **Next.js (App Router)** and **Apollo Client**.

The frontend is intentionally kept minimal and thin.  
All business logic lives in the backend.

---

## Tech Stack

- Next.js (App Router)
- Apollo Client
- GraphQL
- Plain CSS (for now)

---

## Folder Structure

src/
├── app/ # Next.js routes
│ ├── layout.js
│ ├── globals.css
│ ├── page.js
│ ├── auth/
│ │ ├── login/page.js
│ │ └── signup/page.js
│ └── post/
│ ├── create/page.js
│ └── page.js
│
├── components/ # Reusable UI components
│
├── graphql/ # GraphQL client & APIs
│ ├── client.js # Apollo Client setup
│ └── auth.api.js # Auth queries & mutations
│
├── hooks/ # Custom hooks (e.g. useAuth)
├── lib/ # Helpers (tokens, constants)
└── styles/


---

## GraphQL Integration

- Apollo Client is initialized in `src/graphql/client.js`
- Each backend module maps to **one API file**
  - `auth.api.js`
  - `post.api.js` (future)

UI components import GraphQL operations directly from these files.

---

## Authentication Flow

1. User submits login/signup form
2. Frontend calls GraphQL mutation
3. Backend returns `accessToken`
4. Token is stored (localStorage for now)
5. Apollo Client sends token in `Authorization` header

---

## Important Rules

- Frontend contains **no business logic**
- Backend is the source of truth
- UI is allowed to be simple and unpolished
- Features are added only when backend support exists

---

This README will be expanded as the project grows.
