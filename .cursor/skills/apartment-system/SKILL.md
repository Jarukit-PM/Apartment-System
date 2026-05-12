---
name: apartment-system
description: >-
  Guides design and implementation for the Apartment System monorepo (Next.js,
  Go REST API, MongoDB). Covers layered architecture, SOLID-oriented Go and
  TypeScript practices, REST conventions, docs under docs/, and alignment with
  roadmap phases. Use when editing apps/web, services/api, docs, Docker, or
  when the user mentions apartment management, property CRUD, leases, or
  this repository's architecture.
---

# Apartment System — development skill

## Stack and boundaries

- **Web**: `apps/web` — Next.js (App Router), TypeScript. UI, SSR, server-side `fetch` to the API via `API_URL`. Avoid duplicating business rules that belong in Go.
- **API**: `services/api` — Go, `chi`, official MongoDB driver. REST, validation, persistence, future auth.
- **Data**: MongoDB — collections and indexes per `docs/data-model.md`.
- **Orchestration**: Root `docker-compose.yml` and `.devcontainer/` for local parity.

Before coding non-trivial features, read the relevant section of `docs/architecture.md`, `docs/api-overview.md`, and `docs/data-model.md`.

---

## Design-first workflow

1. **Clarify scope** — Single-building vs multi-property; auth method (credentials vs OAuth). Record decisions in docs or ADR-style notes in `docs/architecture.md` when they affect code.
2. **Model and contracts** — Update or confirm `docs/data-model.md` (indexes, uniqueness). For HTTP, follow `docs/api-overview.md` (versioning under `/v1`, error shape, pagination).
3. **Implement in layers** — Handler (HTTP) → service (use cases) → repository (MongoDB). See **Go layering** below.
4. **Verify** — `GET /health` unversioned; versioned routes under `/v1`. Prefer integration tests for critical paths (roadmap Phase 6).

---

## Module map (what the system is made of)

| Module | Responsibility | Primary location |
|--------|----------------|------------------|
| **Platform / config** | Env, timeouts, CORS, logging, graceful shutdown | `internal/config`, `cmd/server` |
| **HTTP transport** | Routing, middleware (request ID, CORS), JSON helpers, status codes | `internal/http` or `internal/api` |
| **Domain — properties** | Buildings / managed sites | Handlers + services + repos for `properties` |
| **Domain — units** | Leasable units, status, uniqueness per property | `units` |
| **Domain — residents** | People, contact, unit association | `residents` |
| **Domain — leases** | Contracts, dates, rent, state rules (e.g. one active lease per unit) | `leases` |
| **Domain — maintenance** (optional) | Tickets linked to units | `maintenance_requests` |
| **Identity & access** (future) | Login, refresh, JWT, RBAC | Auth middleware + user store |
| **Web UI** | Layouts, lists, forms by role | `apps/web` — Server Components / Route Handlers first |
| **Observability** | Structured logs, `/health` reflecting DB | API startup and middleware |
| **Ops / DX** | Compose, Dev Container, CI, seeds | Root + `scripts/` or `deploy/` |

Use this map to keep PRs scoped (one domain slice or one cross-cutting concern at a time).

---

## SOLID and how it applies here

### Single Responsibility (SRP)

- **Go**: One package or type per reason to change — e.g. `lease` service encodes lease rules; repository only talks to MongoDB; handlers only parse requests and write responses.
- **Next.js**: Route segments and components focused — data loaders vs presentational UI; avoid mega-components that also encode domain rules.

### Open/Closed (OCP)

- Extend behavior via **new types implementing small interfaces** (e.g. `PaymentProvider`) rather than editing large switch statements across the codebase.
- Prefer **middleware chains** for cross-cutting HTTP concerns instead of scattering checks in every handler.

### Liskov Substitution (LSP)

- Implementations of `Repository` or `Clock` interfaces must honor documented contracts (no surprising panics, no silent narrowing of pre/postconditions).

### Interface Segregation (ISP)

- Define **narrow interfaces** where the consumer lives (`package api` needs `LeaseCreator`, not a 20-method `Database` god interface).
- Accept interfaces, return concrete types in Go where idiomatic.

### Dependency Inversion (DIP)

- **Services** depend on **interfaces** for persistence and time/notifications; **wire concrete implementations** in `main` (or a small `internal/app` builder).
- Next.js: depend on typed API client or server-only fetch helpers, not raw URL strings scattered in components.

---

## Other standards (non-SOLID)

- **REST**: Version prefix `/v1`; consistent error JSON and request IDs per `docs/api-overview.md`. Cursor-based pagination when listing.
- **Security**: No secrets in `NEXT_PUBLIC_*`. JWT/session design per roadmap Phase 4; least privilege RBAC (`admin`, `resident`, `staff` as in architecture).
- **Data integrity**: Unique indexes as in `docs/data-model.md`; use transactions when multiple documents must move together (e.g. unit status + new lease).
- **API errors**: Stable machine-readable codes where useful; log server details, return safe messages to clients.
- **Testing**: Table-driven tests in Go for pure logic; `httptest` for handlers; Testcontainers or disposable Mongo for integration when feasible.
- **TypeScript**: Strict types; validate external input at boundaries (Zod or similar if adopted).
- **Documentation**: English design docs in `docs/`; keep `docs/roadmap.md` in sync when phases complete or scope shifts.
- **Commits / PRs**: Small, reviewable changes; reference domain module (e.g. `feat(leases): ...`).

---

## Go layering (recommended)

```
cmd/server/main.go          → parse config, construct deps, run HTTP server
internal/config             → environment
internal/db                 → Mongo client lifecycle
internal/<domain>/          → service (rules) + repository (queries)
internal/http or internal/api → chi routes, handlers calling services
```

Handlers should stay thin: decode → call service → map result/errors to HTTP.

---

## Next.js guidance

- Prefer **Server Components** and server `fetch` with `API_URL` for data that must not leak to the client bundle.
- Use **`NEXT_PUBLIC_API_URL`** only when the browser must call the API directly.
- Route Handlers or Server Actions as the boundary for auth tokens (avoid exposing refresh tokens to client JS when cookies or server-only storage are used).
- **i18n**: `next-intl` with `app/[locale]/`, `messages/*.json`, `i18n/routing.ts`, and **locale-aware** `Link` / `useRouter` / `usePathname` from `i18n/navigation.ts` (not raw `next/link` for in-app routes).

---

## Anti-patterns to avoid

- Business rules only in the Next.js layer (they will drift from the API).
- Giant `main.go` with all routes and DB calls (split per roadmap Phase 2).
- Skipping indexes then “fixing” duplicates in application code only.
- Unversioned breaking API changes (always prefer `/v1` evolution or deprecation headers).

---

## Related repository docs

- `docs/architecture.md` — C4, ADRs, security boundaries
- `docs/api-overview.md` — REST, errors, auth direction
- `docs/data-model.md` — collections, indexes
- `docs/roadmap.md` — phased delivery order
