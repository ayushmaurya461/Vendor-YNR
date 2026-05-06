# Design System — YNR Local

Clean, minimal. Urban Company feel. Mobile-first. Boring on purpose.

---

## Color tokens

```css
:root {
  /* Primary — Green (trust, local, fresh) */
  --color-primary:        #1D9E75;
  --color-primary-light:  #E1F5EE;
  --color-primary-dark:   #0F6E56;

  /* Neutral */
  --color-text-primary:   #1a1a1a;
  --color-text-secondary: #6b7280;
  --color-text-tertiary:  #9ca3af;

  --color-bg-primary:     #ffffff;
  --color-bg-secondary:   #f9fafb;
  --color-bg-tertiary:    #f3f4f6;

  --color-border:         #e5e7eb;
  --color-border-strong:  #d1d5db;

  /* Status */
  --color-success:        #1D9E75;
  --color-success-bg:     #E1F5EE;
  --color-warning:        #BA7517;
  --color-warning-bg:     #FAEEDA;
  --color-danger:         #E24B4A;
  --color-danger-bg:      #FCEBEB;
}
```

---

## Spacing — 8px grid (non-negotiable)

```css
:root {
  --space-1:  4px;
  --space-2:  8px;
  --space-3:  12px;
  --space-4:  16px;
  --space-5:  20px;
  --space-6:  24px;
  --space-8:  32px;
  --space-10: 40px;
  --space-12: 48px;
}
```

Never use arbitrary values like `13px`, `22px`, `37px`. Stick to the grid.

---

## Typography

One font family only: system font stack (no Google Fonts for v1, keeps it fast).

```css
:root {
  --font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
```

Two font sizes for body content:

```css
:root {
  --text-sm:   13px;  /* labels, badges, secondary info */
  --text-base: 15px;  /* body text, card content */
  --text-lg:   18px;  /* section titles, vendor names on detail page */
  --text-xl:   22px;  /* page titles */
}
```

Font weights:
- `400` — body, secondary text
- `500` — names, labels, buttons
- No 600, 700 — too heavy for this vibe

Line height: `1.5` for body, `1.2` for headings.

---

## Border radius

```css
:root {
  --radius-sm:  6px;   /* badges, chips */
  --radius-md:  8px;   /* inputs, buttons */
  --radius-lg:  12px;  /* cards */
  --radius-full: 9999px; /* avatars, toggle pills */
}
```

---

## Shadows

Minimal. Only where functionally needed.

```css
:root {
  --shadow-card: 0 1px 3px rgba(0,0,0,0.06);
}
```

No decorative shadows. No glow effects.

---

## Reusable components to build first

### Button

Variants: `primary`, `secondary`, `ghost`, `danger`

```css
.btn {
  height: 44px;           /* touch-friendly minimum */
  padding: 0 var(--space-4);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: 500;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
}
```

### Card

```css
.card {
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
}
```

### Badge

```css
.badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: 3px var(--space-2);
  border-radius: var(--radius-sm);
  font-size: 11px;
  font-weight: 500;
}
```

### Avatar (initials fallback)

```css
.avatar {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 500;
  font-size: 14px;
  background: var(--color-primary-light);
  color: var(--color-primary-dark);
}
```

### Input

```css
.input {
  width: 100%;
  height: 44px;           /* touch-friendly */
  padding: 0 var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--text-base);
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
}

.input:focus {
  outline: none;
  border-color: var(--color-primary);
}
```

---

## Avatar initials logic

```ts
export function getInitials(name: string): string {
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
```

---

## Exceptions

- **Category chip row (home page only)**: uses `overflow-x: auto` horizontal scroll with
  `scrollbar-width: none` (hidden scrollbar). This is intentional UX — not a violation of
  the no-horizontal-scroll rule. All other page content must never scroll horizontally.

---

## Do not

- Random colors outside the token system
- Fixed pixel widths on containers
- More than 2 font sizes on a single page
- Drop shadows on every element
- Animations that last more than 300ms
- Horizontal scroll on **page body** except the **home category chip row** documented in Exceptions above (that row may use horizontal overflow only)
