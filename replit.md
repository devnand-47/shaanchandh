# CineConnect

## Overview

CineConnect is a full-stack networking platform for film industry professionals (actors, directors, cameramen, editors, musicians, writers, producers). Built as a pnpm workspace monorepo with TypeScript.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite + Tailwind CSS + shadcn/ui + wouter + TanStack Query
- **Backend**: Express 5 + Drizzle ORM + PostgreSQL
- **Auth**: Clerk (via `@clerk/express` + `@clerk/react`)
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec in `lib/api-spec/`)
- **Build**: esbuild (API server)

## Architecture

```
artifacts/
  api-server/     — Express API server (port 8080, maps to external port 80)
  cineconnect/    — React + Vite frontend (port 21627, maps to external port 3000)

lib/
  api-spec/       — OpenAPI spec (openapi.yaml) — source of truth for API
  api-zod/        — Zod schemas generated from OpenAPI spec
  api-client-react/ — React Query hooks generated from OpenAPI spec
  db/             — Drizzle ORM schema + client
```

## Key Features

- **User Profiles**: roles, skills, bio, portfolio, online status, verified badge, star ratings
- **Feed/Search**: browse professionals by role, skill, location with pagination
- **Projects**: post film projects with required roles, apply, bookmark
- **Chat**: real-time-style 1-to-1 messaging with conversation list
- **Notifications**: new messages, profile views, applications, reviews
- **Bookmarks**: save projects for later
- **Ratings/Reviews**: star ratings with comments

## Pages

- `/` — Landing page (signed-out) or redirect to `/feed` (signed-in)
- `/sign-in`, `/sign-up` — Clerk auth pages
- `/feed` — Browse professionals
- `/projects` — Browse and post projects
- `/projects/new` — Create new project
- `/projects/:id` — Project details, apply
- `/profile/me` — Edit own profile
- `/profile/:userId` — View user profile, send message, leave review
- `/chat` — Conversation list
- `/chat/:userId` — Chat room
- `/notifications` — Notification feed
- `/bookmarks` — Saved projects

## API Routes

All API routes are at `/api/*` on port 8080:
- `GET /api/users/me` — Current user (auto-creates on first login)
- `PUT /api/users/me` — Update profile
- `GET /api/users` — List/search users
- `GET /api/users/:userId` — Get user profile
- `POST /api/users/:userId/view` — Record profile view
- `GET /api/feed/stats` — Feed statistics
- `GET /api/projects` — List projects
- `POST /api/projects` — Create project
- `GET /api/projects/:id` — Get project
- `POST /api/projects/:id/apply` — Apply to project
- `POST /api/projects/:id/bookmark` — Toggle bookmark
- `GET /api/messages/conversations` — List conversations
- `GET /api/messages/conversations/:id` — Get messages
- `POST /api/messages/send` — Send message
- `GET /api/messages/unread-count` — Get unread count
- `GET /api/reviews/:userId` — Get user reviews
- `POST /api/reviews/:userId` — Create review
- `GET /api/notifications` — List notifications
- `POST /api/notifications/mark-all-read` — Mark all read
- `PUT /api/notifications/:id/read` — Mark one read

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally
- `pnpm --filter @workspace/cineconnect run dev` — run frontend locally

## Design

- Dark cinematic theme: deep navy background `hsl(224, 71%, 4%)`, deep crimson primary `hsl(346, 87%, 43%)`
- Font: Outfit (sans) + Playfair Display (serif)
- Mobile-responsive: bottom nav on mobile, sidebar on desktop
- Inspired by Instagram/WhatsApp/LinkedIn aesthetics for film industry

## Clerk Configuration

- Clerk proxy path: `/api/__clerk` (handled by API server)
- `VITE_CLERK_PUBLISHABLE_KEY` — Frontend publishable key
- `VITE_CLERK_PROXY_URL` — Proxy URL for Clerk (set for production)
- `CLERK_SECRET_KEY` — Backend secret key
- Vite dev server proxies `/api` → `localhost:8080`
