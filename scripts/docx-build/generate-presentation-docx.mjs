/**
 * Generates docs/Apartment-System-Presentation-Report.docx from presentation-report content.
 * Run: node generate-presentation-docx.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  HeadingLevel,
  ImageRun,
  Packer,
  PageNumber,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");
const ASSETS = path.join(ROOT, "docs/assets");
const DIAGRAMS = path.join(ASSETS, "diagrams");
const OUT = path.join(ROOT, "docs/Apartment-System-Presentation-Report.docx");

const COLOR = {
  primary: "1E3A5F",
  accent: "2B6CB0",
  light: "E8F4FC",
  muted: "4A5568",
  white: "FFFFFF",
};

function readImgFile(filePath, maxWidth = 520, heightRatio = 0.52) {
  if (!fs.existsSync(filePath)) return null;
  const data = fs.readFileSync(filePath);
  const w = maxWidth;
  const h = Math.round(w * heightRatio);
  return new ImageRun({
    data,
    transformation: { width: w, height: h },
    type: filePath.endsWith(".png") ? "png" : "jpg",
  });
}

function readImg(name, maxWidth = 520, heightRatio = 0.52) {
  return readImgFile(path.join(ASSETS, name), maxWidth, heightRatio);
}

/** Mermaid PNG from docs/assets/diagrams/ */
function readDiagram(name, maxWidth = 520, heightRatio = 0.45) {
  return readImgFile(path.join(DIAGRAMS, name), maxWidth, heightRatio);
}

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 200 },
    children: [
      new TextRun({ text, bold: true, size: 36, color: COLOR.primary, font: "Calibri" }),
    ],
  });
}

function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 280, after: 120 },
    children: [
      new TextRun({ text, bold: true, size: 28, color: COLOR.accent, font: "Calibri" }),
    ],
  });
}

function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 200, after: 80 },
    children: [new TextRun({ text, bold: true, size: 24, color: COLOR.primary, font: "Calibri" })],
  });
}

function p(text, opts = {}) {
  return new Paragraph({
    spacing: { after: 120 },
    alignment: opts.center ? AlignmentType.CENTER : AlignmentType.JUSTIFIED,
    children: [
      new TextRun({
        text,
        size: opts.size || 22,
        italics: opts.italics,
        bold: opts.bold,
        color: opts.color || "000000",
        font: "Calibri",
      }),
    ],
  });
}

function bullet(text) {
  return new Paragraph({
    bullet: { level: 0 },
    spacing: { after: 60 },
    children: [new TextRun({ text, size: 22, font: "Calibri" })],
  });
}

function quote(text) {
  return new Paragraph({
    spacing: { before: 100, after: 100 },
    indent: { left: 360 },
    shading: { type: ShadingType.CLEAR, fill: COLOR.light, color: "auto" },
    children: [new TextRun({ text, italics: true, size: 22, color: COLOR.muted, font: "Calibri" })],
  });
}

function diagramNote(title, lines) {
  const children = [
    new TextRun({ text: `${title}\n`, bold: true, size: 20, color: COLOR.accent, font: "Calibri" }),
    ...lines.flatMap((line, i) => [
      new TextRun({ text: (i === 0 ? "" : "\n") + "• " + line, size: 20, font: "Calibri" }),
    ]),
  ];
  return new Paragraph({
    spacing: { before: 120, after: 160 },
    shading: { type: ShadingType.CLEAR, fill: "F7FAFC", color: "auto" },
    border: {
      left: { style: BorderStyle.SINGLE, size: 12, color: COLOR.accent },
    },
    indent: { left: 200 },
    children,
  });
}

function imgBlock(name, caption, width = 520, heightRatio = 0.52) {
  return imgFrom(() => readImg(name, width, heightRatio), caption);
}

function imgDiagram(name, caption, width = 520, heightRatio = 0.45) {
  return imgFrom(() => readDiagram(name, width, heightRatio), caption);
}

function imgFrom(getImg, caption) {
  const img = getImg();
  if (!img) return [p(`[รูปภาพ: ${caption} — ไม่พบไฟล์]`, { italics: true })];
  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 160, after: 80 },
      children: [img],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [
        new TextRun({
          text: caption,
          italics: true,
          size: 18,
          color: COLOR.muted,
          font: "Calibri",
        }),
      ],
    }),
  ];
}

function tableFromRows(headers, rows, colWidths) {
  const headerCells = headers.map(
    (h) =>
      new TableCell({
        width: colWidths ? { size: colWidths[headers.indexOf(h)], type: WidthType.PERCENTAGE } : undefined,
        shading: { fill: COLOR.accent, type: ShadingType.CLEAR },
        children: [
          new Paragraph({
            children: [new TextRun({ text: h, bold: true, color: COLOR.white, size: 20, font: "Calibri" })],
          }),
        ],
      }),
  );
  const bodyRows = rows.map(
    (row) =>
      new TableRow({
        children: row.map(
          (cell, i) =>
            new TableCell({
              width: colWidths ? { size: colWidths[i], type: WidthType.PERCENTAGE } : undefined,
              children: [
                new Paragraph({
                  children: [new TextRun({ text: String(cell), size: 20, font: "Calibri" })],
                }),
              ],
            }),
        ),
      }),
  );
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [new TableRow({ children: headerCells }), ...bodyRows],
  });
}

function sectionBreak() {
  return new Paragraph({ spacing: { after: 80 }, children: [] });
}

// --- Cover ---
const cover = [
  new Paragraph({ spacing: { before: 2400 }, children: [] }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [
      new TextRun({
        text: "Apartment System",
        bold: true,
        size: 56,
        color: COLOR.primary,
        font: "Calibri",
      }),
    ],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 200 },
    children: [
      new TextRun({
        text: "รายงานการนำเสนอโปรเจกต์",
        size: 40,
        color: COLOR.accent,
        font: "Calibri",
      }),
    ],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 400 },
    children: [
      new TextRun({
        text: "ระบบจัดการอพาร์ตเมนต์ (Full-Stack Web Application)",
        size: 24,
        color: COLOR.muted,
        font: "Calibri",
      }),
    ],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [
      new TextRun({ text: "วันที่ 17 พฤษภาคม 2026", size: 22, font: "Calibri" }),
    ],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 200 },
    children: [
      new TextRun({
        text: "กรอบ 7 หัวข้อ: Requirement → Architecture → Implementation →\nProblem/Solution → Demo → Design Decisions → Summary",
        size: 20,
        color: COLOR.muted,
        font: "Calibri",
      }),
    ],
  }),
  new Paragraph({ children: [new TextRun({ text: "", break: 1 })] }),
];

// --- TOC ---
const toc = [
  h1("สารบัญ"),
  bullet("1. Requirement Specifications — ความต้องการระบบ"),
  bullet("2. Architecture — สถาปัตยกรรมและเทคโนโลยี"),
  bullet("3. Implementation — การพัฒนาและโครงสร้างโค้ด"),
  bullet("4. Problem / Solution — ปัญหาและแนวทางแก้"),
  bullet("5. System Demo — การสาธิตระบบ"),
  bullet("6. Key Design Decisions — การตัดสินใจออกแบบ"),
  bullet("7. Summary & Takeaways — สรุปและข้อเสนอแนะ"),
  new Paragraph({ children: [new TextRun({ text: "", break: 1 })] }),
];

// --- Section 1 ---
const s1 = [
  h1("1. Requirement Specifications"),
  p("เป้าหมาย: กำหนดว่าระบบต้องทำอะไร — ขอบเขต ข้อจำกัด และกรณีใช้งาน"),
  h2("1.1 บริบทและวัตถุประสงค์"),
  p(
    "ระบบ Apartment System พัฒนาเพื่อช่วยเจ้าของ/ผู้ดูแลอาคารและผู้อยู่อาศัยจัดการข้อมูลห้อง สัญญาเช่า การเงิน และงานซ่อมบำรุงผ่านเว็บแอปเดียว แทนการทำงานแยกสเปรดชีต กระดาษ หรือแชท",
  ),
  ...imgDiagram("mindmap-cap.png", "กราฟที่ 1 — ภาพรวมความสามารถระบบ (Mindmap)", 500, 0.55),
  ...imgBlock("presentation-framework-7-steps.png", "กราฟที่ 2 — กรอบการนำเสนอ 7 หัวข้อ", 480),
  h2("1.2 Functional Requirements"),
  tableFromRows(
    ["รหัส", "ความต้องการ", "สถานะ"],
    [
      ["FR-01", "ผู้ดูแล CRUD อาคาร (properties)", "✅"],
      ["FR-02", "ผู้ดูแล CRUD ห้อง (units)", "✅"],
      ["FR-03", "ผู้ดูแล CRUD ผู้อยู่อาศัย", "✅"],
      ["FR-04", "ผู้ดูแลจัดการสัญญาเช่า (leases)", "✅"],
      ["FR-05", "สมัคร/login + Google OAuth", "✅"],
      ["FR-06", "ผู้อยู่อาศัยจองห้องเอง (self-service)", "✅"],
      ["FR-07", "หักค่าเช่าเดือนแรกจาก wallet", "✅"],
      ["FR-08", "กระเป๋าเงิน: เติม โอน ดูยอด", "✅"],
      ["FR-09", "ใบแจ้งหนี้รายเดือน (billing job)", "✅"],
      ["FR-10", "แจ้งซ่อมพร้อมรูปภาพ", "✅"],
      ["FR-11", "อัปโหลดรูป property/unit", "✅"],
      ["FR-12", "พนักงานซ่อม (staff) workflow", "⏳"],
    ],
    [12, 58, 15],
  ),
  sectionBreak(),
  h2("1.3 Non-Functional Requirements"),
  tableFromRows(
    ["หมวด", "รายละเอียด"],
    [
      ["ความปลอดภัย", "JWT access + refresh; RBAC admin/resident"],
      ["ประสิทธิภาพ", "Go binary; MongoDB connection pool"],
      ["ความน่าเชื่อถือ", "Transaction เมื่อจองห้อง + wallet + unit"],
      ["การสังเกตการณ์", "JSON logs; GET /health + MongoDB status"],
      ["การใช้งาน", "UI สองภาษา EN/TH (next-intl)"],
      ["การ deploy", "Docker Compose + Dev Container"],
    ],
    [25, 75],
  ),
  h2("1.4 Constraints & Assumptions"),
  tableFromRows(
    ["ข้อจำกัด", "รายละเอียด"],
    [
      ["Monorepo", "apps/web + services/api"],
      ["ฐานข้อมูล", "MongoDB — ไม่ใช้ RDBMS"],
      ["ชำระเงิน", "Wallet ในระบบ — ยังไม่เชื่อม payment gateway"],
      ["Production", "เน้น dev; TLS/managed DB ถัดไป"],
    ],
    [30, 70],
  ),
  h2("1.5 Use Cases"),
  ...imgDiagram("use-cases.png", "กราฟที่ 3 — Use Cases: Admin และ Resident", 500, 0.35),
  quote(
    "ในฐานะผู้อยู่อาศัย ฉันต้องการดูห้องว่างที่มีราคาเช่า แล้วจองห้องได้ทันที โดยหักค่าเช่าเดือนแรกจาก wallet",
  ),
  quote(
    "ในฐานะผู้ดูแล ฉันต้องการเห็นภาพรวมห้อง สัญญา และคำขอซ่อมในที่เดียว",
  ),
  new Paragraph({ children: [new TextRun({ text: "", break: 1 })] }),
];

// --- Section 2 ---
const s2 = [
  h1("2. Architecture"),
  p("เป้าหมาย: แสดงโครงสร้างภาพรวม ส่วนประกอบ ไดอะแกรม และ technology stack"),
  ...imgBlock("architecture-overview.png", "กราฟที่ 4 — ภาพรวมสถาปัตยกรรมระบบ (ภาพประกอบ)"),
  h2("2.1 System Overview (C4 Level 1)"),
  p("ผู้เกี่ยวข้อง: Administrator, Resident → Apartment System · อนาคต: Staff, Payment Gateway, Email"),
  h2("2.2 Containers (C4 Level 2)"),
  ...imgDiagram("containers.png", "กราฟที่ 5 — C4 Containers: Browser → Next.js → Go API → MongoDB", 500, 0.28),
  tableFromRows(
    ["Container", "Path", "หน้าที่"],
    [
      ["Web", "apps/web", "UI, SSR, Server Actions, i18n"],
      ["API", "services/api", "REST /v1, auth, business rules"],
      ["Database", "MongoDB", "properties, units, leases, wallets"],
    ],
    [18, 22, 60],
  ),
  h2("2.3 Go API — Domain Modules"),
  ...imgDiagram("go-layers.png", "กราฟที่ 6 — Go API Layering: Handler → Service → Repository", 500, 0.5),
  h2("2.4 Data Model (สรุป)"),
  ...imgDiagram("er-model.png", "กราฟที่ 7 — ER Diagram: ความสัมพันธ์ collections หลัก", 500, 0.55),
  h2("2.5 Technology Stack"),
  tableFromRows(
    ["ชั้น", "เทคโนโลยี"],
    [
      ["Frontend", "Next.js, TypeScript, Tailwind, next-intl"],
      ["Backend", "Go 1.24, chi, MongoDB driver"],
      ["Data", "MongoDB (apartment_system)"],
      ["DevOps", "Docker Compose, Dev Container"],
    ],
    [25, 75],
  ),
  new Paragraph({ children: [new TextRun({ text: "", break: 1 })] }),
];

// --- Section 3 ---
const s3 = [
  h1("3. Implementation"),
  p("เป้าหมาย: อธิบายว่าสร้างอย่างไร — โครงโค้ด อัลกอริทึมหลัก และเครื่องมือ"),
  h2("3.1 Repository Layout"),
  new Paragraph({
    spacing: { after: 120 },
    shading: { fill: "F1F5F9", type: ShadingType.CLEAR },
    children: [
      new TextRun({
        text:
          "Apartment-System/\n  apps/web/          → Next.js UI\n  services/api/      → Go API\n  deploy/docker/     → Dockerfiles\n  docs/              → เอกสารออกแบบ\n  .cursor/           → AI rules & skill",
        font: "Consolas",
        size: 18,
      }),
    ],
  }),
  h2("3.2 Go Layering"),
  p("หลักการ: Handler บาง — Service รวมกฎธุรกิจ — Repository รับผิดชอบ query/transaction (ดูกราฟที่ 6)"),
  h2("3.3 Key Logic"),
  h3("Self-service lease + wallet"),
  bullet("ตรวจไม่มี lease active ซ้ำ"),
  bullet("ตรวจ unit vacant + listingRent + selfServiceEnabled"),
  bullet("Transaction: หัก wallet → lease active → unit occupied"),
  h3("Billing รายเดือน"),
  ...imgDiagram("billing-flow.png", "กราฟที่ 8 — Billing Job: Ticker → Runner → Invoice", 480, 0.25),
  bullet("billing.Runner จาก ticker → สร้าง invoice ตาม billingMonth"),
  bullet("Unique index (leaseId, billingMonth) ป้องกันซ้ำ"),
  h2("3.4 Libraries & Tools"),
  tableFromRows(
    ["ส่วน", "เครื่องมือ"],
    [
      ["Go", "chi, cors, mongo-driver, godotenv"],
      ["Web", "Next.js App Router, next-intl"],
      ["Dev", "Docker, Dev Container, air"],
    ],
    [25, 75],
  ),
  h2("3.5 Cursor / AI-assisted"),
  bullet("SKILL.md — design-first, Go layering"),
  bullet("rules/apartment-system.mdc — apply ทุก session"),
  new Paragraph({ children: [new TextRun({ text: "", break: 1 })] }),
];

// --- Section 4 ---
const s4 = [
  h1("4. Problem / Solution"),
  p("เป้าหมาย: อธิบายปัญหา ความท้าทาย แนวทางแก้ และคุณค่าที่ได้"),
  ...imgBlock("problem-solution.png", "กราฟที่ 9 — จากปัญหาการบริหารแบบ manual สู่แพลตฟอร์มดิจิทัล"),
  h2("4.1 Problem Background"),
  bullet("สมุด/Excel แยกไฟล์ — ข้อมูลไม่ sync"),
  bullet("จองห้องผ่านโทร/แชท — ช้า ผิดพลาดได้"),
  bullet("เก็บค่าเช่าและ invoice ด้วยมือ — ติดตามยาก"),
  bullet("งานซ่อมกระจัด — ไม่มีสถานะกลาง"),
  h2("4.2 Challenges"),
  tableFromRows(
    ["ความท้าทาย", "รายละเอียด"],
    [
      ["ความสอดคล้องข้อมูล", "จองซ้ำ / unit สถานะผิด"],
      ["การเงิน", "ต้องมีเงินก่อนสร้างสัญญา self-service"],
      ["ความปลอดภัย", "แยก admin vs resident"],
      ["การขยาย", "หลาย property โดยไม่ rewrite"],
    ],
    [35, 65],
  ),
  h2("4.3 Solution Approach"),
  ...imgDiagram("solution-flow.png", "กราฟที่ 10 — แนวทางแก้: จากปัญหากระจัดสู่แพลตฟอร์มรวมศูนย์", 500, 0.55),
  h2("4.4 Expected Value"),
  tableFromRows(
    ["ผู้มีส่วนได้ส่วนเสีย", "คุณค่า"],
    [
      ["Admin", "ลดงาน manual; เห็นสถานะรวมศูนย์"],
      ["Resident", "จองและจ่าย online; ติดตาม invoice/ซ่อม"],
      ["ทีมพัฒนา", "Monorepo + Docker — onboard ง่าย"],
    ],
    [30, 70],
  ),
  new Paragraph({ children: [new TextRun({ text: "", break: 1 })] }),
];

// --- Section 5 ---
const s5 = [
  h1("5. System Demo"),
  p("เป้าหมาย: แสดงระบบทำงาน — ฟีเจอร์หลัก และ flow ต้นท้าย"),
  ...imgBlock("demo-user-journey.png", "กราฟที่ 11 — เส้นทางผู้ใช้ Admin และ Resident (ภาพประกอบ)"),
  p("Demo สด: docker compose up --build หรือ npm run dev + go run ./cmd/server → http://localhost:3000", {
    italics: true,
    center: true,
  }),
  h2("5.1 บทบาทและ URL"),
  tableFromRows(
    ["บทบาท", "URL", "ฟีเจอร์"],
    [
      ["ทุกคน", "/login, /register", "Auth, Google OAuth"],
      ["Admin", "/dashboard", "สถิติภาพรวม"],
      ["Admin", "/properties, /units, …", "CRUD ทุก entity"],
      ["Resident", "/my", "หน้าแรกสรุป"],
      ["Resident", "/my/rent", "ดูห้องว่าง → จอง"],
      ["Resident", "/my/wallet", "เติมเงิน / โอน"],
      ["Resident", "/my/invoices", "ใบแจ้งหนี้"],
      ["Resident", "/my/maintenance", "แจ้งซ่อม"],
    ],
    [18, 28, 54],
  ),
  h2("5.2 Flow — Resident จองห้อง"),
  ...imgDiagram("lease-flow.png", "กราฟที่ 12 — Sequence: Resident จองห้อง (Login → Wallet → Lease)", 500, 0.65),
  tableFromRows(
    ["ขั้น", "Input", "Output"],
    [
      ["1", "email/password", "JWT + session"],
      ["2", "จำนวนเงิน", "balance เพิ่ม"],
      ["3", "unitId, วันที่", "lease active, unit occupied"],
      ["4", "(เวลา)", "invoice รายเดือน"],
    ],
    [12, 38, 50],
  ),
  h2("5.3 Flow — Admin จัดการห้อง"),
  ...imgDiagram("admin-flow.png", "กราฟที่ 13 — Admin: Dashboard → Property → Unit → Lease → Maintenance", 500, 0.28),
  h2("5.4 ตัวอย่าง API"),
  new Paragraph({
    shading: { fill: "1E293B", type: ShadingType.CLEAR },
    children: [
      new TextRun({
        text: "curl http://localhost:8080/health\ncurl -X POST .../v1/auth/login\ncurl .../v1/me/available-units -H \"Authorization: Bearer ...\"",
        font: "Consolas",
        size: 18,
        color: "E2E8F0",
      }),
    ],
  }),
  new Paragraph({ children: [new TextRun({ text: "", break: 1 })] }),
];

// --- Section 6 ---
const s6 = [
  h1("6. Key Design Decisions"),
  p("เป้าหมาย: อธิบายการตัดสินใจสำคัญ ทางเลือกที่พิจารณา และ trade-offs"),
  tableFromRows(
    ["ADR", "การตัดสินใจ", "เหตุผล", "Trade-off"],
    [
      ["ADR-1", "Next.js App Router", "SSR, ecosystem", "แยก API_URL / PUBLIC"],
      ["ADR-2", "Go + chi", "binary, performance", "ทีมต้องคุ้น Go"],
      ["ADR-3", "MongoDB", "document ยืดหยุ่น", "index/transaction เอง"],
      ["ADR-5", "กฎใน Go เท่านั้น", "แหล่งความจริงเดียว", "Next = UI"],
      ["ADR-6", "JWT + refresh", "stateless access", "ซับซ้อนกว่า cookie"],
      ["ADR-7", "Wallet ในระบบ", "demo end-to-end", "ไม่ใช่ธนาคารจริง"],
    ],
    [10, 22, 38, 30],
  ),
  h2("ทางเลือกที่ไม่เลือกตอนนี้"),
  tableFromRows(
    ["ทางเลือก", "เหตุผล"],
    [
      ["Next.js API เป็น backend หลัก", "กฎธุรกิจแตกสองที่"],
      ["PostgreSQL", "MVP เปลี่ยน schema บ่อย"],
      ["Payment gateway ตั้งแต่แรก", "wallet จำลองก่อน"],
    ],
    [40, 60],
  ),
  new Paragraph({ children: [new TextRun({ text: "", break: 1 })] }),
];

// --- Section 7 ---
const s7 = [
  h1("7. Summary & Takeaways"),
  h2("7.1 What We Built"),
  tableFromRows(
    ["ส่วน", "สรุป"],
    [
      ["Backend", "Go REST /v1, CRUD, auth, wallet, invoice, billing"],
      ["Frontend", "Next.js admin + resident, EN/TH"],
      ["Data", "MongoDB + indexes + transactions"],
      ["DevOps", "Docker Compose, Dev Container, docs"],
    ],
    [22, 78],
  ),
  ...imgDiagram("mvp-pie.png", "กราฟที่ 14 — ความครอบคลุม MVP (โดยประมาณ)", 420, 0.85),
  h2("7.2 What We Learned"),
  bullet("เลเยอร์ชัดช่วยขยาย self-service และ billing"),
  bullet("Transaction จำเป็นเมื่อ wallet + lease + unit พร้อมกัน"),
  bullet("Design-first docs + Cursor skill ลด scope creep"),
  bullet("i18n ตั้งแต่ต้นถูกกว่าแปะทีหลัง"),
  h2("7.3 Future Work"),
  tableFromRows(
    ["ลำดับ", "งาน", "เหตุผล"],
    [
      ["1", "GitHub Actions CI", "คุณภาพ merge"],
      ["2", "Integration / E2E", "flow จองห้อง + wallet"],
      ["3", "Production hardening", "TLS, secrets, backup"],
      ["4", "Payment provider", "ชำระเงินจริง"],
      ["5", "Staff workflows", "role staff เต็มรูปแบบ"],
    ],
    [10, 35, 55],
  ),
  h2("7.4 คำแนะนำการนำเสนอ"),
  bullet("เล่าเป็นเรื่อง: ปัญหา → แก้ → demo → สรุป"),
  bullet("Show, don't just tell — demo สด 2–3 นาที"),
  bullet("จับเวลา ~15–20 นาที + Q&A"),
  h2("7.5 Q & A"),
  tableFromRows(
    ["คำถาม", "คำตอบสั้น"],
    [
      ["ทำไมใช้ Go?", "กฎธุรกิจรวมศูนย์; binary เร็ว"],
      ["ชำระเงินจริง?", "wallet ในระบบ — gateway ถัดไป"],
      ["หลายอาคาร?", "รองรับหลาย properties"],
      ["พร้อม production?", "ต้อง CI, TLS, backup ก่อน"],
    ],
    [40, 60],
  ),
  sectionBreak(),
  p("— จบรายงาน — Apartment System · 17 พฤษภาคม 2026", { center: true, color: COLOR.muted }),
];

const doc = new Document({
  styles: {
    default: {
      document: {
        run: { font: "Calibri", size: 22 },
      },
    },
  },
  sections: [
    {
      properties: {
        page: {
          margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 },
        },
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({ text: "Apartment System — Presentation Report  |  หน้า ", size: 18, color: COLOR.muted }),
                new TextRun({ children: [PageNumber.CURRENT], size: 18, color: COLOR.muted }),
              ],
            }),
          ],
        }),
      },
      children: [...cover, ...toc, ...s1, ...s2, ...s3, ...s4, ...s5, ...s6, ...s7],
    },
  ],
});

const buffer = await Packer.toBuffer(doc);
fs.writeFileSync(OUT, buffer);
console.log("Written:", OUT);
console.log("Size:", (buffer.length / 1024).toFixed(1), "KB");
