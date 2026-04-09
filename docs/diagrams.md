# Diagrams

Mermaid diagrams for the Apartment System. They render on GitHub, GitLab, and many Markdown preview tools.

---

## C4 — System context (Level 1)

Actors and the software system under construction.

```mermaid
flowchart TB
  subgraph actors [Actors]
    Admin[Administrator]
    Resident[Resident]
    Maintainer[MaintenanceStaff]
  end
  ApartmentSystem[ApartmentSystem]
  subgraph future [FutureIntegrations]
    Email[EmailProvider]
    Payments[PaymentProvider]
  end
  Admin --> ApartmentSystem
  Resident --> ApartmentSystem
  Maintainer --> ApartmentSystem
  ApartmentSystem -.-> Email
  ApartmentSystem -.-> Payments
```

---

## C4 — Containers (Level 2)

Major runnable/deployable pieces.

```mermaid
flowchart LR
  Browser[WebBrowser]
  Next[Nextjs_Web]
  GoAPI[Go_REST_API]
  Mongo[(MongoDB)]
  Browser -->|HTTPS| Next
  Next -->|HTTP_JSON_API_URL| GoAPI
  GoAPI -->|WireProtocol| Mongo
```

---

## Sequence — Login and authorized request (target behavior)

Illustrates the **recommended** JWT access + refresh pattern described in [api-overview.md](./api-overview.md). Implementation is future work.

```mermaid
sequenceDiagram
  participant User as User
  participant Browser as Browser
  participant Next as Nextjs
  participant API as GoAPI
  participant DB as MongoDB

  User->>Browser: Submit credentials
  Browser->>Next: POST auth login
  Next->>API: POST /v1/auth/login
  API->>DB: Validate user
  DB-->>API: User record
  API-->>Next: Access JWT plus Set-Cookie refresh
  Next-->>Browser: Session established

  User->>Browser: Open protected page
  Browser->>Next: Request page
  Next->>API: GET /v1/units Authorization Bearer
  API->>API: Verify JWT and roles
  API->>DB: Query units
  DB-->>API: Documents
  API-->>Next: JSON data
  Next-->>Browser: Rendered page
```

---

## Sequence — List units (authenticated CRUD example)

Concrete example of an authorized read after tokens are in place.

```mermaid
sequenceDiagram
  participant Next as Nextjs_Server
  participant API as GoAPI
  participant DB as MongoDB

  Next->>API: GET /v1/units
  Note over Next,API: Authorization Bearer access_token
  API->>API: Authorize admin or staff role
  API->>DB: find units with filters
  DB-->>API: Cursor or batch
  API-->>Next: 200 JSON data plus meta
```

---

## Go API — Internal components (conceptual)

Logical layering inside the Go service.

```mermaid
flowchart TB
  HTTP[HTTPRouter_chi]
  MW[Middleware_CORS_Log_RequestID]
  Handlers[Handlers]
  Services[DomainServices]
  Repo[Repositories]
  Mongo[(MongoDriver)]
  HTTP --> MW
  MW --> Handlers
  Handlers --> Services
  Services --> Repo
  Repo --> Mongo
```

---

## Deployment — Docker Compose (development)

```mermaid
flowchart TB
  subgraph host [DeveloperMachine]
    Compose[DockerCompose]
    subgraph stack [ComposeStack]
      WebC[web_container]
      ApiC[api_container]
      MongoC[mongo_container]
    end
    Vol[(Volume_mongo_data)]
    Compose --- stack
    MongoC --- Vol
  end
  User[Developer] -->|http://localhost:3000| WebC
  User -->|http://localhost:8080| ApiC
  WebC -->|API_URL| ApiC
  ApiC -->|MONGODB_URI| MongoC
```

---

## Deployment — Dev Container (development)

Optional workflow: MongoDB and a **devcontainer** (Go + Node via features) share a Compose network; the editor attaches to the devcontainer. You can run the Go API and Next.js dev servers **inside** the devcontainer (`MONGODB_URI` → `mongo:27017`) or on the **host** (`localhost:27017`).

```mermaid
flowchart TB
  subgraph host [DeveloperMachine]
    DevCompose[DevContainerCompose]
    subgraph devstack [DevStack]
      DevShell[devcontainer_Go_Node]
      GoRun[Go_API_dev]
      NextRun[Nextjs_dev]
      MongoDev[(mongo_container)]
    end
    DevVol[(Volume_mongo_dev_data)]
    DevCompose --- devstack
    MongoDev --- DevVol
  end
  Editor[VSCode_or_Cursor] -->|remote attach| DevShell
  DevShell --- GoRun
  DevShell --- NextRun
  GoRun -->|mongo:27017| MongoDev
  NextRun -->|localhost:8080| GoRun
```

---

## Future production deployment (reference)

Not implemented in this repository; shown for planning.

```mermaid
flowchart LR
  Users[Users]
  LB[TLS_LoadBalancer]
  WebP[Web_Platform]
  ApiP[API_Platform]
  Atlas[(Managed_MongoDB)]
  Users --> LB
  LB --> WebP
  LB --> ApiP
  ApiP --> Atlas
```
