# PROMPT PARA ANTIGRAVITY — ORODIG PTS

## QUÉ ES ESTE PROYECTO

Eres el agente encargado de poner en marcha el proyecto **ORODIG PTS** ("Oro Digital Para Todos") de forma local, sin cambiar absolutamente nada del código. La plataforma es una aplicación MLM/red de mercadeo full-stack ya desarrollada y funcional. Tu único trabajo es levantar el entorno y que todo corra exactamente como está.

---

## STACK TÉCNICO

- **Runtime:** Node.js 24 + pnpm (workspaces monorepo)
- **Frontend:** React + Vite + TailwindCSS + shadcn/ui + Recharts + Framer Motion → corre en puerto **18587**
- **Backend API:** Express 5 + JWT (jsonwebtoken + bcryptjs) → corre en puerto **8080**
- **Base de datos:** PostgreSQL + Drizzle ORM
- **Validación:** Zod v3
- **Codegen:** Orval (genera hooks React Query y schemas Zod desde OpenAPI spec)
- **Build del server:** esbuild (bundle CJS)
- **TypeScript:** 5.9 estricto

---

## ESTRUCTURA DEL PROYECTO (monorepo pnpm)

```
/
├── artifacts/
│   ├── api-server/          ← servidor Express (API REST)
│   └── orodig-pts/          ← frontend React/Vite
├── lib/
│   ├── api-spec/            ← openapi.yaml (fuente de verdad del contrato API)
│   ├── api-client-react/    ← hooks React Query generados por Orval
│   ├── api-zod/             ← schemas Zod generados por Orval
│   └── db/                  ← schema Drizzle ORM + migraciones
├── pnpm-workspace.yaml
├── package.json
└── tsconfig.json
```

---

## VARIABLES DE ENTORNO REQUERIDAS

Crea un archivo `.env` en la raíz O configura estas variables en tu entorno:

```env
DATABASE_URL=postgresql://usuario:contraseña@localhost:5432/orodig_pts
SESSION_SECRET=cualquier_string_secreto_aqui_para_firmar_jwt
```

> El `SESSION_SECRET` tiene un fallback hardcodeado para dev, pero en producción debe estar definido.
> El `DATABASE_URL` es OBLIGATORIO. Necesitas PostgreSQL corriendo localmente.

---

## CÓMO LEVANTAR EL PROYECTO LOCAL

```bash
# 1. Instalar dependencias
pnpm install

# 2. Empujar el schema a la base de datos (solo la primera vez)
pnpm --filter @workspace/db run push

# 3. Levantar el servidor API (terminal 1)
pnpm --filter @workspace/api-server run dev

# 4. Levantar el frontend (terminal 2)
pnpm --filter @workspace/orodig-pts run dev
```

- La API corre en: http://localhost:8080
- El frontend corre en: http://localhost:18587
- El frontend hace llamadas a `/api/*` que deben apuntar al backend

### NOTA SOBRE EL PROXY
El proyecto usa un reverse proxy en Replit que enruta `/api/*` → backend. Para local, configura un proxy en Vite. Revisa `artifacts/orodig-pts/vite.config.ts` para la configuración actual.

---

## DATOS DE DEMO (ya en la base de datos)

Para que los datos demo existan, ejecuta el seed SQL que está en el proyecto o importa el dump de la DB. Los miembros demo son:

| Username | Password | Rango | Notas |
|---|---|---|---|
| `admin` | `admin123` | Accionista ORODIG | Administrador, acceso total |
| `carlos_mx` | `demo123` | Oro | Miembro activo, 4 referidos directos |
| `maria_garcia` | `demo123` | Diamante Azul | Miembro activo, 8 referidos directos |
| `ana_lopez` | `demo123` | Bronce | Miembro básico |
| `pedro_ruiz` | `demo123` | Bronce | Miembro básico |
| `sofia_torres` | `demo123` | Plata | Membresía pendiente (45 días) |
| `marco_diaz` | `demo123` | Bronce | Membresía inactiva (65 días) |

---

## QUÉ HACE LA PLATAFORMA

### 1. AUTENTICACIÓN
- Login con usuario + contraseña → JWT guardado en `localStorage` como `orodig_token`
- Registro con código de referido opcional
- El JWT se envía como `Authorization: Bearer <token>` en cada request

### 2. DASHBOARD (`/dashboard`)
- Saldo disponible, puntos, ganancias totales, tamaño de red
- Gráfico de barras: ganancias últimos 6 meses
- Gráfico donut: desglose por tipo de ingreso
- Estado de membresía (semáforo Verde/Amarillo/Rojo/Gris)
- Accesos rápidos a Rangos, Premios y Plan
- Progreso hacia el siguiente rango

### 3. MI RED (`/network`)
- Árbol visual de referidos hasta 3 niveles de profundidad
- Muestra rango, ganancias y estado de cada miembro

### 4. GANANCIAS (`/earnings`)
- Historial completo de todas las transacciones
- 6 tipos de ingreso: referidos, ventas, compras, liderazgo, trabajo, pasivo

### 5. CLASIFICACIÓN (`/leaderboard`)
- Top 10 de mayores ganadores de la red
- Muestra rango, ganancias totales, red total

### 6. PRODUCTOS / TIENDA (`/products`)
- 8 paquetes reales ORODIG PTS:
  - Suscripción a la Plataforma — $36
  - Pequeño Aprendiz — $150
  - Mediano Liderazgo — $250
  - Gran Líder — $550
  - Director de Líderes — $850
  - Director de Directores — $1,100
  - Director de Zonas — $1,700
  - Director de Países — $6,200
- Comprar deduce del saldo y acredita puntos

### 7. RETIROS (`/withdrawals`)
- Solicitar retiro del saldo disponible
- Historial de retiros con estado (pendiente/aprobado/rechazado)

### 8. RANGOS MINEROS (`/rangos`)
- Los 15 rangos del sistema ORODIG:
  Bronce → Cobre → Crisolito → Belirio Rojo → Tanzanita Verde → Plata → Oro → Esmeralda Azul → Esmeralda Verde → Diamante Azul → Danzanita Verde → Diamante Fantasía → Zafiro Amarillo → Alejandrita Especial → Accionista ORODIG
- Cada rango con: requisito, bono por referido, y premio
- Indicador de tu rango actual con progreso

### 9. PREMIOS & METAS (`/premios`)
- Sistema de fracciones (puntos) para premios físicos:
  - 🏍️ Moto: 300,000 fracciones
  - 🚗 Carro: 900,000 fracciones
  - 🏠 Casa de Lujo: 2,000,000 fracciones
  - ✈️ Viaje Exclusivo 3 días / 2 noches (para mejores líderes)
- Bono Quincenal: $250 USD por semana (ganadores listados)

### 10. PLAN DE COMPENSACIÓN (`/plan`)
- Bono por referido directo (nivel 1): varía por paquete vendido
- Comisiones por niveles hasta el nivel 50:
  - Nivel 2: 8%, Nivel 3: 5%, Niveles 4-5: ÷6, Niveles 6-8: ÷3, Niveles 9-10: ÷2, Niveles 11-50: ÷1
- Tabla de bono por rango (de $12 a $200 USD por referido)
- Fechas de pago: primeros 5 días y del 15 al 20 de cada mes

### 11. MI PERFIL (`/profile`)
- Tabs: Perfil / Editar / Compras
- Ver info de contacto, código de referido, estado de membresía
- Semáforo de membresía con días restantes hasta renovar
- Editar nombre, email, teléfono, contraseña
- Historial de compras

### 12. PANEL ADMIN (`/admin`) — solo usuario `admin`
- Tabs: Estadísticas, Retiros, Productos, Miembros
- Ver/aprobar/rechazar retiros
- Agregar/editar/eliminar productos
- Ver todos los miembros

---

## SISTEMA DE MEMBRESÍA (SEMÁFORO)

Basado en `last_payment_at` en la tabla `members`:
- 🟢 **Verde — Activo**: 0-30 días desde el último pago
- 🟡 **Amarillo — Activo Pendiente**: 31-60 días (renovar pronto)
- 🔴 **Rojo — Inactivo**: 61+ días
- ⚫ **Gris — Eliminado**: 6+ meses

---

## RUTAS DE LA API

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/register` | Registro con código referido opcional |
| GET | `/api/auth/me` | Perfil del usuario autenticado |
| PUT | `/api/auth/profile` | Actualizar perfil |
| GET | `/api/dashboard/summary` | KPIs del dashboard |
| GET | `/api/dashboard/activity` | Actividad reciente |
| GET | `/api/earnings` | Historial de ganancias |
| GET | `/api/network` | Árbol de red |
| GET | `/api/leaderboard` | Top 10 |
| GET | `/api/products` | Catálogo de productos |
| POST | `/api/purchases` | Comprar producto |
| GET | `/api/purchases` | Historial de compras |
| POST | `/api/withdrawals` | Solicitar retiro |
| GET | `/api/withdrawals` | Historial de retiros |
| GET | `/api/admin/*` | Rutas administrativas (requiere rol admin) |

---

## COMANDOS ÚTILES

```bash
# Regenerar hooks y schemas después de cambiar openapi.yaml
pnpm --filter @workspace/api-spec run codegen

# Typecheck completo del monorepo
pnpm run typecheck

# Push de cambios al schema de DB
pnpm --filter @workspace/db run push

# Build completo
pnpm run build
```

---

## LO QUE NO DEBES CAMBIAR

**NO cambies absolutamente nada del código.** Solo levanta el entorno:
1. Instala pnpm si no lo tienes: `npm install -g pnpm`
2. Configura PostgreSQL con la DB vacía y corre `pnpm --filter @workspace/db run push`
3. Crea el `.env` con `DATABASE_URL` y `SESSION_SECRET`
4. Instala dependencias: `pnpm install`
5. Corre los dos servicios (API + frontend) en terminales separadas
6. Importa los datos demo con el seed SQL si los necesitas

La plataforma debe verse y funcionar exactamente igual que en Replit: fondo negro, tema dorado `hsl(42,68%,50%)`, todos los menús en español, con los 15 rangos, las 3 páginas nuevas (Rangos, Premios, Plan) y el semáforo de membresía.
