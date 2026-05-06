# Pages — YNR Local

Every page in the app, what it does, what's on it, and what state it needs.

---

## 1. Home Page `/`

**Purpose**: Primary discovery page. Customers browse and find vendors.

**Who sees it**: Everyone (no login required to browse)

### Layout
- Top bar: App name + "Sign in" button (top right)
- Search bar (full width, prominent)
- Category chips (horizontal scroll on mobile): short labels mapped to slug `VendorCategory` (see [docs/data-models.md](data-models.md) **Home chips** — e.g. “Electrical” → `electrician`, “Camera” → `photographer`)
- Section label: "Electricians near you" (updates based on selected category)
- Vendor card grid (1 col mobile, 2 col tablet, 3 col desktop)

### Vendor card contains
- Avatar (initials fallback if no photo)
- Name
- Category
- Area / locality
- Available / Busy badge
- Call button
- WhatsApp button

### Behaviour
- Default category: All (show all vendors)
- Clicking a category chip filters the list
- Search filters by name, category, or area
- Clicking a card navigates to Vendor Detail
- Call button: `tel:` link
- WhatsApp button: `https://wa.me/91XXXXXXXXXX` link

### State needed
- `vendors` signal (list from API)
- `selectedCategory` signal
- `searchQuery` signal
- `filteredVendors` computed signal

---

## 2. Vendor Detail Page `/vendors/:id`

**Purpose**: Full profile of a single vendor.

**Who sees it**: Everyone (no login required)

### Layout
- Back button (top left)
- Hero section: large avatar, name, category, area badge, availability badge
- Sticky CTA bar: "Call now" button + "WhatsApp" button
- About section (bio/description)
- Services offered (tag chips)
- Area coverage
- Phone number (visible, tappable)

### Behaviour
- Call button: `tel:` link
- WhatsApp: opens WhatsApp with pre-filled message: "Hi, I found you on YNR Local. Are you available?"
- If vendor is inactive: show "Currently unavailable" banner, hide call/WhatsApp buttons

### State needed
- `vendor` signal (single vendor from API by ID)
- `isLoading` signal

---

## 3. Login Page `/login`

**Purpose**: Shared login for both customers and vendors. Phone + OTP flow.

**Who sees it**: Anyone who wants to sign in

### Step 1 — Phone entry
- App logo / name
- Title: "Welcome to YNR Local"
- Subtitle: "Enter your phone number to continue"
- +91 prefix fixed, phone number input
- "Send OTP" button
- Link: "Are you a vendor? Register here" → goes to `/register`

### Step 2 — OTP entry
- "Enter OTP" title
- "Sent to +91 XXXXXXXXXX" subtitle
- 4 OTP input boxes (auto-focus next box on input)
- "Verify & continue" button
- "Resend OTP" link (disabled for 30s)

### Post-login redirect
- If user role is `customer` → redirect to `/` (home)
- If user role is `vendor` → redirect to `/dashboard`
- If new user (first login) → redirect to `/register` for vendors, `/profile/setup` for customers

### State needed
- `phone` signal
- `otpStep` signal (boolean)
- `resendTimer` signal
- `isLoading` signal

---

## 4a. Customer profile setup `/profile/setup`

**Purpose**: Lightweight first-login step so new customers confirm name + area before using `/profile`.

**Who sees it**: Logged-in **customers only** (`authGuard` + customer role); typically redirected here once after OTP when profile is incomplete (no `name` or no `area` — product rule enforced in frontend + optional API flag `profileComplete` if added later).

### Layout

- Title: “Set up your profile”
- Name (required)
- Area / locality (required)
- “Save & continue” → navigates to `/` or `/profile`

### Behaviour

- If customer already completed setup, redirect away (to `/profile` or `/`).
- Saves via `PATCH /users/me`.

### State needed

- `currentUser` signal
- Reactive form fields for name + area

---

## 4. Customer Profile Page `/profile`

**Purpose**: Customer's account page. Basic info, saved vendors, sign out.

**Who sees it**: Logged-in customers only (guard required)

### Layout
- Avatar (initials), name, phone number
- Account details section: name, phone, area, member since
- Saved vendors count (tappable → future feature)
- Sign out option

### Behaviour
- Edit button → inline editing of name and area
- Sign out → clear auth, redirect to home

### State needed
- `currentUser` signal (from auth service)

---

## 5. Vendor Dashboard `/dashboard`

**Purpose**: Vendor's control panel. See basic stats, toggle listing on/off, preview listing.

**Who sees it**: Logged-in vendors only (guard required)

### Layout
- Top bar: "Vendor dashboard" + vendor name + "Edit listing" button
- Stats row (3 cards): Profile views, Calls this week, WhatsApps this week
- Active/Inactive toggle row with label and description
- Listing preview (how your card looks to customers)

### Behaviour
- Toggle on/off: calls API to update vendor `isActive` status, updates preview badge instantly
- "Edit listing" → navigates to `/register` in edit mode (pre-filled form)
- Stats are read-only display (no interaction)

### State needed
- `vendorProfile` signal
- `isActive` signal (derived from vendorProfile, but locally writable for optimistic UI)
- `stats` signal (views, calls, whatsapps)

---

## 6. Vendor Registration / Edit Listing `/register`

**Purpose**: Vendor self-registration form. Also used for editing existing listing.

**Who sees it**: New vendors registering, or existing vendors editing

### 3-step flow

#### Step 1 — Phone (handled by `/login`, vendor arrives here post-OTP)

#### Step 2 — Your info
- Photo upload (optional, shows initials avatar as fallback)
- Full name (required)
- Category dropdown (required): Electrician, Plumber, Gardener, Mechanic, Photographer, Gym trainer, Other
- Area / locality (required): text input (Yamunanagar localities)
- About you (optional): textarea, max 200 chars
- Phone for calls (pre-filled from login, editable)
- WhatsApp number (optional, defaults to same as phone)

#### Step 3 — Review
- Preview of how listing will look to customers
- "Go live" button → submits, activates listing, redirects to `/dashboard`
- "Back to edit" button

### Behaviour
- If vendor already has a listing (edit mode): form is pre-filled, step indicator shows "Edit" not "Register"
- Photo upload: client-side preview before upload
- "Save as draft" → saves without making listing active

### State needed
- `formStep` signal (2 or 3)
- `isEditMode` signal
- `vendorForm` (ReactiveForm, typed)
- `photoPreview` signal (base64 string)
- `isSubmitting` signal

---

## Page Guards summary

| Page | Guard |
|---|---|
| `/` | None |
| `/vendors/:id` | None |
| `/login` | Redirect if already logged in |
| `/profile/setup` | `authGuard` (customer) |
| `/profile` | `authGuard` (customer) |
| `/dashboard` | `authGuard` (vendor) |
| `/register` | `authGuard` or new vendor post-OTP |
