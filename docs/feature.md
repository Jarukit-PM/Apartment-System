# Apartment System — product features

This document describes **what a full apartment / multifamily property management system typically includes**, aligned with common industry practice and with this repository’s [data-model.md](./data-model.md) and [roadmap.md](./roadmap.md). Use it for backlog planning, scope negotiation, and vertical slices—not as a commitment to build everything.

**Actors** (from [architecture.md](./architecture.md)): building administrators, residents, and optionally maintenance staff.

---

## Legend

| Tag | Meaning |
|-----|---------|
| **MVP** | Covered or implied by current MVP data model / roadmap |
| **Extended** | Common next step after MVP |
| **Advanced** | Larger product or regulated markets |

---

## 1. Portfolio & physical inventory

| Feature | Description | Tag |
|---------|-------------|-----|
| **Properties** | One or many buildings / sites; address and metadata | MVP |
| **Units** | Rooms, apartments, parking, storage; labels unique per property; status (vacant / occupied / maintenance) | MVP |
| **Floor plans & media** | Photos, documents, keys/codes metadata (not secrets in clear text) | Extended |
| **Amenities & assets** | Shared equipment, elevators, meters linked to property or unit | Advanced |

---

## 2. People & access

| Feature | Description | Tag |
|---------|-------------|-----|
| **Residents / contacts** | Profiles, email/phone, link to primary unit | MVP |
| **Households** | Multiple people per lease; co-tenants | MVP (partially via `leases.residentIds`) |
| **Staff & roles** | Admin, resident, staff; RBAC on API and UI | MVP (roadmap) |
| **Authentication** | Login, session or JWT, password reset, optional MFA | MVP (roadmap) |
| **Visitors / contractors** | Time-boxed access, vendor records | Advanced |

---

## 3. Leasing & occupancy

| Feature | Description | Tag |
|---------|-------------|-----|
| **Leases** | Start/end, status (draft / active / ended), rent amount and currency | MVP |
| **Lease rules** | One active lease per unit (or configurable), move-in/out dates | MVP |
| **Renewals & notices** | Reminders before end date; renewal offers | Extended |
| **Applications & screening** | Application workflow, background checks (often third-party) | Advanced |
| **Deposits** | Held amount, deductions, return workflow | Extended |

---

## 4. Rent & billing

| Feature | Description | Tag |
|---------|-------------|-----|
| **Charges** | Rent, utilities, fees, recurring schedules | Extended ([data-model.md](./data-model.md) mentions invoices later) |
| **Invoices** | Billing documents, due dates, statuses | Extended |
| **Payments** | Recorded payments, reconciliation, partial payments | Extended |
| **Online payments** | Cards, ACH, local rails—via **payment provider** integration | Advanced |
| **Late fees & arrears** | Rules engine, dunning reminders | Extended |
| **Owner / PM payouts** | Splits, statements (if multi-owner) | Advanced |

---

## 5. Maintenance & operations

| Feature | Description | Tag |
|---------|-------------|-----|
| **Maintenance requests** | Create by resident or staff; unit-linked; statuses | MVP (optional in data model) |
| **Work orders** | Assignee, scheduling, internal notes vs tenant-visible | Extended |
| **Vendors / contractors** | Directory, SLA, cost tracking | Advanced |
| **Preventive maintenance** | Recurring tasks by asset or calendar | Advanced |
| **Attachments** | Photos, PDFs on tickets | Extended |

---

## 6. Communications

| Feature | Description | Tag |
|---------|-------------|-----|
| **In-app / email notifications** | Lease events, payment due, ticket updates | Extended |
| **Announcements** | Property-wide or building notices | Extended |
| **SMS / chat** | Optional channels | Advanced |

---

## 7. Documents & compliance

| Feature | Description | Tag |
|---------|-------------|-----|
| **Document storage** | Leases, IDs (privacy), insurance—metadata + secure blob store | Extended |
| **E-sign** | Integration with e-sign provider | Advanced |
| **Audit log** | Who changed what (leases, money, access) | Extended |
| **Retention & GDPR-style requests** | Policies, export/delete (jurisdiction-dependent) | Advanced |

---

## 8. Reporting & analytics

| Feature | Description | Tag |
|---------|-------------|-----|
| **Occupancy dashboard** | Vacant vs leased units, upcoming expiries | Extended |
| **Rent roll** | Expected vs collected by period | Extended |
| **Financial exports** | CSV/accounting handoff | Extended |
| **Custom reports** | Saved filters, scheduled email | Advanced |

---

## 9. Resident & admin experience (product surface)

| Feature | Description | Tag |
|---------|-------------|-----|
| **Admin console** | CRUD portfolio, leases, residents; staff queues | MVP (roadmap UI) |
| **Resident portal** | Own unit, lease summary, pay (if billing on), submit maintenance | MVP / Extended |
| **Localization** | UI i18n (e.g. `next-intl` in `apps/web`) | In progress |
| **Mobile-friendly web** | Responsive layouts; optional native apps later | Extended |

---

## 10. Platform, security & operations

| Feature | Description | Tag |
|---------|-------------|-----|
| **API versioning & health** | `/v1`, `/health`, consistent errors | MVP (roadmap) |
| **Observability** | Structured logs, metrics, tracing | MVP / Extended |
| **Secrets & env parity** | Docker Compose, Dev Container, production config | MVP |
| **Backups & DR** | MongoDB backup strategy | Advanced |
| **CI/CD & tests** | Automated tests, image builds | MVP (roadmap Phase 6) |

---

## Suggested phasing for *this* codebase

1. **Now (scaffold → roadmap)** — Foundation, domain CRUD (properties, units, residents, leases), auth, core UI, quality gates ([roadmap.md](./roadmap.md)).
2. **Then** — Maintenance work orders, invoices/payments, notifications, documents.
3. **Later** — Applications/screening, deep accounting, advanced compliance.

For **vertical slices** and delivery order, see [roadmap.md](./roadmap.md) and the earlier vertical plan (foundation → properties → units → residents → leases → auth → UI → ops).

---

## Related documents

| Document | Role |
|----------|------|
| [data-model.md](./data-model.md) | MongoDB entities for MVP + “later” slices |
| [roadmap.md](./roadmap.md) | Phased implementation plan |
| [architecture.md](./architecture.md) | Actors, containers, security boundaries |
| [api-overview.md](./api-overview.md) | REST and auth conventions |
