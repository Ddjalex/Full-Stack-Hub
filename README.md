# Full-Stack Auth App

A complete full-stack web application with user authentication and an admin dashboard.

## Tech Stack

- **Frontend**: React + Vite + Tailwind CSS + shadcn/ui
- **Backend**: Node.js + Express 5
- **Database**: PostgreSQL (Neon or any PostgreSQL-compatible provider)
- **ORM**: Drizzle ORM
- **Auth**: JWT (JSON Web Tokens) + bcrypt password hashing
- **Monorepo**: pnpm workspaces

## Features

- User registration and login with email + password
- JWT-based authentication (token stored in localStorage)
- Protected user dashboard
- Admin dashboard with user management (list, search, filter, promote/demote, delete)
- Role-based access control (user / admin)
- Fully responsive UI

## Project Structure

```
/artifacts
  /api-server       — Express backend (routes, middleware)
  /web              — React + Vite frontend (pages, components)

/lib
  /db               — Drizzle ORM schema and database client
  /api-spec         — OpenAPI specification (source of truth)
  /api-client-react — Auto-generated React Query hooks (from OpenAPI)
  /api-zod          — Auto-generated Zod validation schemas (from OpenAPI)
```

## Setup

### 1. Environment variables

Copy `.env.example` and create a `.env` file in the project root (or set them in your hosting environment):

```bash
cp .env.example .env
```

Edit `.env` with your values:

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string (Neon or local) |
| `JWT_SECRET` | Secret key for signing JWTs (use `openssl rand -hex 32`) |
| `NODE_ENV` | `development` or `production` |

### 2. Using Neon PostgreSQL

1. Create a project at [neon.tech](https://neon.tech)
2. Copy your connection string from the Neon dashboard
3. Paste it as `DATABASE_URL` in your environment variables
4. The app is pre-configured for Neon's SSL requirements

### 3. Install dependencies

```bash
pnpm install
```

### 4. Push database schema

This creates all the necessary tables in your PostgreSQL database:

```bash
pnpm --filter @workspace/db run push
```

### 5. Run the application

The app runs as two separate services managed by the Replit workflow system:

- **API Server** — Express backend at `/api`
- **Web** — React frontend at `/`

Both start automatically via the Replit workflow. To run locally:

```bash
# API server
pnpm --filter @workspace/api-server run dev

# Frontend (in another terminal)
pnpm --filter @workspace/web run dev
```

## API Endpoints

### Auth

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register a new user |
| `POST` | `/api/auth/login` | Login with email + password |
| `POST` | `/api/auth/logout` | Logout (clears client token) |
| `GET` | `/api/auth/me` | Get current user (requires auth) |

### Users (admin only)

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/users` | List all users (with search/filter) |
| `GET` | `/api/users/stats` | Get user statistics |
| `GET` | `/api/users/:id` | Get a user by ID |
| `PATCH` | `/api/users/:id` | Update user role or name |
| `DELETE` | `/api/users/:id` | Delete a user |

## Database Schema

### `users` table

| Column | Type | Description |
|---|---|---|
| `id` | `serial` | Primary key |
| `full_name` | `text` | User's full name |
| `email` | `text` | Unique email address |
| `password_hash` | `text` | bcrypt password hash |
| `role` | `enum` | `user` or `admin` |
| `created_at` | `timestamp` | Account creation date |

## Making yourself an admin

After registering your first account, update your role in the database:

```sql
UPDATE users SET role = 'admin' WHERE email = 'your@email.com';
```

Or run it via Drizzle Studio:
```bash
pnpm --filter @workspace/db run studio
```

## Regenerating API types

After changing `lib/api-spec/openapi.yaml`:

```bash
pnpm --filter @workspace/api-spec run codegen
```

## Environment variables summary

```
DATABASE_URL      — Required. PostgreSQL connection string.
JWT_SECRET        — Required. Secret for JWT signing. Keep this secure.
NODE_ENV          — Optional. development | production (default: development).
```
