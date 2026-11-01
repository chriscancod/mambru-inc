# Veynor redesign (preview, branch only)

Not live. Lives in /new so nothing on the current site changes. Do not merge to main until an adult has reviewed it.

- `index.html`: Veynor home (Apple-clear, mix look)
- `charm.html`: AI charm page with real screen frames from the simulator, how it works, status, FAQ; waitlist only, no price, no ship date
- `solis.html`: Solis phone page rebuilt from the live page's specs (labelled targets, stages, FAQ, 3D model from ../assets)
- `img/`: the five real charm screens (from charm-firmware/esp32/screen_test/preview.html)
- The waitlist form is disabled; connect it to the existing waitlist (`shared/site.js`, `/api/drop-signup`) only after approval.
- Claims are labelled by proof level. Update them as real hardware tests pass (first tests Mon 2026-11-02).
- The current Solis page shows "~$600 expected preorder price"; this preview omits it because no price is confirmed.
