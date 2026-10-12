# warrantyvault: Personal collection

Airy blue collection space, rounded welcome panel, physical-item passports, serial numbers and circular coverage counters. Claims remain one action away from a purchase.

## Implementation

- `src/layout.tsx`: product-specific navigation and page frame.
- `src/experience.tsx`: workflow hierarchy and record presentation.
- `src/design.css`: independent design tokens, responsive layout, dark mode and entry-page composition.
- `src/styles.css`: low-level form, dialog and accessibility primitives.
- `public/app-icon.*`: this product's own icon. Website editorial artwork is described in `ASSETS.md`.

## Guardrails

Keep this composition distinct from the other portfolio products. Do not restore the shared hero + three KPI cards + record grid arrangement. Preserve real data, meaningful actions, form validation and loading/empty/error states. Never add decorative controls that do nothing. Arabic uses its own readable font and logical-direction layout; keyboard focus remains visible. Keep primary touch targets at least 44px and put wide data tables in local scroll containers. Light and dark styles must pass the configured contrast checks. Honor reduced motion.

The README screenshots are captured from the running application, not design mockups. Sample records are explicitly labeled as fictional. Review changes at 375, 414, 768, 1024 and 1440px, in Arabic and English.
