# Apartment System

Full-stack monorepo for apartment / property management: **Next.js** (`apps/web`), **Go REST API** (`services/api`), and **MongoDB**, runnable with **Docker Compose** or with a **Dev Container** that runs MongoDB alongside your editor.

## Documentation

Design, API conventions, and roadmap (English): **[docs/README.md](./docs/README.md)** — see **[docs/roadmap.md](./docs/roadmap.md)** for planned work after the initial scaffold.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) with Compose v2 (required for Compose and for Dev Containers).
- **Dev Container workflow**: [Dev Containers](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers) extension for VS Code, or **Cursor** (Dev Container support is built in).
- **Dev Container** installs **Go 1.24** and **Node.js 22** inside the devcontainer service (see [`.devcontainer/devcontainer.json`](.devcontainer/devcontainer.json)). You can still run the API and web **on the host** instead if you prefer—then you need matching **Go** and **Node** versions on the host.

## Development with Dev Containers (recommended for Cursor / VS Code)

This is the usual setup when you **Reopen in Container**: Compose starts **MongoDB** and a small **`devcontainer`** service; your repo is mounted at `/workspaces/Apartment-System` inside the editor environment.

1. Open the repository in VS Code or Cursor.
2. Run **“Dev Containers: Reopen in Container”** (VS Code needs the extension linked above).
3. After changing [`.devcontainer/devcontainer.json`](.devcontainer/devcontainer.json) or [`.devcontainer/docker-compose.yml`](.devcontainer/docker-compose.yml), run **“Dev Containers: Rebuild Container”** so Compose env, Go/Node features, and tooling stay in sync.
4. Wait until Compose reports **mongo** healthy. **postCreate** runs `npm ci` under `apps/web` so Tailwind’s **lightningcss** native binaries match the container’s OS/CPU (Linux `arm64` vs `amd64`, glibc vs musl, etc.).

**Running the Go API and Next.js**

The integrated terminal runs **inside** the dev container, which includes **Go** and **Node**. Use the same commands as in [Local development (API and web on the host)](#local-development-api-and-web-on-the-host): from `services/api` run `go run ./cmd/server`, and from `apps/web` run `npm run dev`. Dependencies are installed by **postCreate**; run `npm ci` again in `apps/web` if you copied `node_modules` from another machine or see errors like `Cannot find module '...lightningcss...node'`.

`MONGODB_URI` and `JWT_SECRET` (for the Go API) are set on the **`devcontainer`** service in [`.devcontainer/docker-compose.yml`](.devcontainer/docker-compose.yml), so every process in the container sees them after a **Rebuild**. For a long-lived container started before those lines existed, run **Rebuild Container** once, or set `JWT_SECRET` (16+ characters) in a root `.env` / your shell. If you run the API on the **host** instead, use `mongodb://localhost:27017` in root `.env` (and set `JWT_SECRET` there too).

The editor and the host share the same workspace files on disk.

**Connection strings**

| Where the client runs | URI |
|----------------------|-----|
| Go / Next on the **host** | `mongodb://localhost:27017` |
| Shell, scripts, or `mongosh` **inside** the dev container | `mongodb://mongo:27017` or `mongodb://mongo:27017/apartment_system` (matches Compose `MONGODB_URI`) |

**Port conflict:** Do not run the root `docker compose up` stack at the same time as the Dev Container if both publish MongoDB on **27017**. Stop one stack, or change the host port mapping for `mongo` in [`.devcontainer/docker-compose.yml`](.devcontainer/docker-compose.yml). Dev Container data uses the **`mongo_dev_data`** volume; root Compose uses **`mongo_data`** (separate).

## Quick start (Docker Compose — full stack)

From the repository root, run the **web**, **api**, and **mongo** services in Docker:

```bash
cp .env.example .env
docker compose up --build
```

- **Web**: [http://localhost:3000](http://localhost:3000) — redirects to a locale prefix (e.g. `/en`); home page fetches `GET /health` from the API using server-side `API_URL`.
- **API**: [http://localhost:8080/health](http://localhost:8080/health) — JSON status and MongoDB connectivity.
- **MongoDB**: `localhost:27017` (published for local tools; in Compose the API uses `mongodb://mongo:27017`).

If port `3000` or `8080` is already in use, stop the conflicting process or add a `docker-compose.override.yml` (see `docker-compose.override.yml.example`) to remap ports.

## Environment variables

Copy [.env.example](./.env.example) to `.env` at the **repository root** (`cp .env.example .env`). Docker Compose uses it for variable substitution when you run the full stack.

For **local** API + web (host or host processes with a Dev Container editor), you normally do **not** need `export`: the Go server loads `.env` files walking up from `services/api`, and Next.js pulls `API_URL` / `NEXT_PUBLIC_API_URL` from the root `.env` when `next.config.mjs` runs. Values already set in your shell still win.

| Variable | Purpose |
|----------|---------|
| `MONGODB_URI` | MongoDB connection string (API). |
| `JWT_SECRET` | Signing key for access/refresh tokens (**≥ 16 characters**). Required when the API connects to MongoDB. |
| `CORS_ORIGINS` | Comma-separated browser origins allowed to call the API. |
| `API_URL` | Base URL for **server-side** Next.js → Go calls (`http://api:8080` inside Compose). |
| `NEXT_PUBLIC_API_URL` | Base URL reachable from the **browser** (typically `http://localhost:8080` on your machine). |

## Local development (API and web on the host)

Use this when you run **Go** and **Next.js** on your machine—whether you opened the repo on the host only or you use a **Dev Container** for the editor and MongoDB (see [Development with Dev Containers](#development-with-dev-containers-recommended-for-cursor--vs-code)).

Terminal 1 — MongoDB (skip if you use Dev Container Compose or already have MongoDB on port 27017):

```bash
docker run -d --name apartment-mongo -p 27017:27017 mongo:7
```

Terminal 2 — API (uses `PORT`, `MONGODB_URI`, `JWT_SECRET`, and `CORS_ORIGINS` from the root `.env` if present):

```bash
cd services/api
# Live reload on .go changes (install once: go install github.com/air-verse/air@latest)
air
# Or without reload:
go run ./cmd/server
```

Terminal 3 — Web (uses `API_URL` and `NEXT_PUBLIC_API_URL` from the root `.env` via `next.config.mjs`):

```bash
cd apps/web
npm run dev
```

## CI and integration tests

GitHub Actions ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)) runs unit tests, lint/build, Docker builds, and a **stack integration** job: Docker Compose with [`docker-compose.ci.yml`](docker-compose.ci.yml), Go tests (`go test -tags=integration`), and [`scripts/smoke-stack.sh`](scripts/smoke-stack.sh).

Run the same checks locally:

```bash
cp .env.example .env
docker compose -f docker-compose.yml -f docker-compose.ci.yml up -d --build --wait
export API_BASE_URL=http://localhost:8080
export BOOTSTRAP_ADMIN_EMAIL=ci-admin@example.invalid
export BOOTSTRAP_ADMIN_PASSWORD=ci-test-password-long-enough
cd services/api && go test -tags=integration -count=1 -timeout=5m ./test/integration/...
cd ../.. && ./scripts/smoke-stack.sh
docker compose -f docker-compose.yml -f docker-compose.ci.yml down -v
```

Production deploys ([`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)) run [`scripts/smoke-production.sh`](scripts/smoke-production.sh) after Render and Vercel; set GitHub secrets `PRODUCTION_API_URL` and `PRODUCTION_WEB_URL`.

## Repository layout

```
apps/web/              Next.js application
services/api/          Go module and cmd/server
deploy/docker/         Dockerfiles (build context = repo root)
scripts/               CI smoke scripts (stack and production)
.devcontainer/         Dev Container: MongoDB + Go + Node (see README above)
docs/                  Architecture and API documentation
docker-compose.yml     mongo, api, web services
docker-compose.ci.yml  CI overrides (bootstrap admin, billing off)
```

## License

Add a license file when you publish the project.
