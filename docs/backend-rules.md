# Backend Rules — YNR Local

You are building the Fastify + MongoDB backend for YNR Local.

Read `/docs/overview.md` before starting any task. Understand what this app is and what is in V1 scope before writing anything.

> **Canonical copy**: this file in `/docs/` is the source of truth. A short pointer may exist under `.cursor/backend-rules.md`.

---

## Stack

- **Runtime**: Node.js 20+
- **Framework**: Fastify (not Express)
- **Database**: MongoDB Atlas via Mongoose
- **Auth**: Phone + OTP (MSG91) → JWT
- **File uploads**: Cloudinary (signed uploads — client uploads directly, server only generates signature)
- **Hosting**: Railway
- **Environment config**: Zod-validated env via a single `config/env.ts`

---

## Folder structure

```
/apps/api/
  src/
    config/
      env.ts
      logger.ts
    plugins/
      mongodb.ts
      cors.ts
      jwt.ts
      sensible.ts
    modules/
      health/
        health.routes.ts
      auth/
        auth.routes.ts
        auth.service.ts
        otp.repository.ts
      users/
        user.schema.ts
        user.repository.ts
        user.routes.ts
      vendors/
        vendor.schema.ts
        vendor.repository.ts
        vendor.routes.ts
      media/
        media.routes.ts
      analytics/
        analytics.routes.ts
        analytics.service.ts
    lib/
      msg91.ts
      cloudinary.ts
    types/
      dto.ts
    server.ts
```

---

## Module rules

- One folder per domain: `auth`, `vendors`, `users`, `media`, `analytics`
- Routes register themselves — `server.ts` calls `app.register(...)` with prefixes
- Never put DB queries in route handlers. Repository layer only.
- Never put business logic in repositories. Service layer only.

---

## Mongoose / Schema rules

- Use Mongoose with TypeScript: define interface + `Schema<Doc>`
- Use `timestamps: true` on every schema
- Index fields you query on: `category`, `status`, `phone`, `userId`

---

## Auth rules

### OTP flow

```
POST /auth/send-otp   { phone: string }
POST /auth/verify-otp { phone: string, otp: string, role?: 'customer' | 'vendor' }
```

- New user: create `User` with `role` from body (default `customer`).
- Existing user: return JWT; **reject** if request implies a different role than stored (one phone = one role).
- OTP: Mongo `otps` collection, TTL **5 minutes**, verify **max 3** failed attempts per OTP doc.
- Rate limit: **max 3** `send-otp` requests per phone per **10 minutes** (track `lastSentAt` / window on OTP doc or separate field).

### JWT

- Payload: `{ userId, role, phone }`
- Expiry: **30 days**
- No refresh tokens in V1
- Logout: client discards token

### Dev / CI

- `OTP_LOG_ONLY=true`: do not call MSG91; log the generated OTP to server logs. When `OTP_LOG_ONLY` is false, `MSG91_AUTH_KEY` and `MSG91_TEMPLATE_ID` are required.

---

## Vendor rules

### Status

`status: 'draft' | 'live' | 'inactive'` — never `isActive: boolean`.

| Status | Public list | Public GET `/:id` | Authenticated owner |
| --- | --- | --- | --- |
| `draft` | No | **404** | Yes via `GET /vendors/me` |
| `live` | Yes | Yes | Yes |
| `inactive` | No | Yes (banner + no CTAs in UI) | Yes |

### Routes

**Public**

```
GET  /vendors              ← list; status=live only; filters + pagination
GET  /vendors/:id          ← live + inactive only; draft → 404
POST /vendors/:id/events   ← analytics (204, no auth)
```

**Vendor (JWT + role vendor)**

```
GET    /vendors/me                      ← current user’s Vendor (includes draft)
POST   /vendors                         ← create (default status draft)
PATCH  /vendors/:id                     ← update fields (must own)
PATCH  /vendors/:id/status              ← body: { status: 'live' | 'inactive' | 'draft' } (enforce allowed transitions)
GET    /vendors/:id/stats               ← dashboard; must own vendor
```

### Query rules for `GET /vendors`

- Always `status: 'live'`
- `?category=`, `?area=`, `?q=` (name + area), `?page=&limit=`
- Sort: `createdAt: -1`

---

## Photo upload

- `GET /media/sign` (authenticated vendor): returns Cloudinary upload params/signature for direct upload.
- Client sends resulting `photoUrl` on `PATCH /vendors/:id`.

---

## Analytics

```
POST /vendors/:id/events   { type: 'view' | 'call' | 'whatsapp' }
```

- Respond **204** immediately; persist `{ vendorId, type, createdAt }`.
- **`view`**: frontend may send once when vendor detail loads (fire-and-forget).
- **`call` / `whatsapp`**: fire on CTA taps.

```ts
GET /vendors/:id/stats  (vendor owner only)
→ { profileViews, callsThisWeek, whatsappsThisWeek }
```

- `profileViews` = count of `view` events in last 7 days (or “all time” for V1 — pick one implementation; week-aligned to match other stats is fine).

---

## Error handling

- Use `@fastify/sensible` `httpErrors`
- Never expose raw Mongo errors
- Validation via JSON Schema on routes

---

## Environment variables

See `apps/api/.env.example`. `config/env.ts` validates with Zod.

---

## What NOT to build in V1

Redis, WebSockets, email auth, payments, reviews, admin, multi-city, bookings, JWT refresh, server-side binary upload for vendor photos.

If it is not in `/docs/overview.md` V1 scope, do not build it without asking.
