# Data model (MongoDB)

This document proposes a **minimum viable** document model for an apartment / property management system. Collections and fields can be adjusted as product requirements narrow (e.g. single-building vs multi-property).

**Database name**: Use a dedicated database (e.g. `apartment_system`) in the connection string, e.g. `mongodb://mongo:27017/apartment_system`.

---

## Conventions

- **Primary keys**: Store `_id` as `ObjectId` unless integrating external IDs.
- **Timestamps**: Include `createdAt` and `updatedAt` (`ISODate`) on mutable documents.
- **Soft delete**: Prefer `deletedAt` (nullable `ISODate`) instead of hard deletes where audit history matters.
- **References**: Store related document `_id` values; enforce referential integrity in application logic or transactions when multiple documents must stay consistent.

---

## Collections

### `properties`

Represents a building or managed property (use a single document if the product is strictly single-building).

| Field | Type | Description |
|-------|------|-------------|
| `_id` | ObjectId | Primary key. |
| `name` | string | Display name. |
| `address` | object | Optional structured address (lines, city, region, postalCode, country). |
| `createdAt` | date | Creation time. |
| `updatedAt` | date | Last update time. |

**Indexes**

- `{ name: 1 }` — optional, for admin search.

---

### `units`

A leasable unit within a property (apartment, room, parking space, etc.).

| Field | Type | Description |
|-------|------|-------------|
| `_id` | ObjectId | Primary key. |
| `propertyId` | ObjectId | Reference to `properties._id`. |
| `label` | string | Unit number or label (e.g. `12B`). |
| `floor` | int | Optional. |
| `bedrooms` | int | Optional. |
| `status` | string | e.g. `vacant`, `occupied`, `maintenance`. |
| `listingRent` | object | Optional. Admin-set **asking rent** for display and resident self-booking: `{ amount: number, currency: string }`. Required for a unit to appear in the resident self-service catalog (with `amount > 0`). |
| `selfServiceEnabled` | bool | Optional. When explicitly `false`, the unit is hidden from resident self-service even if vacant with `listingRent`. Absent or `true` allows self-service when other rules pass. |
| `createdAt` | date | |
| `updatedAt` | date | |

**Indexes**

- **Unique** `{ propertyId: 1, label: 1 }` — prevent duplicate labels per property.
- `{ propertyId: 1, status: 1 }` — list vacant units by property.

---

### `residents`

A person associated with one or more units (tenant, owner-occupant, etc.).

| Field | Type | Description |
|-------|------|-------------|
| `_id` | ObjectId | Primary key. |
| `fullName` | string | |
| `email` | string | Unique per system or per property (product decision). |
| `phone` | string | Optional. |
| `primaryUnitId` | ObjectId | Optional reference to `units._id`. |
| `createdAt` | date | |
| `updatedAt` | date | |

**Indexes**

- **Unique** `{ email: 1 }` — if emails are globally unique.
- `{ primaryUnitId: 1 }` — reverse lookup from unit.

---

### `leases`

Contract linking residents to units for a period.

| Field | Type | Description |
|-------|------|-------------|
| `_id` | ObjectId | Primary key. |
| `unitId` | ObjectId | Reference to `units._id`. |
| `residentIds` | array of ObjectId | Co-tenants. |
| `startDate` | date | |
| `endDate` | date | Nullable for open-ended leases. |
| `status` | string | e.g. `draft`, `active`, `ended`. |
| `rentAmount` | decimal / object | Currency-aware structure recommended (`amount`, `currency`). |
| `createdAt` | date | |
| `updatedAt` | date | |

**Indexes**

- `{ unitId: 1, status: 1 }`.
- `{ residentIds: 1 }` — multikey index for “leases for resident”.
- `{ endDate: 1 }` — optional, for renewal reminders.

---

### `maintenance_requests` (optional MVP)

| Field | Type | Description |
|-------|------|-------------|
| `_id` | ObjectId | |
| `unitId` | ObjectId | |
| `requestedByResidentId` | ObjectId | Optional. |
| `title` | string | |
| `description` | string | |
| `status` | string | e.g. `open`, `in_progress`, `closed`. |
| `createdAt` | date | |
| `updatedAt` | date | |

**Indexes**

- `{ unitId: 1, status: 1 }`.
- `{ status: 1, createdAt: -1 }` — queue views.

---

### `wallets` / `wallet_ledger`

Per **user account** (`users._id`): one wallet document holds `balanceSatang` (THB minor units / satang). The `wallet_ledger` collection stores append-only movements from the perspective of `userId`: `top_up`, `transfer_out`, and `transfer_in` (with optional `peerUserId`).

| Field (wallet) | Type | Description |
|----------------|------|-------------|
| `_id` | ObjectId | Primary key. |
| `userId` | ObjectId | References `users._id` (unique). |
| `balanceSatang` | int64 | Current balance in satang. |
| `currency` | string | e.g. `THB`. |
| `createdAt` / `updatedAt` | date | |

**Indexes**

- **Unique** `{ userId: 1 }` on `wallets`.
- `{ userId: 1, createdAt: -1 }` on `wallet_ledger` for recent activity.

---

### `invoices` / `payments` (later slice)

Keep **invoices** as billing documents and **payments** as settlement records; link both to `leases` or `residents` with explicit statuses. Add indexes on `leaseId`, `dueDate`, and `status` when implemented.

---

## Single-building simplification

If the product targets **one** physical building, you may omit `properties` and store a static `propertyId` in configuration, or use a single `properties` document and treat all `units.propertyId` as that constant. Document the chosen rule in this file when the product scope is fixed.

---

## Consistency notes

- When creating a lease, validate that `unitId` exists and that `status` transitions follow allowed rules (e.g. only one `active` lease per unit).
- **Resident self-service**: instant **active** leases use the unit’s `listingRent` for the lease `rent`; require the unit to be **vacant** with `listingRent.amount > 0` and not opted out via `selfServiceEnabled: false`. Apply lease insert, unit status `occupied`, and resident `primaryUnitId` inside a **multi-document transaction** to avoid double booking.
- Use multi-document transactions when updating `units.status` and inserting a `leases` document in one logical operation, if required by business rules.
