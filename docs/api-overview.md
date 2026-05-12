# API overview

The **Apartment API** is a JSON over HTTP service implemented in Go. This document defines conventions for REST design, versioning, errors, pagination, and authentication **as intended for future implementation**. The current codebase exposes a baseline `GET /health` endpoint.

---

## Base URL and versioning

- **Prefix**: All public resources should live under `/v1` (e.g. `/v1/units`).
- **Health**: `GET /health` remains unversioned for load balancers and orchestrators.

Example: `http://localhost:8080/v1/units`

---

## Request and response format

- **Content-Type**: `application/json` for request bodies unless documented otherwise (e.g. file uploads).
- **Character encoding**: UTF-8.
- **Dates**: ISO 8601 strings in UTC (e.g. `2026-04-09T12:00:00.000Z`) unless BSON dates are returned only on the wire from drivers (prefer consistent JSON encoding in handlers).

---

## Authentication (recommended direction)

**Recommended approach: short-lived JWT access tokens + refresh tokens**

| Component | Behavior |
|-----------|----------|
| **Access token** | JWT, short TTL (e.g. 15 minutes), sent as `Authorization: Bearer <token>`. |
| **Refresh token** | Opaque string or signed JWT with longer TTL; stored httpOnly, `Secure`, `SameSite` cookie **or** rotated server-side in a `refresh_tokens` collection. |
| **Issuance** | `POST /v1/auth/login` (or OAuth callback handler) validates credentials and returns access token + sets refresh cookie. |
| **Refresh** | `POST /v1/auth/refresh` issues a new access token when refresh is valid. |
| **Logout** | Invalidate refresh token server-side and clear cookies. |

**Alternative: session cookie**

Issue an opaque session ID in an httpOnly cookie; store session metadata in MongoDB. Simpler for browser-only clients; less ideal for native or third-party API consumers without additional work.

**Next.js integration**

- Prefer **server-side** calls from Next.js Route Handlers or Server Actions that attach credentials or forward cookies to the Go API, avoiding exposure of tokens to client JavaScript when possible.

---

## Authorization

- Use **role-based access control** (e.g. `admin`, `resident`, `staff`) as claims in the JWT or as fields on the session document.
- Enforce authorization at the **handler or service layer** in Go, not only in the UI.

### Resident self-service (current implementation)

Authenticated **residents** (`role: resident`, JWT with resident id) may call:

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/v1/me/available-units` | Lists **vacant** units with `listingRent.amount > 0` and self-service allowed, scoped to the default property when configured. Returns `data[]` with `listingRent`, `propertyName`, etc. |
| `POST` | `/v1/me/leases` | Body: `{ "unitId", "startDate" (RFC3339), "endDate?" }`. Creates an **active** lease for the caller only, rent from `listingRent`, sets unit **occupied**, sets resident **primaryUnitId**. `409 CONFLICT` if the resident already has an active lease, the unit is not bookable, or the unit already has an active lease. `400` if `endDate` is not strictly after `startDate`. |

Admin-only `POST /v1/leases` remains for staff workflows (arbitrary residents, draft/active, custom rent).

---

## Errors

Use a consistent JSON body for failed requests:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "unitId is required",
    "details": [
      { "field": "unitId", "issue": "required" }
    ],
    "requestId": "optional-correlation-id"
  }
}
```

| HTTP status | Typical use |
|-------------|-------------|
| `400` | Validation failure, malformed JSON. |
| `401` | Missing or invalid authentication. |
| `403` | Authenticated but not allowed. |
| `404` | Resource not found. |
| `409` | Conflict (duplicate key, invalid state transition). |
| `500` | Unexpected server error (log server-side, generic message to client). |

The API should log internal causes with `requestId` (aligned with `chi` middleware `RequestID`).

---

## Pagination and filtering

**Query parameters** (convention):

- `limit` — max items (cap at a server-defined maximum, e.g. 100).
- `cursor` — opaque string for cursor-based pagination (recommended for large collections).
- `sort` — optional, documented field names and direction (`asc` / `desc`).

**Response wrapper** (example):

```json
{
  "data": [],
  "meta": {
    "nextCursor": null
  }
}
```

---

## Idempotency

For `POST` operations that create billing or payment side effects, support an `Idempotency-Key` header and store processed keys per tenant or user to avoid duplicate charges.

---

## CORS

Allowed origins are configured via the `CORS_ORIGINS` environment variable (comma-separated). The browser origin of the Next.js app must be included for cookie-based or browser-initiated cross-origin requests.

---

## Related documents

- [architecture.md](./architecture.md) — containers and security boundaries.
- [data-model.md](./data-model.md) — persistence model backing future endpoints.
