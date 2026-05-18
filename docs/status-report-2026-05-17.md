# รายงานสถานะโปรเจกต์ Apartment System

> **สำหรับนำเสนอตามกรอบ 7 หัวข้อ** ใช้ **[presentation-report.md](./presentation-report.md)** แทนไฟล์นี้

**วันที่:** 17 พฤษภาคม 2026  
**ขอบเขต:** `.cursor` · `apps/web` · `deploy` · `docs` · `services/api`

> เปิดไฟล์นี้ใน GitHub, GitLab, หรือ Markdown preview ที่รองรับ Mermaid เพื่อดูไดอะแกรมแบบ interactive  
> รูปภาพประกอบ: [assets/architecture-overview.png](./assets/architecture-overview.png)

![ภาพรวมสถาปัตยกรรม](./assets/architecture-overview.png)

---

## 1. สรุปภาพรวม

**Apartment System** เป็น monorepo จัดการอพาร์ตเมนต์/อสังหาริมทรัพย์ ประกอบด้วย Next.js, Go REST API และ MongoDB

| ส่วน | เทคโนโลยี | บทบาท |
|------|-----------|--------|
| **Web** | Next.js (App Router), TypeScript | UI, SSR, เรียก API ฝั่งเซิร์ฟเวอร์ |
| **API** | Go, chi, MongoDB driver | REST, กฎธุรกิจ, persistence |
| **Database** | MongoDB | เอกสาร domain |
| **Ops** | Docker Compose, Dev Container | สภาพแวดล้อมพัฒนา |

โปรเจกต์**ก้าวหน้าเกิน Phase 0** ใน `roadmap.md` แล้ว — มี CRUD, auth, UI จริง, wallet, invoice, billing job และพอร์ทัลผู้อยู่อาศัย

---

## 2. บริบทระบบ (C4 Level 1)

ผู้ใช้และระบบหลัก — อ้างอิง [diagrams.md](./diagrams.md)

```mermaid
flowchart TB
  subgraph actors [ผู้เกี่ยวข้อง]
    Admin[ผู้ดูแลอาคาร Admin]
    Resident[ผู้อยู่อาศัย Resident]
    Maintainer[ช่าง / Staff]
  end
  ApartmentSystem[Apartment System]
  subgraph future [การเชื่อมต่อในอนาคต]
    Email[Email Provider]
    Payments[Payment Provider ภายนอก]
  end
  Admin --> ApartmentSystem
  Resident --> ApartmentSystem
  Maintainer -.->|Role staff ยังไม่ครบ UI| ApartmentSystem
  ApartmentSystem -.-> Email
  ApartmentSystem -.-> Payments
```

---

## 3. คอนเทนเนอร์และการสื่อสาร (C4 Level 2)

```mermaid
flowchart LR
  Browser[เบราว์เซอร์]
  Next[Next.js apps/web :3000]
  API[Go API services/api :8080]
  Mongo[(MongoDB :27017)]
  Browser -->|HTTPS| Next
  Next -->|API_URL server-side| API
  Browser -.->|NEXT_PUBLIC_API_URL บาง flow| API
  API --> Mongo
```

---

## 4. ความคืบหน้า Roadmap

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryColor': '#e8f4f8', 'primaryTextColor': '#1a1a1a', 'primaryBorderColor': '#2b6cb0', 'lineColor': '#4a5568'}}}%%
pie showData
  title สถานะเฟส (โดยประมาณ)
  "เสร็จแล้ว" : 5
  "บางส่วน" : 1
```

| Phase | เป้าหมาย | สถานะ |
|:-----:|----------|:-----:|
| 0 | Scaffold, health, Compose | ✅ |
| 2 | `/v1`, packages, errors | ✅ |
| 3 | Domain CRUD | ✅ |
| 4 | Auth JWT, RBAC | ✅ |
| 5 | Next.js product UI | ✅ |
| 6 | Tests, CI | ⚠️ บางส่วน |

```mermaid
gantt
  title แผนงานเทียบความเป็นจริง (สรุป)
  dateFormat YYYY-MM
  section เสร็จแล้ว
  Phase 0 Scaffold           :done, p0, 2025-01, 2025-03
  Phase 2 Foundation API     :done, p2, 2025-03, 2025-06
  Phase 3 Domain CRUD        :done, p3, 2025-06, 2026-02
  Phase 4 Authentication     :done, p4, 2026-02, 2026-04
  Phase 5 Next.js UI         :done, p5, 2026-03, 2026-05
  section กำลังทำ / ถัดไป
  Phase 6 CI และ E2E         :active, p6, 2026-05, 2026-08
  Production hardening       :p7, 2026-06, 2026-10
```

**เกินแผนเดิม:** wallet, invoice, billing ticker, self-service lease, rental periods, media upload

---

## 5. โครงสร้าง Monorepo

```mermaid
flowchart TB
  subgraph root [Repository Root]
    Apps[apps/web Next.js]
    API[services/api Go]
    Deploy[deploy/docker Dockerfiles]
    Docs[docs/ เอกสารออกแบบ]
    Cursor[.cursor/ rules + skill]
    Compose[docker-compose.yml]
    DevC[.devcontainer/]
  end
  Apps --> API
  Compose --> Apps
  Compose --> API
  Deploy --> Compose
```

---

## 6. Go API — เลเยอร์ภายใน

```mermaid
flowchart TB
  HTTP[chi Router /v1]
  MW[Middleware CORS RequestID Auth RBAC]
  H[Handlers httpserver]
  subgraph domains [Domain Services]
    P[property]
    U[unit]
    R[resident]
    L[lease]
    M[maintenance]
    W[wallet]
    I[invoice]
    A[authservice]
  end
  Repo[Repositories]
  Mongo[(MongoDB)]
  Bill[billing.Runner ticker]
  HTTP --> MW --> H
  H --> domains
  domains --> Repo --> Mongo
  Bill --> L
  Bill --> I
```

---

## 7. โมเดลข้อมูลหลัก (MongoDB)

```mermaid
erDiagram
  properties ||--o{ units : contains
  units ||--o{ leases : has
  residents ||--o{ leases : signs
  residents ||--o| users : linked
  leases ||--o{ invoices : generates
  residents ||--|| wallets : owns
  units ||--o{ maintenance_requests : receives
  users {
    ObjectId _id
    string email
    string[] roles
    ObjectId residentId
  }
  properties {
    ObjectId _id
    string name
    string imageUrl
  }
  units {
    ObjectId _id
    ObjectId propertyId
    string label
    string status
    object listingRent
  }
  leases {
    ObjectId _id
    ObjectId unitId
    ObjectId[] residentIds
    string status
    object rentAmount
  }
  wallets {
    ObjectId residentId
    number balance
  }
```

---

## 8. การยืนยันตัวตน (ลำดับจริง — ทำแล้ว)

```mermaid
sequenceDiagram
  participant U as ผู้ใช้
  participant B as เบราว์เซอร์
  participant N as Next.js
  participant A as Go API
  participant D as MongoDB

  U->>B: กรอก email / password หรือ Google
  B->>N: login / register action
  N->>A: POST /v1/auth/login หรือ oauth/google
  A->>D: ตรวจ user + refresh token
  D-->>A: OK
  A-->>N: access JWT + refresh
  N-->>B: cookie / session ฝั่งเซิร์ฟเวอร์

  U->>B: เปิดหน้า /my หรือ /dashboard
  B->>N: Server Component
  N->>A: GET /v1/me/... Authorization Bearer
  A->>A: ตรวจ JWT + role resident|admin
  A->>D: query
  D-->>A: ข้อมูล
  A-->>N: JSON
  N-->>B: HTML
```

---

## 9. Self-service จองห้อง (ผู้อยู่อาศัย)

```mermaid
sequenceDiagram
  participant R as Resident
  participant API as Go API
  participant DB as MongoDB

  R->>API: GET /v1/me/available-units
  API->>DB: หน่วย vacant + listingRent
  DB-->>API: รายการห้อง
  API-->>R: data[]

  R->>API: POST /v1/me/leases unitId dates
  API->>API: ตรวจไม่มี lease active ซ้ำ
  API->>DB: Transaction หัก wallet เดือนแรก
  alt เงินไม่พอ
    API-->>R: 402 PAYMENT_REQUIRED
  else สำเร็จ
    API->>DB: สร้าง lease active, unit occupied
    API-->>R: 201 lease
  end
```

---

## 10. Billing รายเดือน (background)

```mermaid
flowchart LR
  Ticker[Billing Ticker ใน main.go]
  Runner[billing.Runner]
  LeaseRepo[lease.Repo active monthly]
  InvRepo[invoice.Repo]
  Ticker -->|ทุก N วินาที| Runner
  Runner --> LeaseRepo
  Runner -->|สร้าง invoice ตาม billingMonth| InvRepo
```

---

## 11. แผนผังหน้า Web (`apps/web`)

```mermaid
flowchart TB
  subgraph public [สาธารณะ]
    Login["/login"]
    Reg["/register"]
  end
  subgraph admin ["(dashboard) — Admin"]
    Dash["/dashboard"]
    Prop["/properties"]
    Unit["/units"]
    Res["/residents"]
    Lease["/leases"]
    MaintA["/maintenance"]
    WalA["/wallet"]
  end
  subgraph resident ["my/ — Resident"]
    Home["/my"]
    Rent["/my/rent"]
    Inv["/my/invoices"]
    WalR["/my/wallet"]
    MaintR["/my/maintenance"]
    Prof["/my/profile"]
  end
  Login --> Dash
  Login --> Home
  Reg --> Home
```

**i18n:** ภาษา `en` | `th` ผ่าน `next-intl` และ cookie `NEXT_LOCALE`

---

## 12. การ deploy — Docker Compose

```mermaid
flowchart TB
  subgraph host [เครื่องนักพัฒนา]
    Compose[docker compose]
    subgraph stack [Compose Stack]
      WebC[web :3000]
      ApiC[api :8080]
      MongoC[mongo :27017]
    end
    Vol[(mongo_data)]
    Compose --- stack
    MongoC --- Vol
  end
  Dev[Developer] -->|localhost:3000| WebC
  Dev -->|localhost:8080/health| ApiC
  WebC -->|API_URL http://api:8080| ApiC
  ApiC -->|MONGODB_URI| MongoC
```

**ไฟล์ build:** `deploy/docker/Dockerfile.api`, `Dockerfile.web`

---

## 13. Dev Container (Cursor / VS Code)

```mermaid
flowchart TB
  subgraph host [Developer Machine]
    DevCompose[.devcontainer compose]
    subgraph devstack [Dev Stack]
      Shell[devcontainer Go 1.24 + Node 22]
      GoDev[go run / air]
      NextDev[npm run dev]
      MongoDev[(mongo)]
    end
    DevVol[(mongo_dev_data)]
    MongoDev --- DevVol
  end
  Editor[Cursor / VS Code] -->|attach| Shell
  Shell --- GoDev
  Shell --- NextDev
  GoDev -->|mongo:27017| MongoDev
  NextDev -->|localhost:8080| GoDev
```

---

## 14. อนาคต Production (อ้างอิง — ยังไม่ implement)

```mermaid
flowchart LR
  Users[Users]
  LB[TLS Load Balancer]
  WebP[Web Platform]
  ApiP[API Platform]
  Atlas[(Managed MongoDB)]
  Users --> LB
  LB --> WebP
  LB --> ApiP
  ApiP --> Atlas
```

---

## 15. สรุป Backend API (กราฟ endpoint)

```mermaid
mindmap
  root((Apartment API))
    Public
      GET health
      GET v1/site
      GET media
    Auth
      register-resident
      login refresh logout
      oauth google
    Authenticated
      wallet
      me resident
      admin CRUD
    Background
      billing ticker
```

---

## 16. เครื่องมือพัฒนา AI — `.cursor/`

```mermaid
flowchart LR
  Rule[rules/apartment-system.mdc]
  Skill[skills/apartment-system/SKILL.md]
  Dev[นักพัฒนา + Cursor Agent]
  Code[apps/web + services/api]
  Rule --> Dev
  Skill --> Dev
  Dev --> Code
```

| รายการ | หน้าที่ |
|--------|---------|
| `apartment-system.mdc` | กฎ workspace: stack, design-first |
| `SKILL.md` | module map, Go layering, anti-patterns |

---

## 17. ช่องว่างและข้อเสนอถัดไป

```mermaid
quadrantChart
  title ลำดับความสำคัญถัดไป
  x-axis ความพยายามต่ำ --> ความพยายามสูง
  y-axis ผลกระทบต่ำ --> ผลกระทบสูง
  quadrant-1 ทำก่อน
  quadrant-2 วางแผน
  quadrant-3 พิจารณา
  quadrant-4 เลื่อน
  อัปเดต roadmap.md: [0.2, 0.85]
  GitHub Actions CI: [0.45, 0.9]
  Integration tests: [0.7, 0.88]
  Production TLS secrets: [0.75, 0.75]
  OpenAPI spec: [0.35, 0.5]
  Staff role UI: [0.55, 0.45]
```

1. **อัปเดต `roadmap.md`** ให้ตรงโค้ดปัจจุบัน  
2. **CI:** `go test`, `npm run lint/build`, `docker compose build`  
3. **ทดสอบ:** integration + e2e (login → จองห้อง → wallet)  
4. **Production:** TLS, MongoDB auth, secrets จริง  
5. **`RoleStaff`:** workflow ช่างซ่อมเต็มรูปแบบ  

---

## 18. สรุปท้ายรายงาน

โปรเจกต์อยู่ในสภาพ **MVP ใช้งานได้**: API แบบเลเยอร์, auth + RBAC, CRUD ครบ, พอร์ทัล resident (จองห้อง, wallet, ใบแจ้งหนี้, แจ้งซ่อม), แอดมินแดชบอร์ด, สองภาษา EN/TH, Docker และ Dev Container พร้อมใช้

โฟกัสต่อไป: **คุณภาพและปฏิบัติการ** (CI, integration/e2e) และ **ซิงค์เอกสาร**

---

## เอกสารที่เกี่ยวข้อง

| ลิงก์ | คำอธิบาย |
|------|----------|
| [diagrams.md](./diagrams.md) | ไดอะแกรมสถาปัตยกรรมมาตรฐาน |
| [architecture.md](./architecture.md) | C4, ADR, security |
| [roadmap.md](./roadmap.md) | แผนเฟส (ควรอัปเดต) |
| [feature.md](./feature.md) | แคตตาล็อกฟีเจอร์ |
