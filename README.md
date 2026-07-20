# EVHub — Platform Prototype v3 "Volt"

Fully rebuilt design: dark-pine × volt-lime design language, real photography (Wikimedia Commons, licensed + attributed), brand-logo search, category thumbnails, redesigned vehicle page (grouped specs, battery-passport certificate, AI predictor with usage presets), a geolocation range map with **two overlapping circles** (outer = one-way reach, inner = round-trip without charging), and a **4-car comparison page** with grouped rows and best-value highlights.

Open **`app/index.html`** in any modern browser — no build step, no server needed. (Car photos load from the internet; offline you'll see brand placeholders.)

## What's inside

| Area | Features |
|---|---|
| **Marketplace** | EV-specific filters (city, price, min range, min SoH, condition, connector, verified/inspected), 6 sort modes, save, compare, price-drop alerts, seller profiles |
| **Compatibility Engine** | Set "my vehicle" in Account → chargers/parts are auto-filtered to your connector (Type 2 / GB/T), with fit/no-fit tags on every product |
| **Vehicle pages** | Battery passport (SoH certificate), **AI degradation forecast** (city-heat aware, 3/5-year chart), **EV-readiness score** (ring gauge per city), TCO mini-calculator, contextual owner reviews (summer consumption, charging experience), offer modal, similar vehicles |
| **Charging** | Public station map (Leaflet + list fallback, tariffs, live status, Google Maps directions) + **P2P community charging**: host cards, slot booking, pricing/kWh, address privacy, ratings, host onboarding with earnings estimate |
| **Tools** | Vehicle finder wizard (5 questions → scored matches), **interactive range map** (one-way + round-trip circles, city reachability list), Saudi Range Lab (temp/speed/AC/load/terrain), full TCO calculator, smart bundle configurator, in-car UI simulator (Tesla + BYD), AR preview (coming soon) |
| **Services** | Home-charger recommendation flow (property type → charger match → certified installer → book), inspection booking, smart care plan |
| **Community** | P2P test drives with verified owners, Telegram hub, community stories |
| **Account** | Default vehicle + city (powers compatibility & personalisation), saved items, alert toggles, language + theme settings |
| **Sell** | 5-step listing wizard with battery/SoH fields and manual-review trust policy |

## Design system

- **Arabic-first RTL** with full English LTR toggle (top bar). All copy written fresh in both languages (`js/i18n.js`).
- **Light + dark themes** (top bar toggle), tokens in `css/main.css` — brand pine/mint palette, glass surfaces, logical CSS properties so both directions render correctly.
- Mobile-first: bottom navigation bar, responsive grids, safe-area support.
- All preferences persist in `localStorage`.

## Files

```
app/
  index.html        shell + nav
  css/main.css      design tokens (light/dark) + components
  js/i18n.js        AR/EN dictionaries
  js/data.js        demo data (vehicles, stations, hosts, sellers, reviews…)
  js/core.js        state, router, vehicle artwork, shared components
  js/home|market|detail|charging|tools|misc|app.js
  test/smoke.js     jsdom test: 24 routes × 2 languages + interaction flows
```

Run tests: `node test/smoke.js` (needs `npm i jsdom` once).

## What needs a backend (marked "coming soon" in the UI)

| Feature | Needs |
|---|---|
| Accounts + mobile OTP auth | `users` table, SMS provider (e.g. Unifonic), sessions |
| Real listings + moderation queue | `listings`, `listing_media`, `moderation_log`, file storage |
| Messaging + offers | `conversations`, `messages`, `offers`, push notifications |
| P2P charging bookings + payments | `chargers`, `bookings`, `payouts`, payment gateway (Mada/STC Pay via Moyasar/Tap), address-privacy logic |
| Price/OTA alerts | `alerts` + scheduled jobs |
| SoH certificates | `inspections` + PDF storage + inspector portal |
| Test-drive sessions | `sessions`, escrow of symbolic fee, identity verification |
| Live station status | Operator APIs (EVIQ/Electromin) or crowdsourced updates |

Suggested stack: **Supabase** (Postgres + Auth + Storage + Realtime) fits every table above; the frontend is already structured around a data layer (`js/data.js`) that can be swapped for API calls.

---
*All data is illustrative. Demo build — July 2026.*
