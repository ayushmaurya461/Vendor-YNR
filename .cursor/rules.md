# Cursor Rules — YNR Local

You are helping build YNR Local — a hyperlocal vendor listing platform for Yamunanagar, Haryana, India.

Read /docs/overview.md before starting any task. It tells you what this app is, who it's for, and what's in scope for v1.

---

## Project context

- Angular 17+ standalone components (no NgModules)
- Signals-first state management (no NgRx)
- OnPush change detection on every component
- Reactive Forms with typed FormGroups
- Feature-first folder structure
- Mobile-first CSS (320px base, scale up)
- System font stack only (no Google Fonts)
- Plain CSS with design tokens (no Tailwind)
- Lazy-loaded feature routes via loadComponent()

---

## Folder structure

```
/src/app
  /features
    /home
    /vendors
    /auth
    /dashboard
    /register
  /shared
    /ui          ← reusable components: button, card, badge, avatar, input
    /utils       ← pure functions: getInitials, formatPhone, buildWhatsAppUrl
    /directives
  /core
    /services    ← auth.service.ts, vendor-api.service.ts
    /interceptors
    /guards
```

Never create type-based folders like `/components`, `/services`, `/pipes` at the root level.

---

## Component rules

- Always standalone: `standalone: true`
- Always OnPush: `changeDetection: ChangeDetectionStrategy.OnPush`
- Use `inject()` for dependency injection, never constructor injection
- Use `input()` and `output()` (new signal-based API), not `@Input()` / `@Output()` decorators
- Smart components fetch data and own state. Dumb components receive inputs only.
- No logic in templates. Move computed values to `computed()` signals.

```ts
// Correct component shell
@Component({
  selector: 'app-vendor-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...],
  template: `...`,
  styles: [`...`]
})
export class VendorCardComponent {
  vendor = input.required<Vendor>();
  private router = inject(Router);
}
```

---

## State rules

- Component-level state: use `signal()` inside the component
- Shared state: use `signal()` inside a `providedIn: 'root'` service
- Derived state: always use `computed()`
- Side effects: use `effect()`, never in templates
- HTTP → Signal: use `toSignal(this.http.get(...))`
- Never use `BehaviorSubject` for state that could be a signal

---

## Service rules

- One service per feature domain: `vendor-api.service.ts`, `auth.service.ts`
- Services handle HTTP only. State lives in the component or a store service.
- Name clearly: `vendor-api.service.ts` not `data.service.ts`

---

## Routing rules

- Every feature route uses `loadComponent()` (lazy loading, non-negotiable)
- Guards: `authGuard` for `/profile` and `/dashboard`
- No eager-loaded feature components

```ts
{
  path: 'vendors/:id',
  loadComponent: () =>
    import('./features/vendors/vendor-detail.component')
      .then(m => m.VendorDetailComponent)
}
```

---

## CSS rules

- Use design tokens from `styles.css` — never hardcode colors or spacing
- Mobile-first: base styles for 320px, then `@media (min-width: 768px)` for desktop
- No fixed widths. Use `width: 100%; max-width: Xpx`
- No horizontal scroll on page body — **exception**: home category chip row per `/docs/design-system.md` Exceptions
- Minimum tap target: 44px height on all interactive elements
- Scoped styles only — no global CSS except tokens and resets

---

## Naming conventions

| Type | Convention | Example |
|---|---|---|
| Component | kebab-case | `vendor-card.component.ts` |
| Service | feature-type | `vendor-api.service.ts` |
| Signal store | feature-store | `vendor-store.ts` |
| Interface | PascalCase | `Vendor`, `AuthState` |
| Utils | feature-utils | `vendor-utils.ts` |
| Guard | feature-guard | `auth.guard.ts` |

---

## What NOT to build (v1 scope — do not add these)

- Payment integration
- Review / rating system
- Booking / scheduling
- In-app chat
- Push notifications
- Admin panel
- Map / geolocation features
- Multi-city support
- Email authentication

If a feature isn't in `/docs/overview.md` V1 scope table, do not build it without asking.

---

## Design reference

See `/docs/design-system.md` for all color tokens, spacing, typography, and component styles.
See `/docs/pages.md` for what goes on each page.
See `/docs/data-models.md` for all TypeScript interfaces.
See `/docs/user-flows.md` for user journeys and edge cases.

---

## Backend context

The backend is Fastify + MongoDB Atlas. Rules are in /docs/backend-rules.md.
Read that file when working on any /apps/api code.
Key decisions:
- status: 'draft' | 'live' | 'inactive' on vendors (never isActive boolean)
- OTP stored in Mongo TTL collection, maxAttempts: 3, TTL: 5 min
- Photo uploads: client → Cloudinary directly (backend signs only)
- Stats: POST /vendors/:id/events, fire-and-forget from frontend
- One phone = one role, mutually exclusive
