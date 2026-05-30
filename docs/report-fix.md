# รายงานโปรเจกต Apartment System

## บทที่ 1 — การ Deploy Web และ Production

ระบบ **นำขึ้นใช้งานบนอินเทอร์เน็ตแล้ว** — แยก deploy ตามชั้น web / API / database ไม่รันทุกอย่างบนเครื่องเดียว

### 1.1 ภาพรวม Production

```
ผู้ใช้ (Browser)
      │ HTTPS
      ▼
┌─────────────────┐
│  Next.js (Web)  │  ← Vercel — Root Directory: apps/web
└────────┬────────┘
         │ API_URL / NEXT_PUBLIC_API_URL (HTTPS)
         ▼
┌─────────────────┐
│  Go REST API    │  ← Render — Docker (deploy/docker/Dockerfile.api)
└────────┬────────┘
         │ MONGODB_URI (TLS)
         ▼
┌─────────────────┐
│  MongoDB Atlas  │  ← Managed cluster (M0 free tier)
└─────────────────┘
```

| ส่วน | แพลตฟอร์ม | วิธี deploy | บทบาท |
|------|-----------|-------------|--------|
| **Web (Frontend)** | **Vercel** | Import GitHub repo, Root Directory `apps/web`; production deploy ผ่าน GitHub Actions + `vercel-action` | โฮสต์ Next.js App Router, SSR, static assets, HTTPS/CDN |
| **API (Backend)** | **Render** | Blueprint `render.yaml` + Docker image จาก `deploy/docker/Dockerfile.api` | รัน Go binary ใน container, health check `/health` |
| **Database** | **MongoDB Atlas** | สร้าง cluster บนคลาวด์, ใส่ connection string ใน Render env | เก็บข้อมูล production แยกจากเครื่อง dev |
| **CI/CD** | **GitHub Actions** | `.github/workflows/deploy.yml` เมื่อ push ไป branch `main` | test → lint → build → deploy web + API → smoke test |

### 1.2 เปรียบเทียบ Local กับ Production

| หัวข้อ | Local (Dev) | Production |
|--------|-------------|------------|
| Web | `localhost:3000` | URL บน Vercel (`https://*.vercel.app`) |
| API | `localhost:8080` | URL บน Render (`https://*.onrender.com`) |
| Database | MongoDB ใน Docker | MongoDB Atlas (`mongodb+srv://...`) |
| เรียก API จาก Next.js | `API_URL=http://api:8080` | `API_URL=https://[API-Render]` บน Vercel |
| CORS | `localhost:3000` | URL Vercel จริงใน `CORS_ORIGINS` บน Render |
| Deploy | `docker compose up` | push `main` → GitHub Actions |

**การไหลของ request บน production:** ผู้ใช้เปิดเบราว์เซอร์ไปที่ Vercel → Next.js server เรียก Go API ด้วย `API_URL` (server-side fetch) → API อ่าน/เขียน Atlas → ส่ง JSON กลับ → Next.js render หน้าให้ผู้ใช้ ข้อมูลลับ (เช่น `JWT_SECRET`) อยู่ที่ Render เท่านั้น ไม่ใส่ใน `NEXT_PUBLIC_*`

### 1.3 ขั้นตอนตั้งค่า Production (ครั้งแรก)

1. **MongoDB Atlas** — สร้าง cluster (M0), สร้าง database user, อนุญาต network access, copy `MONGODB_URI`
2. **Render** — Dashboard → New Blueprint → เชื่อม repo (`render.yaml`) → ใส่ secrets: `MONGODB_URI`, `JWT_SECRET`, `CORS_ORIGINS` (URL Vercel)
3. **Vercel** — Import repo, Root Directory `apps/web` → env: `API_URL` และ `NEXT_PUBLIC_API_URL` ชี้ไป URL Render
4. **GitHub Secrets** — `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`, `RENDER_DEPLOY_HOOK_URL`, `PRODUCTION_API_URL`, `PRODUCTION_WEB_URL`
5. **ทดสอบ** — เปิด `[URL Render]/health` ต้องได้ `status: ok`, `mongo: connected` แล้วเปิดหน้า Vercel

### 1.4 CI/CD — Deploy อัตโนมัติเมื่อ push `main`

```
git push main
    │
    ▼
┌─────────────────────────────────────┐
│  job: verify                        │
│  · go test ./...                    │
│  · npm ci && lint && build (web)    │
│  · build Docker API (ไม่ push)      │
└──────────────┬──────────────────────┘
               │ ผ่านทุกขั้น
       ┌───────┴───────┐
       ▼               ▼
 deploy-web       deploy-api
 (Vercel --prod)  (POST Render Deploy Hook)
       │               │
       └───────┬───────┘
               ▼
     smoke-production
     · GET /health (API + MongoDB)
     · GET /v1/site
     · GET หน้าแรก Vercel
```

Render ตั้ง `autoDeploy: false` ใน `render.yaml` — deploy API **เฉพาะเมื่อ CI เรียก Deploy Hook** หลัง test ผ่าน

### 1.5 Environment Variables (Production)

| ตัวแปร | ตั้งที่ | ใช้ทำอะไร |
|--------|--------|-----------|
| `MONGODB_URI` | Render | เชื่อม MongoDB Atlas |
| `JWT_SECRET` | Render | ลงนาม access/refresh token |
| `CORS_ORIGINS` | Render | อนุญาตให้โดเมน Vercel เรียก API ได้ |
| `API_URL` | Vercel | Next.js server-side fetch ไป API |
| `NEXT_PUBLIC_API_URL` | Vercel | URL API สำหรับ client-side (ถ้ามี) |

### 1.6 ทำไมเลือก Vercel สำหรับ Web (Next.js)

| เหตุผลที่เลือก | รายละเอียด |
|----------------|------------|
| **รองรับ Next.js โดยตรง** | Vercel พัฒนา Next.js — build App Router, SSR ได้โดยไม่ตั้ง nginx เอง |
| **Deploy จาก Git** | preview ต่อ PR, production จาก `main` |
| **เหมาะ monorepo** | Root Directory `apps/web` แยกจาก Go ใน repo เดียว |
| **ฟรี tier** | Hobby plan เพียงพอ MVP / รายงาน |
| **HTTPS + CDN** | certificate และ edge caching อัตโนมัติ |

**ไม่เลือก:** รัน Next.js บน Render/Docker คู่ API (build ช้า), Netlify (ecosystem Next.js บน Vercel ลึกกว่า), VPS เดียว (ดูแล SSL/nginx เอง)

### 1.7 ทำไมเลือก Render สำหรับ Go API

| เหตุผลที่เลือก | รายละเอียด |
|----------------|------------|
| **Deploy ด้วย Docker** | ใช้ `deploy/docker/Dockerfile.api` เหมือน dev ใน Compose |
| **Blueprint (`render.yaml`)** | ประกาศ service, health check, env ใน repo |
| **Deploy Hook + CI** | deploy หลัง test ผ่านเท่านั้น |
| **Health check** | `healthCheckPath: /health` |
| **Free tier** | เหมาะโปรเจกตการศึกษา (service อาจ sleep เมื่อไม่มี traffic) |

**ไม่เลือก:** Vercel Serverless สำหรับ Go, Railway/Fly.io (ใช้ได้คล้ายกัน), AWS ECS/EC2 (setup หนักเกิน MVP)

### 1.8 ทำไมเลือก MongoDB Atlas

| เหตุผลที่เลือก | รายละเอียด |
|----------------|------------|
| **Managed MongoDB** | ไม่ดูแล VM/backup/patch เอง |
| **Driver เดียวกับ local** | dev ใช้ MongoDB ใน Compose — โค้ด Go ไม่เปลี่ยน |
| **TLS + connection string** | `MONGODB_URI` เป็น secret บน Render |
| **Free tier M0** | เพียงพอ demo และรายงาน |

**ไม่เลือก:** MongoDB ใน container บน Render, PostgreSQL (ต้องเปลี่ยน data model ทั้งระบบ)

### 1.9 ข้อจำกัดและการแก้ปัญหา

| ปัญหา | สาเหตุ | วิธีแก้ |
|-------|--------|--------|
| login/API ไม่ทำงาน | `CORS_ORIGINS` ไม่ตรง URL Vercel | ใส่ URL Vercel จริงบน Render |
| Next.js ไม่เจอ API | `API_URL` ผิดบน Vercel | ชี้ไป `https://[API-Render]` |
| `/health` ช้าครั้งแรก | Render free tier sleep | รอ ~30 วินาที หรือเรียก `/health` ก่อน demo |
| CI deploy ล้ม | secret ไม่ครบ | ตรวจ GitHub Secrets ตาม `deploy.yml` |

### 1.10 สรุป Deploy

แยก **Vercel (web) + Render (API) + Atlas (DB)** เพราะแต่ละแพลตฟอร์มเหมาะกับเทคโนโลยีของชั้นนั้น Trade-off คือต้อง sync **CORS**, **env หลายที่**, และ **CI workflow**

---

## บทที่ 2 — การเลือกเครื่องมือ AI

โปรเจกตนี้ต้องการ AI ที่**เข้าใจ codebase ทั้ง monorepo** (Next.js + Go + MongoDB + `docs/`) และช่วย**แก้หลายไฟล์**ตาม spec — ไม่ใช่แค่เติมโค้ดบรรทัดเดียว

| เครื่องมือ | จุดแข็ง | จุดอ่อนสำหรับโปรเจกตนี้ | สรุป |
|-----------|---------|-------------------------|------|
| **Cursor** (ที่เลือก) | อยู่ใน IDE; อ่านทั้ง repo; Agent แก้หลายไฟล์; รองรับ **Rules** และ **Skills** ให้ AI ทำตาม architecture | ต้องตั้งกฎและ review diff เอง; มีค่า subscription | **เลือก** — เหมาะ full-stack monorepo + design-first |
| **GitHub Copilot** | Autocomplete เร็วใน editor; integrate กับ VS Code | บริบททั้งโปรเจกตจำกัดกว่า Agent; ไม่มี rules/skills แบบโปรเจกตใน repo | ดีสำหรับเติมฟังก์ชันสั้น ๆ แต่ implement ฟีเจอร์ข้าม web+api ยากกว่า |
| **ChatGPT / Claude (เว็บ)** | อธิบายแนวคิด ออกแบบ API ช่วย debug เมื่อแนบ log | ไม่เห็นไฟล์ใน repo โดยตรง — ต้อง copy-paste โค้ด; แก้หลายไฟล์ไม่ต่อเนื่อง | ใช้เสริมถาม concept ได้ แต่ไม่ใช่เครื่องมือหลัก implement |
| **Amazon CodeWhisperer / Codeium** | ฟรี autocomplete คล้าย Copilot | Agent และ project context น้อยกว่า Cursor ใน monorepo | ไม่เลือกเพราะ workflow เน้น agent + docs ใน repo |
| **Devin / coding agents อื่น** | autonomous สูง | ควบคุม scope ยาก; โปรเจกตการศึกษาต้องอธิบายการตัดสินใจได้ | ไม่เลือก — ต้องการมนุษย์เป็นคนอนุมัติ diff |

### เหตุผลหลักที่เลือก Cursor

1. **Monorepo context** — สั่ง “เพิ่ม `POST /v1/me/leases`” แล้ว AI ไล่ handler → service → repository ใน Go และหน้า `/my` ใน Next.js ได้ในคราวเดียว
2. **Rules + Skill ใน repo** — `.cursor/rules/apartment-system.mdc` และ `.cursor/skills/apartment-system/SKILL.md` บังคับให้ AI อ่าน `docs/architecture.md`, `api-overview.md`, `data-model.md` ก่อนเปลี่ยน behavior
3. **Prompt ภาษาไทย + แนบ screenshot** — เหมาะแก้ UI (layout, i18n) โดยอธิบายอาการที่ผู้ใช้เห็น
4. **Deploy และ config** — ช่วยเขียน GitHub Actions, ตั้ง env, แก้ CORS โดยอ้างไฟล์จริงใน repo

**สิ่งที่ยังต้องทำเอง (AI ทำแทนไม่ได้):** ตรวจโค้ดที่ AI แก้แล้วว่าใช้ได้จริงหรือไม่ ทดสอบเรื่องเงินและสัญญาเช่าให้ถูกต้อง ใส่รหัสผ่านและคีย์ลับบนเว็บไซต์/เซิร์ฟเวอร์ด้วยตัวเอง (ห้ามให้ AI รู้) และตัดสินใจว่าหน้าจอใช้งานสะดวกพอหรือยัง(UI)
