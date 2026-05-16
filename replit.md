# ORODIG PTS

A full-stack MLM/network marketing platform — "Oro Digital Para Todos" — where members earn through referrals, sales, purchases, leadership, work, and passive income.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/orodig-pts run dev` — run the frontend (port 18587)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string, `SESSION_SECRET` — JWT signing secret

## Demo Credentials

- **username:** `demo` / **password:** `demo123` (Plata rank)
- **username:** `carlos_mendoza` / **password:** `demo123` (Diamante rank)
- **username:** `roberto_silva` / **password:** `demo123` (Embajador rank — top earner)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + TailwindCSS + shadcn/ui + Recharts + Framer Motion
- API: Express 5 + JWT auth (jsonwebtoken + bcryptjs)
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — API contract (source of truth)
- `lib/db/src/schema/` — DB schema (members, earnings, products, purchases, withdrawals)
- `artifacts/api-server/src/routes/` — Express route handlers (auth, dashboard, members, earnings, leaderboard, products, withdrawals, network)
- `artifacts/api-server/src/lib/auth.ts` — JWT sign/verify helpers
- `artifacts/api-server/src/middlewares/requireAuth.ts` — Auth middleware
- `artifacts/orodig-pts/src/` — React frontend

## Architecture decisions

- JWT tokens stored in localStorage, sent as Authorization Bearer header
- Custom fetch in `lib/api-client-react/src/custom-fetch.ts` auto-attaches Bearer token
- Session SECRET from `SESSION_SECRET` env var (falls back to hardcoded for dev)
- Referral codes auto-generated on registration (first 4 chars of username + 5 random chars)
- Rank system: Bronce → Plata → Oro → Platino → Diamante → Embajador
- Network tree built recursively to depth 3 to avoid infinite loops

## Product

- User registration with optional referral/sponsor code
- 6 income stream types: referral bonuses, sales commissions, purchase points, leadership bonuses, work bonuses, passive income
- Dashboard with earnings breakdown charts (Recharts donut + bar)
- Referral network tree visualization (indented recursive tree)
- Product marketplace — buying earns points and commissions
- Withdrawal requests with balance deduction
- Leaderboard of top earners
- Rank badge system with distinct colors per level

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Run codegen after any OpenAPI spec change: `pnpm --filter @workspace/api-spec run codegen`
- The `SESSION_SECRET` env var is used for JWT signing — set it in production
- bcryptjs is installed in `api-server` (not root workspace)
- The login background image is at `attached_assets/image_1778968907902.png` and referenced via `@assets/` alias

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
