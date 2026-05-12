# Documentation index

English-language design documentation for the **Apartment System** monorepo.

| Document | Description |
|----------|-------------|
| [architecture.md](./architecture.md) | C4 context and containers, technology decisions (ADR-style), security boundaries, deployment view. |
| [api-overview.md](./api-overview.md) | REST conventions, versioning, errors, pagination, and recommended authentication. |
| [data-model.md](./data-model.md) | Proposed MongoDB collections, fields, and indexes for the MVP domain. |
| [diagrams.md](./diagrams.md) | Mermaid diagrams: context, containers, sequences, Go layering, Docker Compose. |
| [feature.md](./feature.md) | Full product feature catalog (MVP vs extended vs advanced) aligned with industry practice. |
| [roadmap.md](./roadmap.md) | Post–Phase 0 plan: foundation, domain CRUD, auth, UI, tests and CI. |

For how to run the stack locally, see the [root README](../README.md). That README covers **Dev Containers** (MongoDB + editor shell, with API/web typically run on the host), **full-stack Docker Compose**, and **host-only** development.
