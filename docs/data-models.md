# Data Models — YNR Local

All core data shapes used across the app. Keep these as the single source of truth.

---

## Vendor

```ts
export interface Vendor {
  id: string;
  name: string;
  phone: string;           // used for call button
  whatsapp: string;        // may differ from phone
  category: string;
  area: string;            // locality in Yamunanagar
  about?: string;          // short bio, max 200 chars
  services?: string[];     // tags like ['Wiring', 'Switchboard']
  photoUrl?: string;       // if empty, show initials avatar
  status: 'draft' | 'live' | 'inactive';
  createdAt: string;       // ISO date string
}
```

---

## Category

```ts
export interface Category {
  id: string;
  slug: string;       // 'security-camera', 'electrician'
  label: string;      // 'Security Camera', 'Electrician'
  icon: string;       // emoji string for now
  isActive: boolean;
}
```

---

## User (Customer)

```ts
export interface User {
  id: string;
  phone: string;
  name?: string;
  area?: string;           // their locality in Yamunanagar
  role: 'customer' | 'vendor';
  createdAt: string;
}
```

---

## AuthState

```ts
export interface AuthState {
  user: User | null;
  token: string | null;
  isLoggedIn: boolean;
}
```

---

## VendorStats (Dashboard only)

```ts
export interface VendorStats {
  profileViews: number;
  callsThisWeek: number;
  whatsappsThisWeek: number;
}
```

---

## API response wrapper

```ts
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}
```

---

## Notes

- All IDs are strings (UUIDs from backend)
- Dates are ISO 8601 strings, format for display in components
- `photoUrl` is always optional — UI must always handle the initials fallback
- `whatsapp` field: if vendor leaves it empty during registration, default to `phone`
- Do not add fields speculatively — only add when a page actually needs them
- `status` replaces the old `isActive: boolean`. Never use a boolean active flag.
  - `draft` — vendor registered but not yet gone live
  - `live` — visible on home list, contactable
  - `inactive` — hidden from home list, detail page shows "unavailable" banner
