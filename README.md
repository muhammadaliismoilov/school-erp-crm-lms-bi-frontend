# Yuton School — Frontend

Production-grade **Next.js 14** (App Router) admin console for the Yuton School
management platform. Talks to the NestJS backend over a typed, envelope-aware
API client with JWT auth and transparent token refresh.

## Stack

- Next.js 14 (App Router, RSC) · TypeScript (strict)
- Tailwind CSS — custom "scholarly institutional" design system (Fraunces +
  Schibsted Grotesk, navy/amber, channel-based color tokens for opacity)
- TanStack Query (server state) · Zustand (auth) · React Hook Form
- i18n: Uzbek / Russian / English with `Accept-Language` wired to the backend
- lucide-react icons

## Backend integration

- `next.config.mjs` proxies `/api/*` to `BACKEND_ORIGIN` (default
  `http://localhost:3000`) so the browser stays same-origin.
- `src/lib/api/client.ts` unwraps the `{ success, data }` envelope, surfaces the
  backend's localized error messages (`error.messages.{uz,ru,en}`), sends
  `Accept-Language`, attaches the bearer token, and performs a single
  deduplicated `/auth/refresh` on `401` before retrying.
- Auth lives in `src/lib/auth/` (token store + Zustand store). Navigation and
  page actions are gated by the same wildcard permission semantics as the
  backend (`students.*`, `*.*`).

### Verified end-to-end

Login (`POST /auth/login`), paginated reads (`/students`, `/crm`), array reads
(`/academic/years`, `/finance/contracts`, `/attendance/students`), and writes
(`POST /students`) all run through the Next proxy against the live backend, with
`401` returned when unauthenticated.

## Run

```bash
cp .env.local.example .env.local   # set BACKEND_ORIGIN if not localhost:3000
npm install
npm run dev                        # http://localhost:3000 (use -p 3001 if the backend uses 3000)
```

Start the backend first (see the backend repo). Sign in with the seeded admin
credentials (`ADMIN_USERNAME` / `ADMIN_PASSWORD` from the backend env).

```bash
npm run build       # production build (all routes verified)
npm run typecheck   # tsc --noEmit
npm run lint        # next lint
```

## Structure

```
src/
  app/
    (auth)/login/            # split-screen sign-in
    (dashboard)/             # protected shell (sidebar + topbar)
      page.tsx               # dashboard with live totals
      students/              # full CRUD reference (list + search + create)
      academic/ attendance/ finance/ crm/
  components/
    layout/                  # sidebar, topbar, language switcher, shell+guard
    ui/                      # button, input, card, badge, data-table, …
  lib/
    api/                     # client, types, per-resource hooks
    auth/                    # token store, zustand store, permissions
    i18n/                    # dictionaries + provider
    nav.ts                   # permission-gated navigation
```

## Extending

Each backend module maps to a folder under `app/(dashboard)`. Reuse
`useResourceList` (paginated `{ items, meta }`) or `useResourceArray` (plain
arrays) plus the shared `DataTable`, add a `NAV_ITEMS` entry with its
permission, and the sidebar reveals it automatically for authorized roles.
