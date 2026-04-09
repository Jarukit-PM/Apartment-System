# Architecture

This document describes the high-level structure of the **Apartment System**: a full-stack web application composed of a Next.js front end, a Go REST API, and MongoDB, orchestrated for local development with Docker Compose.

## Goals

- **Separation of concerns**: UI and transport in Next.js; business rules and persistence in Go.
- **One repository**: A monorepo with clear boundaries (`apps/web`, `services/api`) for simpler onboarding and CI.
- **Environment parity**: The same services (MongoDB, API, web) run via Docker Compose with explicit environment variables.
- **Observable baseline**: Structured JSON logs from the API and a `/health` endpoint that reflects MongoDB connectivity.

## Non-goals (current phase)

- Production hardening beyond baseline CORS, timeouts, and graceful shutdown.
- Full authentication implementation (documented convention only).
- Multi-region deployment, Kubernetes manifests, or managed-service-specific runbooks.

---

## C4 Level 1 — System context

The system serves **building administrators**, **residents**, and optionally **maintenance staff** (actors). They interact only with the **web application** in the browser. The web application talks to the **Apartment API**, which persists data in **MongoDB**. External systems such as email or payment gateways are future integrations.

See [diagrams.md](./diagrams.md) for the Mermaid system-context diagram.

---

## C4 Level 2 — Containers

| Container | Technology | Responsibility |
|-----------|------------|----------------|
| **Web** | Next.js (Node) | Rendering UI, server-side data fetching where appropriate, static assets. |
| **API** | Go (HTTP) | REST endpoints, validation, authorization (future), database access. |
| **Database** | MongoDB | Document storage for properties, units, residents, leases, and operational data. |

**Communication**

- Browser → Next.js over HTTP (port `3000` in Compose).
- Next.js (server) → Go API over HTTP inside the Docker network using `API_URL` (e.g. `http://api:8080`).
- Browser → Go API only when using `NEXT_PUBLIC_API_URL` for client-side calls (e.g. future SPA-style usage); default home page uses **server-side** `fetch` with `API_URL`.

See [diagrams.md](./diagrams.md) for the container diagram.

---

## Technology decisions (ADR-style)

### ADR-1: Next.js for the web tier

**Decision**: Use Next.js with the App Router and TypeScript.

**Rationale**: Strong defaults for routing, SSR, and static optimization; large ecosystem.

**Consequences**: Need `output: "standalone"` for compact Docker images; environment variables must distinguish server (`API_URL`) from client (`NEXT_PUBLIC_API_URL`).

### ADR-2: Go for the API tier

**Decision**: Implement the HTTP API in Go with `chi` for routing and `go-chi/cors` for CORS.

**Rationale**: Simple deployment binary, good performance, explicit control over middleware and timeouts.

**Consequences**: Business logic should stay in Go; Next.js should not become a second backend except for static optimization and UI.

### ADR-3: MongoDB as the primary datastore

**Decision**: Use MongoDB with the official Go driver.

**Rationale**: Flexible document model fits evolving apartment-domain entities; operational familiarity for many teams.

**Consequences**: Define indexes and consistency rules explicitly (see [data-model.md](./data-model.md)); consider transactions where multi-document updates must be atomic.

### ADR-4: Docker Compose for local orchestration

**Decision**: Run `mongo`, `api`, and `web` via `docker compose` at the repository root.

**Rationale**: Single command to boot the stack; matches production-like service boundaries.

**Consequences**: Host port conflicts (e.g. `3000` already in use) require overrides or stopping conflicting processes.

---

## Security boundaries

| Layer | Responsibility |
|-------|------------------|
| **Browser** | Untrusted; only receives public data and session tokens or cookies as designed. Never embed secrets in client bundles. |
| **Next.js server** | Trusted for server-side calls using `API_URL`; can hold server-only secrets (future). |
| **Go API** | Enforces authentication and authorization (future), input validation, and database access control. |
| **MongoDB** | Network-isolated in Compose; production should use TLS, authentication, and least-privilege users. |

**CORS**: The API allows only origins listed in `CORS_ORIGINS` (comma-separated). Defaults include `http://localhost:3000` when unset.

**Secrets**: Do not commit `.env` files. Copy [.env.example](../.env.example) and customize locally.

---

## Deployment view (development)

The default Compose file builds images from [deploy/docker/Dockerfile.api](../deploy/docker/Dockerfile.api) and [deploy/docker/Dockerfile.web](../deploy/docker/Dockerfile.web) with the repository root as build context. Named volume `mongo_data` persists database files.

**Dev Container (optional):** Developers using Cursor or VS Code can attach to a separate Compose stack under [`.devcontainer/`](../.devcontainer/) that runs MongoDB and a devcontainer with **Go** and **Node** (Dev Container features); it uses volume `mongo_dev_data` and is independent of the root `mongo_data` volume. See the [root README](../README.md) for MongoDB URIs and running the API and web inside the container or on the host.

A future production deployment would typically use a managed MongoDB cluster, container registry images for `api` and `web`, TLS termination at a reverse proxy or load balancer, and secrets injected by the platform.

See [diagrams.md](./diagrams.md) for a deployment diagram.

---

## Related documents

- [api-overview.md](./api-overview.md) — REST conventions and authentication direction.
- [data-model.md](./data-model.md) — MongoDB collections and indexes.
- [diagrams.md](./diagrams.md) — Mermaid diagrams (context, containers, sequences, deployment).
