# YNR Local — Project Overview

## What is this?

YNR Local is a hyperlocal vendor listing platform for **Yamunanagar, Haryana**.

It connects people in Yamunanagar with trusted local service providers — electricians, plumbers, gardeners, mechanics, photographers, gym trainers, and more.

Think Urban Company, but built specifically for a tier-2 city where word-of-mouth is still king and people need a simple, fast way to find and contact local help.

---

## The Problem

People in Yamunanagar currently find local service vendors through:
- Word of mouth
- Local newspaper ads (physical paper, still active)
- Random WhatsApp forwards
- Asking neighbors

There is no reliable, searchable, always-available directory. Vendors also have no easy way to be discoverable beyond their immediate social circle.

---

## The Solution (V1)

A clean, mobile-first web app where:
- **Customers** can search and browse local vendors by category and area, then contact them directly via call or WhatsApp
- **Vendors** can self-register, upload their photo, list their services, and toggle their availability

No bookings. No payments. No reviews. Just: *find the person, contact them directly.*

---

## Who is this for?

### Primary user — Customer
- Resident of Yamunanagar
- On mobile (Android, budget phone)
- Wants to find a local service quickly
- Comfortable with WhatsApp and phone calls
- Does NOT want to create an account just to browse

### Secondary user — Vendor
- Local service provider in Yamunanagar
- May not be very tech-savvy
- Wants more customers to find them
- Understands WhatsApp and calls
- Currently relies on newspaper ads or word-of-mouth

---

## V1 Scope (non-negotiable)

| Feature | Included |
|---|---|
| Browse vendors by category | ✅ |
| Search vendors | ✅ |
| Click-to-call | ✅ |
| WhatsApp button | ✅ |
| Vendor self-registration | ✅ |
| Vendor active/inactive toggle | ✅ |
| Customer login (phone + OTP) | ✅ |
| Vendor login (phone + OTP) | ✅ |
| Vendor dashboard (basic) | ✅ |
| Payments | ❌ |
| Reviews / ratings | ❌ |
| In-app chat | ❌ |
| Map view | ❌ |
| Booking system | ❌ |
| Admin panel | ❌ (V2) |
| Notifications | ❌ (V2) |

---

## City scope

**Yamunanagar only** for V1. No expansion logic needed yet. All area filters are Yamunanagar localities.

---

## Tech stack

- **Frontend**: Angular (standalone components, Signals, OnPush)
- **Styling**: CSS with design tokens (no Tailwind for now)
- **State**: Angular Signals (no NgRx)
- **Forms**: Reactive Forms (typed)
- **API calls**: HttpClient via services, converted to signals with `toSignal()`
- **Routing**: Angular Router with lazy-loaded feature components
- **Auth**: Phone + OTP

---

## Core philosophy

> Build the smallest thing that is actually useful. Ship it. Then improve.

- Speed over beauty
- Mobile over desktop
- Simple over clever
- Real users over imaginary scale
