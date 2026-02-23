# ConnectFlow – Frontend

Minimal frontend for **ConnectFlow** built with **Next.js 14 (App Router)** and **Apollo Client**.

> All business logic lives in the backend. Frontend is intentionally thin.

---

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Set environment variable
cp .env.example .env

# Start development server
npm run dev
```

Frontend runs on **http://localhost:3000**

**Prerequisites:** Backend must be running on http://localhost:4000

---

## 🛠 Tech Stack

- **Next.js 14** - App Router with React Server Components
- **Apollo Client** - GraphQL client with caching
- **Tailwind CSS** - Utility-first styling
- **React Hot Toast** - Toast notifications
- **React Select** - Multi-select for categories

---

## 📁 Folder Structure

```
src/
├── app/                    # Next.js App Router
│   ├── auth/
│   │   ├── login/         # Login page
│   │   └── signup/        # Signup page
│   ├── dashboard/         # User's posts
│   ├── feed/              # Personalized feed
│   ├── history/           # Interaction history
│   ├── layout.js          # Root layout with Header
│   ├── providers.js       # Apollo Provider
│   └── page.js            # Landing page
│
├── components/
│   ├── Header.js          # Navigation with user email
│   ├── PostCard.js        # Post display with like/comment
│   └── CreatePostPopup.js # Post creation modal
│
├── graphql/               # GraphQL operations
│   ├── client.js          # Apollo Client setup
│   ├── auth.api.js        # Login, signup
│   ├── post.api.js        # Create post, get posts
│   ├── feed.api.js        # Get feed, regenerate feed
│   ├── interaction.api.js # Like, unlike, comment, view
│   ├── history.api.js     # Interaction history
│   └── user.api.js        # Get current user
│
├── constants/
│   └── categories.js      # Post category options
│
└── lib/
    └── auth.js            # Token management
```


---

## 🔌 Architecture

```
User Browser
     ↓
Next.js Frontend (Port 3000)
     ↓ GraphQL over HTTP
API Gateway (Port 4000)
     ↓ REST
Microservices (Auth, Post, Interaction, Feed)
```

### GraphQL Integration
- Apollo Client configured with auth link (JWT in headers)
- Each backend module = one API file (auth.api.js, post.api.js, etc.)
- Components use `useQuery` and `useMutation` hooks
- Token stored in localStorage (auto-attached to requests)

---

## 🔐 Authentication Flow

1. User submits login/signup form
2. Frontend calls GraphQL mutation (LOGIN/REGISTER)
3. Backend returns `accessToken`
4. Token stored in localStorage
5. Apollo Client auto-attaches token to all requests
6. Protected routes redirect to login if no token

---

## ✨ Features

- ✅ **Authentication** - Login/signup with JWT
- ✅ **Dashboard** - View your posts
- ✅ **Personalized Feed** - Algorithm-ranked posts
- ✅ **Create Posts** - Multi-category tagging
- ✅ **Interactions** - Like, unlike, comment, view
- ✅ **History** - View liked/commented posts
- ✅ **User Display** - Email shown in header
- ✅ **Toast Notifications** - Success/error feedback
- ✅ **Responsive Design** - Tailwind CSS styling

---

## 🎯 Available Scripts

```bash
npm run dev      # Start development server (port 3000)
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

---

## 🌐 Environment Variables

```bash
NEXT_PUBLIC_API_URL=http://localhost:4000
```

**Note:** Must start with `NEXT_PUBLIC_` to be accessible in browser.

---

## 📝 Design Principles

- **No business logic** - All logic in backend
- **Thin client** - UI only handles display & user input
- **Backend-driven** - Features added only when backend supports them
- **Simple & functional** - Focus on functionality over polish

---

## 🔗 Related Documentation

- [Backend README](../backend-new/README.md) - Microservices setup
- [Project Overview](../PROJECT-OVERVIEW.md) - Complete project documentation
- [Scope Overview](../Scope-overview.md) - Architecture principles

---

**Happy coding! 🚀**
