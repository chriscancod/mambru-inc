# Mambru Inc

Mambru Inc's own site — spun out of the 2AM/cungus storefront so the
hardware line has a home that isn't tangled up with streetwear checkout.

- `index.html` — Veynor Solis product page (landing page): RK3588 board,
  solar + thermal-hybrid power, custom Android launcher, 3D shell viewer
- `home.html` — product hub (room for more products as they ship)
- `shared/` — design system (`base.css`) and site behavior (`site.js`):
  cursor, glass nav, magnetic buttons, waitlist form submit
- `assets/` — 3D model and other static assets
- `CNAME` — GitHub Pages custom domain: mambru.online

No cart or payment processing here — the preorder CTA is a waitlist
(email capture via the existing `/api/drop-signup` endpoint) until a
real checkout flow is stood up for this brand.
