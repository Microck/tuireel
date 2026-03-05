# Phase 21: Social + Icon Assets - Research

**Researched:** 2026-03-05
**Domain:** Brand asset regeneration (banner/OG PNGs) and favicon wiring
**Confidence:** HIGH

## Summary

Phase 21 is narrowly scoped: regenerate the banner and OG PNGs from the now-updated generation script, commit them, and confirm the favicon wiring is already correct. The hard work was done in Phase 20 (script updated to read `palette.json`, docs wiring normalized, drift-check script created). What remains is running the generator, committing the output, and verifying end-to-end.

A critical finding from research: **the PNGs on disk are already regenerated but uncommitted**. The working tree has dirty `banner.png` and `og-image.png` with the v1.15 colors (`#141015` background), while the committed versions still use the old palette (`#0F172A`). The generation script already produces correct output. The favicon SVG is already v1.15-colored and byte-equal between `assets/branding/` and `docs/images/`. The docs.json wiring already uses `{ light, dark }` object shape pointing to `/images/favicon.svg`.

**Primary recommendation:** Run `npx tsx scripts/generate-branding.ts`, commit the regenerated PNGs, run `npx tsx scripts/verify-brand-system.ts` to confirm everything passes, and do a final visual spot-check. No new code, no new dependencies, no new wiring needed.

## Standard Stack

### Core

| Tool/Config                      | Version           | Purpose                                                                    | Why Standard                                                         |
| -------------------------------- | ----------------- | -------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `scripts/generate-branding.ts`   | N/A (repo script) | Generates `banner.png` (1280x640) + `og-image.png` (1200x630)              | Already in repo, reads palette.json, uses favicon.svg as icon source |
| `sharp`                          | 0.34.5            | Image compositing (SVG rasterization + PNG generation)                     | Already a devDependency, proven in Phase 07                          |
| `scripts/verify-brand-system.ts` | N/A (repo script) | Drift checks: palette values, docs.json wiring, asset sync, PNG dimensions | Created in Phase 20, already covers all Phase 21 success criteria    |

### Supporting

| Tool/Config                    | Version     | Purpose                        | When to Use                               |
| ------------------------------ | ----------- | ------------------------------ | ----------------------------------------- |
| `docs/docs.json`               | Mintlify v4 | Favicon + logo wiring for docs | Already configured correctly; verify only |
| `assets/branding/palette.json` | N/A         | Canonical color tokens         | Source of truth for generation script     |

### Alternatives Considered

None. The stack is fully established by prior phases. No new libraries or tools are needed.

## Architecture Patterns

### Asset Generation Pipeline (Already Established)

```
assets/branding/palette.json   (color tokens)
         +
assets/branding/favicon.svg    (icon mark)
         |
         v
scripts/generate-branding.ts   (Sharp compositing)
         |
         v
assets/branding/banner.png     (1280x640, README hero)
assets/branding/og-image.png   (1200x630, social card)
```

The generation script:

1. Reads `palette.json` for `background`, `primary` (title), `secondary` (tagline) colors
2. Reads `favicon.svg` as the icon mark (rasterized at 28% of image height)
3. Composites icon + SVG text overlay onto a solid background
4. Outputs both PNG specs sequentially

### Favicon Wiring (Already Established)

```
assets/branding/favicon.svg  (canonical, 990x989 viewBox)
         |
         | cp (byte-equal)
         v
docs/images/favicon.svg      (Mintlify-consumed copy)
         |
         | referenced by
         v
docs/docs.json               (favicon: { light: "/images/favicon.svg", dark: "/images/favicon.svg" })
```

### Verification Pipeline (Already Established)

`scripts/verify-brand-system.ts` checks:

- Palette schema + exact token values
- `docs/docs.json` colors/background map to palette tokens
- `docs/docs.json` logo + favicon paths point to `/images/*.svg`
- `docs/images/*.svg` are byte-equal to `assets/branding/*.svg`
- `README.md` references `assets/branding/banner.png` and logo SVGs
- `banner.png` is 1280x640, `og-image.png` is 1200x630
- Generation script reads from `palette.json` (not hardcoded colors)

### Anti-Patterns to Avoid

- **Regenerating favicon.svg:** The favicon SVG already uses v1.15 palette colors (`#141015`, `#18AAA7`, `#C1263B`, `#1C346D`). Do not re-derive it. It was updated in commit `3a83299`.
- **Editing PNGs by hand:** Always regenerate via the script to ensure reproducibility.
- **Adding new asset paths:** The README and docs already reference the correct paths. Don't move files or add new ones.

## Don't Hand-Roll

| Problem                | Don't Build                   | Use Instead                            | Why                                             |
| ---------------------- | ----------------------------- | -------------------------------------- | ----------------------------------------------- |
| PNG generation         | Manual Photoshop/Figma export | `scripts/generate-branding.ts`         | Reproducible, reads palette.json, drift-checked |
| Drift verification     | Manual file comparison        | `scripts/verify-brand-system.ts`       | Automated, catches all known drift vectors      |
| SVG favicon derivation | New derivation pipeline       | Existing `assets/branding/favicon.svg` | Already derived, already v1.15 colors           |

**Key insight:** This phase is pure execution of existing infrastructure. Nothing needs to be built.

## Common Pitfalls

### Pitfall 1: Committing Stale PNGs

**What goes wrong:** PNGs were generated from the old palette but committed. The verify script passes for dimensions but doesn't check pixel colors.
**Why it happens:** The committed PNGs still use old `#0F172A` background. If someone runs `git checkout -- assets/branding/` they'll restore the stale versions.
**How to avoid:** Always run `npx tsx scripts/generate-branding.ts` before committing. Verify the background pixel color is `#141015`.
**Warning signs:** `git diff --stat` shows banner.png and og-image.png as modified (they currently ARE modified/dirty).

### Pitfall 2: Font Rendering Differences

**What goes wrong:** The text overlay in generated PNGs uses `system-ui, -apple-system, sans-serif` which varies by OS. CI/different machines may produce slightly different text rendering.
**Why it happens:** Sharp renders SVG text using the system's font stack. There's no embedded font.
**How to avoid:** Accept this as a known limitation. The text is simple ("tuireel" + "Scripted TUI demo recorder") and system fonts are adequate. Generated PNGs should be committed from a single machine, not regenerated in CI.
**Warning signs:** Text looks different on macOS vs Linux renders.

### Pitfall 3: GitHub Social Preview Not Updating

**What goes wrong:** Even after committing the new `og-image.png`, GitHub's social preview when sharing the repo URL may still show the old image.
**Why it happens:** GitHub caches social preview images aggressively. Also, GitHub uses a separately uploaded social preview image (repo Settings > Social preview), not the in-repo file automatically.
**How to avoid:** After committing, manually upload `og-image.png` via GitHub repo Settings > Social preview if a custom preview was previously set. If no custom preview was set, GitHub uses the repo description + language breakdown (no image).
**Warning signs:** Sharing repo URL on Slack/Discord/Twitter shows old or no preview image.

### Pitfall 4: Docs Favicon Not Byte-Equal After Regeneration

**What goes wrong:** If someone modifies `assets/branding/favicon.svg` and forgets to copy to `docs/images/favicon.svg`, the verify script catches it.
**Why it happens:** Two copies of the same file in different directories.
**How to avoid:** The verify script already enforces byte-equality. Phase 21 doesn't modify the favicon SVG so this shouldn't arise, but always run the verifier.

## Code Examples

### Regenerate Banner + OG PNGs

```bash
# Run the generation script
npx tsx scripts/generate-branding.ts

# Expected output:
# Generating branding assets...
#
# ✓ banner.png (1280×640)
# ✓ og-image.png (1200×630)
#
# Done — files written to /path/to/assets/branding
```

### Verify All Brand Wiring

```bash
# Run the comprehensive drift checker
npx tsx scripts/verify-brand-system.ts

# Expected output:
# Brand system verification passed.
```

### Spot-Check PNG Background Color

```bash
# Verify the top-left pixel matches v1.15 background
node -e "
const sharp = require('sharp');
sharp('assets/branding/banner.png')
  .extract({ left: 0, top: 0, width: 1, height: 1 })
  .raw()
  .toBuffer({ resolveWithObject: true })
  .then(({ data }) => {
    const hex = '#' + [data[0],data[1],data[2]].map(c => c.toString(16).padStart(2,'0')).join('');
    console.log('Background:', hex, hex === '#141015' ? 'OK' : 'STALE');
  });
"
```

### Check Favicon Sync

```bash
# Verify docs copy is byte-equal to canonical
cmp -s assets/branding/favicon.svg docs/images/favicon.svg && echo "SYNC OK" || echo "DRIFT"
```

## Current State Assessment

### What's Already Done (No Work Needed)

| Item                                                             | Status | Evidence                                                                       |
| ---------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------ |
| `scripts/generate-branding.ts` reads `palette.json`              | DONE   | Script uses `palette.background`, `palette.primary`, `palette.secondary`       |
| `scripts/generate-branding.ts` uses `favicon.svg` as icon source | DONE   | `readFileSync(resolve(BRANDING_DIR, "favicon.svg"))`                           |
| `assets/branding/favicon.svg` uses v1.15 colors                  | DONE   | Colors: `#141015`, `#18AAA7`, `#C1263B`, `#1C346D` (4/5 palette tokens)        |
| `docs/images/favicon.svg` is byte-equal to canonical             | DONE   | `diff` shows no differences                                                    |
| `docs/docs.json` favicon wiring uses `{ light, dark }` shape     | DONE   | `"favicon": { "light": "/images/favicon.svg", "dark": "/images/favicon.svg" }` |
| `README.md` references `assets/branding/banner.png`              | DONE   | Line 14: `<img src="assets/branding/banner.png" ...>`                          |
| Verification script covers all criteria                          | DONE   | `scripts/verify-brand-system.ts` (243 lines, checks everything)                |

### What Needs To Be Done

| Item                           | Current State                                | Action              |
| ------------------------------ | -------------------------------------------- | ------------------- |
| `assets/branding/banner.png`   | Dirty (v1.15 on disk, old palette committed) | Regenerate + commit |
| `assets/branding/og-image.png` | Dirty (v1.15 on disk, old palette committed) | Regenerate + commit |

### What Doesn't Need Changing

- `favicon.svg` — already v1.15, already synced, already wired
- `docs/docs.json` — already wired correctly
- `README.md` — already references correct paths
- `scripts/generate-branding.ts` — already reads from palette.json
- `scripts/verify-brand-system.ts` — already covers all checks
- `brand-system.md` — already documents correct layout

## Open Questions

1. **GitHub repo social preview upload**
   - What we know: GitHub uses a separately uploaded image (Settings > Social preview), not an in-repo `og-image.png` automatically. In-repo OG images are useful for README embedding and for platforms that scrape the raw GitHub URL.
   - What's unclear: Whether a custom social preview was ever uploaded to GitHub for this repo.
   - Recommendation: After committing, have the user manually check repo Settings > Social preview and upload `og-image.png` if desired. This is a manual GitHub UI action, not automatable. Add this as a human-action verification step, not a script task.

2. **Favicon ICO format**
   - What we know: SVG favicons are well-supported in modern browsers and Mintlify serves them as-is. GitHub doesn't use repo favicons (it uses the org/user avatar).
   - What's unclear: Whether any consumer needs a `.ico` or multi-resolution PNG favicon.
   - Recommendation: Not needed for this phase. SVG favicon is sufficient for Mintlify docs. If ICO is ever needed, Sharp can generate it, but it's out of scope.

## Sources

### Primary (HIGH confidence)

- **Codebase inspection:** `scripts/generate-branding.ts`, `scripts/verify-brand-system.ts`, `assets/branding/palette.json`, `assets/branding/favicon.svg`, `docs/docs.json` — all read directly from repo
- **Git history:** Commit `009c5f1` (old PNGs), `3a83299` (v1.15 logo/palette), `d213be2` (script creation) — verified generation timeline
- **Working tree state:** `git status` confirms `banner.png` and `og-image.png` are modified (uncommitted regeneration)
- **Pixel-level verification:** Sharp metadata + raw pixel extraction confirmed v1.15 colors on disk, old colors in git

### Secondary (MEDIUM confidence)

- **Phase 20 research** (`.planning/phases/20-brand-system-integration/20-RESEARCH.md`) — Mintlify `favicon` supports `{ light, dark }` object shape, verified against Mintlify schema

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH — everything is already in-repo and verified working
- Architecture: HIGH — pipeline is established, just needs execution
- Pitfalls: HIGH — identified from actual codebase state (uncommitted PNGs, GitHub social preview)

**Research date:** 2026-03-05
**Valid until:** 2026-04-05 (stable; no external dependencies changing)
