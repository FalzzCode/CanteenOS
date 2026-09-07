# Light and dark theme parity audit

Date: 2026-08-11
Preview: http://localhost:3003/

## Finding

The light theme used a separate, looser geometry than the dark theme. At the same 1280 × 742 viewport, the light header was 189.6 px tall versus 156.7 px in dark; the command bar was 131.6 px versus 110.5 px; cards used 21 px padding versus 18 px; and KPI cards used 18 px padding versus 14 px.

## Fix

- Promoted the dark theme's compact geometry into the shared layout rules.
- Removed dark-only spacing and typography overrides so themes now differ through color, border, and surface treatment only.
- Unified content width, page header, context chips, dashboard command bar, KPI cards, and shared card typography.
- Preserved the light navy–teal–gold palette and dark purple–pink palette.

## Verification

- Desktop 1280 × 742: both themes now render a 156.7 px header, 133.1 px KPI row, 110.5 px command bar, 360.7 px sales card, and matching content columns.
- Mobile 390 × 844: both themes use identical header height, two-column KPI grid, single-column command bar, and no horizontal overflow.
- Reports module: both themes use matching card widths and 18 px card padding with no horizontal overflow.
- `npm.cmd run lint`, `npm.cmd run build`, and `node --test tests/rendered-html.test.mjs` pass.

## Evidence

- `01-light-before.png`
- `02-dark-reference.png`
- `03-light-after.png`
- `04-dark-after.png`
- `05-mobile-light.png`
- `06-mobile-dark.png`
- `07-report-light.png`

Accessibility note: this pass validates responsive layout parity and absence of horizontal overflow. It is not a substitute for a full keyboard, screen-reader, and contrast audit.
