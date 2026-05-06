# Decisions — YNR Local

Why we chose X over Y. So Cursor (and future-me) doesn't second-guess these.

---

## No NgModules

**Decision**: Standalone components only.
**Why**: Angular 17+ best practice. Simpler, less boilerplate, easier lazy loading. NgModules are legacy at this point for new projects.

---

## Signals over RxJS for state

**Decision**: Angular Signals for all UI and shared state. RxJS only for HTTP and streams.
**Why**: Signals are simpler, more readable, and performant for component state. RxJS is powerful but overkill for a listing app. We use `toSignal()` to bridge HTTP observables into signals.

---

## No NgRx / no global store

**Decision**: No NgRx, no Akita, no global state library.
**Why**: This is a small app. Service-level signals are enough. Adding NgRx would double the boilerplate for zero benefit in v1.

---

## OnPush everywhere

**Decision**: `ChangeDetectionStrategy.OnPush` on every component.
**Why**: Better performance. Forces clean data flow through inputs/signals. No hidden bugs from mutable state.

---

## No Tailwind

**Decision**: Plain CSS with design tokens.
**Why**: Tailwind is great, but adds build complexity and class bloat for a small project. Our token-based approach (`--color-primary`, `--space-4`, etc.) gives us consistency without the overhead. Revisit in v2 if the team grows.

---

## Phone + OTP only (no email/password)

**Decision**: Authentication is phone number + 4-digit OTP only.
**Why**: Target users are in a tier-2 city. Phone is universal. Email is less reliable. Passwords add friction and support burden. OTP is what they already use for UPI and banking.

---

## No bookings or payments in v1

**Decision**: Customers contact vendors directly via call/WhatsApp.
**Why**: Booking systems add enormous complexity — scheduling, cancellations, refunds, vendor confirmation. V1 goal is just discovery. The transaction happens offline. If this works, payments are V2.

---

## No reviews in v1

**Decision**: No star ratings, no review system.
**Why**: Reviews require moderation, fake review prevention, and enough users to be meaningful. In a city of this size with early user counts, reviews would be empty and useless. Word of mouth still works. V2.

---

## Vendor self-registers (no admin approval)

**Decision**: Vendors can register and go live immediately without admin approval.
**Why**: Admin approval slows down onboarding. For v1 with a small known city, trust is managed by the vendor being contactable by phone. Bad actors can be removed manually. Keep the friction low.

---

## Yamunanagar only for v1

**Decision**: Hard-coded to one city. No multi-city architecture.
**Why**: Trying to build multi-city before validating the product is premature. The entire app assumes Yamunanagar. Area fields are Yamunanagar localities. No geo-detection needed.

---

## Feature-first folder structure

**Decision**: `/features/vendors`, `/features/auth` — not `/components`, `/services`.
**Why**: Feature folders keep related files together. When you work on vendors, everything vendor-related is in one place. Type-based folders (all services in one folder, all components in another) forces context-switching.

---

## System font, no Google Fonts

**Decision**: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
**Why**: No extra HTTP request. Loads instantly. Looks native on every device. For a utility app used on budget Android phones, this matters.

---

## Lazy load every feature route

**Decision**: Every feature uses `loadComponent()` in routing.
**Why**: Initial bundle stays small. Home page loads fast. Dashboard and registration are only loaded when needed. Critical for mobile users on slower connections.

---

## Inactive vendors — hidden from home list

**Decision**: Vendors with `status: 'inactive'` are excluded from GET /vendors results entirely.
**Why**: Showing "Unavailable" cards clutters the home list and confuses customers.
Inactive vendors are still accessible via their direct URL (/vendors/:id) where a
"Currently unavailable" banner is shown and call/WhatsApp buttons are hidden.

---

## One phone = one role (mutually exclusive)

**Decision**: A phone number can only be registered as either a customer OR a vendor. Not both.
**Why**: Simplest auth logic for V1. Role lives on the User document as an enum. If someone
wants both roles, they use a second number. Revisit in V2 if there is real demand.

---

## OTP storage — Mongo TTL collection (no Redis)

**Decision**: OTPs are stored in a dedicated `otps` MongoDB collection with a TTL index of 5 minutes.
Each document has a `maxAttempts: 3` field. After 3 failed attempts the OTP is invalidated.
**Why**: Keeps the stack to one database. Redis is unnecessary complexity for V1 scale.

---

## Stats instrumentation — frontend fire-and-forget events

**Decision**: When a customer taps Call or WhatsApp, the frontend fires
`POST /vendors/:id/events` in the background without awaiting it (non-blocking).
Backend stores the event and aggregates on demand for the dashboard.
**Why**: Simple, honest enough for V1 at Yamunanagar scale. Stats are directional,
not billing-critical. Revisit with proper instrumentation in V2.

---

## Photo upload — direct browser to Cloudinary

**Decision**: The backend generates a signed Cloudinary upload signature via
`GET /media/sign`. The frontend uploads the photo directly to Cloudinary.
The resulting URL is sent back to the backend as a string field on PATCH /vendors/:id.
**Why**: No binary data passes through the Fastify server. Saves Railway bandwidth,
simplifies the server, and is the recommended Cloudinary pattern for web apps.

---

## Categories are dynamic, not hardcoded

**Decision**: Vendor categories are stored in a MongoDB `categories` collection
and served via GET /categories. The frontend renders chips from API response.
**Why**: Hardcoding categories means a code deploy every time a new service
type appears in Yamunanagar. The city has security camera installers, caterers,
vehicle mechanics, and more — this list will grow. Admin manages it via DB directly in V1.
