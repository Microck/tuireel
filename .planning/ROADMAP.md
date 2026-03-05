# Roadmap: Tuireel

## Milestones

- ✅ **v1.0 MVP** - Phases 1-6 (shipped 2026-03-03)
- ✅ **v1.1 Branding, Docs & Hardening** - Phases 7-19 (shipped 2026-03-05)
- ✅ **v1.15 Brand Refresh & Docs Hosting** - Phases 20-24 (shipped 2026-03-05)

## Active Milestone

### ✅ v1.15 Brand Refresh & Docs Hosting (Phases 20-24)

**Milestone Goal:** Refresh Tuireel's public-facing identity (logo + palette + assets) and move the Mintlify docs to `https://tuireel.micr.dev`, with a README refresh aligned to Webreel's style.

**Phases**

- ✅ **Phase 20: Brand System Integration** - Canonical logo + palette tokens integrated across repo and docs surfaces. (completed 2026-03-05)
- ✅ **Phase 21: Social + Icon Assets** - Banner/OG assets regenerated; favicon derived + wired for repo and docs. (completed 2026-03-05)
- ✅ **Phase 22: Docs Domain Move** - Mintlify docs hosted on `https://tuireel.micr.dev` with canonical links set. (completed 2026-03-05)
- ✅ **Phase 23: Docs Theme Alignment** - Docs theme matches v1.15 brand system (logo, colors, favicon). (completed 2026-03-05)
- ✅ **Phase 24: README Refresh + Link Hygiene** - README matches Webreel structure and all in-repo links point to `https://tuireel.micr.dev`. (completed 2026-03-05)

## Phase Details

### Phase 20: Brand System Integration

**Goal**: Tuireel has a canonical v1.15 logo + palette system that renders consistently in the README and docs.
**Depends on**: Phase 19 (prior milestone shipped)
**Requirements**: BRND-06, BRND-07
**Success Criteria** (what must be TRUE):

1. README and docs both display the new v1.15 logo (light/dark variants as applicable) with no broken asset references.
2. The v1.15 color palette exists as canonical tokens and is visibly applied consistently (no mixed old/new colors across README/docs).
3. A user can point to a single, documented source-of-truth location in-repo for the v1.15 palette tokens.

**Plans**:

- ✅ `20-01` Brand system source-of-truth + docs wiring normalization
- ✅ `20-02` Automated drift checks for palette + docs wiring

### Phase 21: Social + Icon Assets

**Goal**: All public-facing brand assets (banner/OG/favicon) match the v1.15 logo + palette and are wired where they are consumed.
**Depends on**: Phase 20
**Requirements**: BRND-08, BRND-09
**Success Criteria** (what must be TRUE):

1. The README banner and OG/social card assets exist in-repo and visually match the new v1.15 logo + palette.
2. The Mintlify docs favicon is derived from the v1.15 logo and appears in the browser tab when viewing the docs.
3. The repo surface references only the updated v1.15 banner/OG assets (no stale, older-brand images used for public previews).

**Plans:**

- ✅ `21-01` Regenerate + commit v1.15 brand PNGs; verify all wiring

### Phase 22: Docs Domain Move

**Goal**: Mintlify docs are reachable at `https://tuireel.micr.dev` and canonical links point to that domain.
**Depends on**: Phase 20
**Requirements**: DOCS-17
**Success Criteria** (what must be TRUE):

1. Visiting `https://tuireel.micr.dev` loads the Mintlify docs (home page + at least one content page) without mixed-domain navigation.
2. Viewing page source shows canonical links (and any sitemap/base URL configuration) pointing to `https://tuireel.micr.dev`.

**Plans:**

- ✅ `22-01` Dashboard + DNS + canonical config; verify docs live on custom domain

### Phase 23: Docs Theme Alignment

**Goal**: The docs experience matches the v1.15 brand system (logo, colors, favicon).
**Depends on**: Phase 22
**Requirements**: DOCS-18
**Success Criteria** (what must be TRUE):

1. The docs header/navigation displays the v1.15 logo.
2. The docs UI uses the v1.15 palette for primary/accent styling in a way that is visibly consistent with the README.
3. The docs favicon matches the v1.15 favicon asset.

**Plans:**

- ✅ `23-01` Add theme field, harden drift check, visual verification

### Phase 24: README Refresh + Link Hygiene

**Goal**: The repo front door matches Webreel's README style while keeping Tuireel information accurate and linking to the new docs domain.
**Depends on**: Phase 22
**Requirements**: REPO-06, REPO-07
**Success Criteria** (what must be TRUE):

1. README structure/tone resembles Webreel's README while Tuireel commands, flags, and claims remain accurate.
2. README links users to `https://tuireel.micr.dev` for docs, and a repo-wide link sweep finds no stale docs domains.
3. Docs pages only reference `https://tuireel.micr.dev` as the docs base domain (no mixed old/new docs domains in navigation/content).

**Plans:** 1 plan

Plans:

- ✅ `24-01` — README rewrite to Webreel structure + repo-wide link sweep

## Archived Milestones

<details>
<summary>✅ v1.0 MVP (Phases 1-6) — SHIPPED 2026-03-03</summary>

Archive:

- `.planning/milestones/v1.0-ROADMAP.md`
- `.planning/milestones/v1.0-REQUIREMENTS.md`
- `.planning/MILESTONES.md`

6 phases, 23 plans, 50 tasks completed.

</details>

<details>
<summary>✅ v1.1 Branding, Docs & Hardening (Phases 7-19) — SHIPPED 2026-03-05</summary>

Archive:

- `.planning/milestones/v1.1-ROADMAP.md`
- `.planning/milestones/v1.1-REQUIREMENTS.md`
- `.planning/milestones/v1.1-MILESTONE-AUDIT.md`
- `.planning/MILESTONES.md`

13 phases, 38 plans, 65 tasks completed.

</details>

## Current Status

All milestones complete.

Use `/gsd-new-milestone` to define the next milestone requirements and phases.

## Progress

| Milestone                          | Phases | Plans | Status   | Shipped    |
| ---------------------------------- | ------ | ----- | -------- | ---------- |
| v1.0 MVP                           | 1-6    | 23/23 | Complete | 2026-03-03 |
| v1.1 Branding, Docs & Hardening    | 7-19   | 38/38 | Complete | 2026-03-05 |
| v1.15 Brand Refresh & Docs Hosting | 20-24  | 5/5   | Complete | 2026-03-05 |
