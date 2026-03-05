# Tuireel Brand System (v1.15)

This document is intentionally drift-resistant.

## Source of truth

Palette tokens live in a single canonical file:

- `assets/branding/palette.json`

Do not duplicate token values elsewhere in markdown docs. Any surface that needs exact colors should reference (or be synced from) the JSON.

## Palette tokens

The v1.15 palette exposes these token names:

- `background`
- `surface`
- `primary`
- `secondary`
- `accent`

## Logo assets

Canonical SVGs:

- `assets/branding/logo.svg` (canonical logo; for light backgrounds)
- `assets/branding/logo-dark.svg` (for dark backgrounds)

Where they are consumed:

- README banner/logo: `README.md` references the canonical + dark SVG variants directly from `assets/branding/`.

## Social assets

These images are used for the repo front door and social previews:

- `assets/branding/banner.png` (README hero image)
- `assets/branding/og-image.png` (open graph / social card)

To regenerate them from the canonical palette + favicon mark:

- `scripts/generate-branding.ts`

## Docs theming

Mintlify docs are wired via:

- `docs/docs.json`

Docs-consumed asset copies live at:

- `docs/images/logo-dark.svg`
- `docs/images/favicon.svg`

These files should remain byte-equal to their canonical counterparts in `assets/branding/`.
