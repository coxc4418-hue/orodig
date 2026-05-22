# ORODIG PTS — Oro Digital Para Todos

Plataforma MLM full-stack: React (Firebase Hosting) + API Express (Render) + Firestore.

## Estructura

| Paquete | Descripción |
|---------|-------------|
| `artifacts/orodig-pts` | Frontend de producción |
| `artifacts/api-server` | API REST (`/api`) |
| `lib/db` | Esquemas Drizzle + adaptador Firestore |
| `lib/api-spec` | OpenAPI → codegen (React Query + Zod) |

## Requisitos

- Node.js 22+
- pnpm 10.33.2
- Cuenta Firebase (`oro-dig`) y Render (`orodig`)

## Variables de entorno

Copia `.env.example`. En **producción (Render)** son obligatorias:

- `SESSION_SECRET` — firma JWT
- `FIREBASE_SERVICE_ACCOUNT_JSON` — JSON de la cuenta de servicio (una línea)

Sin la cuenta de servicio, la API no puede escribir en Firestore si las reglas están cerradas.

## Desarrollo local

```bash
pnpm install
pnpm --filter @workspace/api-server run dev   # API :8080
pnpm --filter @workspace/orodig-pts run dev  # UI :5173 (proxy /api)
```

## Build y despliegue

```bash
pnpm install
pnpm --filter @workspace/api-spec run codegen
pnpm run build
firebase deploy --only hosting,firestore:rules
```

Render despliega la API automáticamente desde `render.yaml` al hacer push a la rama conectada.

## Roles

- **Miembro**: usuario autenticado (JWT).
- **Admin**: `username === "admin"`.

## Documentación histórica

`replit.md` y `ANTIGRAVITY_PROMPT.md` mencionan PostgreSQL; el runtime usa **Firestore**, no Postgres.
