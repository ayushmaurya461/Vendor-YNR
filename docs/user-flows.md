# User Flows — YNR Local

The two core journeys in the app. Every screen and decision point.

---

## Flow 1 — Customer finding a vendor

```
Open app (/)
  ↓
Browse by category OR search by name/area
  ↓
See vendor cards in list
  ↓
Tap vendor card
  ↓
Vendor Detail page (/vendors/:id)
  ↓
Tap "Call now" → phone call opens (tel: link)
  OR
Tap "WhatsApp" → WhatsApp opens with pre-filled message
  ↓
Done. Customer contacts vendor directly.
```

### No login required for this flow.
Customers should be able to find and contact a vendor without creating an account. Login is only needed if they want to save vendors (future feature).

---

## Flow 2 — Customer login (optional)

```
Tap "Sign in" on home page
  ↓
Login page (/login)
  ↓
Enter phone number → tap "Send OTP"
  ↓
Enter 4-digit OTP
  ↓
Verify → redirect to home (/)
  ↓
Profile accessible at (/profile)
```

---

## Flow 3 — Vendor self-registration (new vendor)

```
Tap "Sign in" on home page
  ↓
Login page (/login)
  ↓
Tap "Are you a vendor? Register here"
  ↓
Enter phone number → Send OTP → Verify
  ↓
Step 2: Fill in listing info (/register)
  - Upload photo (optional)
  - Name, category, area (required)
  - About, services (optional)
  - Confirm/edit phone, add WhatsApp
  ↓
Step 3: Review listing preview
  ↓
Tap "Go live"
  ↓
Listing is active. Redirect to dashboard (/dashboard)
```

---

## Flow 4 — Vendor managing their listing

```
Vendor logs in (/login)
  ↓
Redirect to dashboard (/dashboard)
  ↓
See stats: views, calls, WhatsApps
  ↓
Toggle listing ON/OFF (active/inactive)
  ↓
Tap "Edit listing" → (/register in edit mode, pre-filled)
  ↓
Update info → save → back to dashboard
```

---

## Flow 5 — Vendor going inactive temporarily

```
Vendor on dashboard
  ↓
Toggle "Listing active" to OFF
  ↓
PATCH /vendors/:id/status { status: 'inactive' }
  ↓
Optimistic UI update: preview badge changes to "Inactive"
  ↓
Vendor card is REMOVED from home list (status: live filter excludes it)
  ↓
Vendor detail page still accessible via direct URL
  ↓
Detail page shows "Currently unavailable" banner
Call and WhatsApp buttons are hidden
```

---

## Edge cases to handle

| Situation | Behaviour |
|---|---|
| Vendor has no photo | Show initials avatar (first letter of first + last name) |
| Vendor is inactive (status: 'inactive') | Hidden from home list. Detail page (/vendors/:id) still accessible — shows "Currently unavailable" banner, hides Call and WhatsApp buttons. |
| Search returns no results | Show empty state: "No vendors found in this category yet" |
| OTP not received | Show "Resend OTP" after 30s countdown |
| User tries to access `/dashboard` without login | Redirect to `/login` |
| User tries to access `/profile` without login | Redirect to `/login` |
| Vendor tries to register again (already has listing) | Redirect to edit mode, pre-fill form |
| WhatsApp number not set by vendor | Default to their phone number for WhatsApp link |
