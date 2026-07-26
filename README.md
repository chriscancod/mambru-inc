# Mambru Inc

Mambru Inc's own site — spun out of the 2AM/cungus storefront so the
hardware line has a home that isn't tangled up with streetwear checkout.

- `index.html` — home / product hub (room for more products as they ship)
- `veynor-solis.html` — Veynor Solis product page: RK3588 board, solar +
  thermal-hybrid power, custom Android launcher, 3D shell viewer
- `shared/` — design system (`base.css`) and site behavior (`site.js`):
  cursor, glass nav, magnetic buttons, waitlist form submit
- `assets/` — 3D model and other static assets

No cart or payment processing here — the preorder CTA is a waitlist
(email capture via the existing `/api/drop-signup` endpoint) until a
real checkout flow is stood up for this brand.
