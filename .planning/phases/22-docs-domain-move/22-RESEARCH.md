# Phase 22: Docs Domain Move - Research

**Researched:** 2026-07-14
**Domain:** Mintlify custom domain + DNS configuration
**Confidence:** HIGH

## Summary

Moving Mintlify docs to a custom domain (`tuireel.micr.dev`) is a well-documented, straightforward process involving three steps: (1) adding the domain in the Mintlify dashboard, (2) creating a DNS CNAME record, and (3) adding canonical URL configuration to `docs.json`. Mintlify handles TLS provisioning automatically via Vercel/Let's Encrypt after DNS propagates.

The `docs.json` changes are minimal — a single `seo.metatags.canonical` field. The DNS change is a single CNAME record pointing to `cname.mintlify-dns.com`. The dashboard step is a manual action that cannot be automated via code.

**Primary recommendation:** This is a config + DNS + dashboard phase, not a code phase. The planner should structure tasks around the three sequential dependencies: dashboard → DNS → config commit, with verification after each.

## Standard Stack

### Core

| Tool/Service                  | Purpose                              | Why Standard                                         |
| ----------------------------- | ------------------------------------ | ---------------------------------------------------- |
| Mintlify Dashboard            | Add custom domain to project         | Required — only way to register domain with Mintlify |
| DNS Provider (for `micr.dev`) | Create CNAME record                  | Required for domain resolution                       |
| `docs.json`                   | Set canonical URL via `seo.metatags` | Mintlify's config file for SEO settings              |

### Supporting

| Tool                                 | Purpose                                       | When to Use                      |
| ------------------------------------ | --------------------------------------------- | -------------------------------- |
| [DNSChecker](https://dnschecker.org) | Verify DNS propagation globally               | After creating CNAME record      |
| `curl -I` / browser                  | Verify HTTP→HTTPS redirect and canonical tags | After TLS provisioning completes |

### Alternatives Considered

None — Mintlify has exactly one custom domain workflow. There are no alternative approaches.

## Architecture Patterns

### The Three-Step Custom Domain Flow

**Source:** [Mintlify Official Docs — Custom Domain](https://www.mintlify.com/docs/customize/custom-domain)

The process is strictly sequential:

```
Step 1: Mintlify Dashboard
  └── Add "tuireel.micr.dev" at dashboard.mintlify.com/settings/deployment/custom-domain
  └── Dashboard displays DNS instructions

Step 2: DNS Configuration
  └── Add CNAME record:  tuireel → cname.mintlify-dns.com
  └── Wait for propagation (1-24 hours, sometimes up to 48)

Step 3: docs.json Configuration
  └── Add seo.metatags.canonical field
  └── Commit and push (triggers Mintlify redeploy)
```

### DNS Record Required

**Source:** [Mintlify Official Docs — Custom Domain](https://www.mintlify.com/docs/customize/custom-domain)

```
Type:   CNAME
Name:   tuireel          (the subdomain part of tuireel.micr.dev)
Value:  cname.mintlify-dns.com.
```

Note: The trailing dot on the CNAME target is standard DNS notation. Some providers add it automatically.

### docs.json Changes Required

**Source:** [Mintlify Official Docs — Custom Domain](https://www.mintlify.com/docs/customize/custom-domain) and [Mintlify SEO Docs](https://www.mintlify.com/docs/optimize/seo)

Add the `seo` block to `docs.json`:

```json
{
  "seo": {
    "metatags": {
      "canonical": "https://tuireel.micr.dev"
    }
  }
}
```

This is the **only** code change needed. The canonical metatag:

- Tells search engines `https://tuireel.micr.dev` is the primary URL
- Mintlify auto-generates canonical tags per-page using this base URL
- Prevents duplicate content issues with the default `.mintlify.app` subdomain

### Automatic Behaviors (No Config Needed)

**Source:** [Mintlify SEO Docs](https://www.mintlify.com/docs/optimize/seo)

Mintlify automatically handles:

- **Sitemap generation** — auto-generated at `/sitemap.xml`, uses the custom domain once configured
- **robots.txt** — auto-generated
- **TLS/SSL certificate** — Vercel provisions via Let's Encrypt after DNS propagates
- **Per-page canonical URLs** — auto-built from the base canonical + page path

There is **no** `siteUrl` or `baseUrl` field in docs.json. The canonical metatag is the only URL-related configuration.

### Provider-Specific Notes

**Cloudflare (if `micr.dev` uses Cloudflare DNS):**

- Must set SSL/TLS encryption mode to "Full (strict)"
- Must disable "Always Use HTTPS" in Edge Certificates settings
- Cloudflare's HTTPS redirect can block Let's Encrypt domain validation

**If CAA records exist on `micr.dev`:**

- Must add: `0 issue "letsencrypt.org"` CAA record
- Otherwise TLS provisioning will fail

## Don't Hand-Roll

| Problem                      | Don't Build                            | Use Instead                                       | Why                                                                                             |
| ---------------------------- | -------------------------------------- | ------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| TLS certificates             | Manual cert provisioning               | Mintlify auto-provisions via Vercel/Let's Encrypt | Automatic renewal, zero maintenance                                                             |
| Sitemap with new domain      | Custom sitemap.xml                     | Mintlify auto-generates it                        | Updates automatically on deploy                                                                 |
| Canonical link per page      | Manual canonical tags in each MDX file | Single `seo.metatags.canonical` in docs.json      | Mintlify appends page paths automatically                                                       |
| Domain redirect from old URL | Manual redirect rules                  | Mintlify handles this via canonical               | The `.mintlify.app` URL remains accessible but canonical tells search engines the preferred URL |

**Key insight:** This entire phase is configuration — zero custom code. The Mintlify platform handles all the infrastructure.

## Common Pitfalls

### Pitfall 1: DNS Propagation Timing

**What goes wrong:** Domain shows errors or doesn't resolve immediately after DNS changes.
**Why it happens:** DNS propagation takes 1-24 hours (up to 48 in rare cases).
**How to avoid:** Set expectations that verification may need to wait. Use [DNSChecker.org](https://dnschecker.org) to track propagation globally.
**Warning signs:** NXDOMAIN or timeout errors when accessing the custom domain.

### Pitfall 2: Cloudflare SSL Settings Conflict

**What goes wrong:** TLS certificate fails to provision. Site shows SSL errors.
**Why it happens:** Cloudflare's "Always Use HTTPS" and non-Full-Strict SSL modes interfere with Let's Encrypt's ACME challenge validation.
**How to avoid:** If using Cloudflare, set SSL/TLS to "Full (strict)" and disable "Always Use HTTPS" in Edge Certificates.
**Warning signs:** Certificate provisioning takes longer than 24 hours; HTTP validation errors in Mintlify dashboard.

### Pitfall 3: Forgetting the Canonical Tag

**What goes wrong:** Both `*.mintlify.app` and custom domain get indexed by search engines, splitting SEO equity.
**Why it happens:** The custom domain makes docs accessible at the new URL, but without canonical tags, search engines see two copies.
**How to avoid:** Always add `seo.metatags.canonical` to docs.json when setting up a custom domain.
**Warning signs:** Google Search Console shows both domains indexed. (Note: even with canonical, Google treats it as a hint — see Open Questions.)

### Pitfall 4: Missing Dashboard Step

**What goes wrong:** DNS CNAME is configured but Mintlify doesn't serve the docs on the custom domain.
**Why it happens:** The domain must be registered in the Mintlify dashboard first. DNS alone is not enough.
**How to avoid:** Always start with the dashboard step before DNS configuration.
**Warning signs:** CNAME resolves but returns Vercel 404 or generic error page.

### Pitfall 5: CAA Record Blocking Certificate Issuance

**What goes wrong:** TLS certificate never provisions despite correct DNS setup.
**Why it happens:** Domain has CAA records that don't include `letsencrypt.org`.
**How to avoid:** Check for existing CAA records on `micr.dev`. If present, add `0 issue "letsencrypt.org"`.
**Warning signs:** DNS resolves correctly, HTTP works, but HTTPS fails after 24+ hours.

## Code Examples

### The Complete docs.json Change

```json
{
  "$schema": "https://mintlify.com/docs.json",
  "name": "Tuireel",
  "seo": {
    "metatags": {
      "canonical": "https://tuireel.micr.dev"
    }
  },
  "colors": {
    "primary": "#18AAA7",
    "light": "#18AAA7",
    "dark": "#C1263B"
  }
}
```

Only the `"seo"` block is new. Everything else remains unchanged.

### Verification Commands

```bash
# Check DNS propagation
dig tuireel.micr.dev CNAME +short
# Expected: cname.mintlify-dns.com.

# Check HTTP response and redirects
curl -I https://tuireel.micr.dev
# Expected: 200 OK with valid TLS

# Check canonical tag in HTML
curl -s https://tuireel.micr.dev | grep -i canonical
# Expected: <link rel="canonical" href="https://tuireel.micr.dev/..." />

# Check a content page works (not just homepage)
curl -s https://tuireel.micr.dev/introduction | grep -i canonical
# Expected: canonical pointing to tuireel.micr.dev/introduction

# Check sitemap uses correct domain
curl -s https://tuireel.micr.dev/sitemap.xml | head -20
# Expected: URLs using tuireel.micr.dev
```

### Check for Existing CAA Records

```bash
dig micr.dev CAA +short
# If output is empty — no CAA records, no action needed
# If output exists — ensure "letsencrypt.org" is listed
```

## State of the Art

| Old Approach                  | Current Approach                      | When Changed        | Impact                                         |
| ----------------------------- | ------------------------------------- | ------------------- | ---------------------------------------------- |
| `mint.json` config file       | `docs.json` config file               | 2024 (Mintlify v4+) | File renamed, schema URL updated               |
| No built-in canonical support | `seo.metatags.canonical` in docs.json | Current             | Single config field handles all canonical URLs |

**Note on `.mintlify.app` subdomain indexing:**
Per [GitHub Discussion #2626](https://github.com/orgs/mintlify/discussions/2626) (Jan 2026), the default `.mintlify.app` subdomain remains publicly accessible and crawlable even after a custom domain is configured. Canonical tags help but Google treats them as hints. Mintlify does not yet add `X-Robots-Tag: noindex` headers for the `.mintlify.app` subdomain. This is a known community request but not yet implemented.

## Open Questions

1. **What DNS provider manages `micr.dev`?**
   - What we know: The user owns `micr.dev` and uses subdomains (e.g., for Webreel docs).
   - What's unclear: Whether Cloudflare or another provider manages DNS. This affects whether Cloudflare-specific pitfalls apply.
   - Recommendation: User should confirm DNS provider before starting. If Cloudflare, plan includes the SSL/TLS setting changes.

2. **Mintlify plan tier and dashboard access**
   - What we know: Custom domains are available on Mintlify paid plans.
   - What's unclear: Whether the current Mintlify account/plan supports custom domains.
   - Recommendation: Verify plan supports custom domains before starting. Free plans may not include this feature.

3. **Existing CAA records on `micr.dev`**
   - What we know: CAA records can block Let's Encrypt certificate issuance.
   - What's unclear: Whether `micr.dev` has CAA records configured.
   - Recommendation: Check with `dig micr.dev CAA +short` before starting.

4. **`.mintlify.app` subdomain SEO leakage**
   - What we know: The default `.mintlify.app` URL remains accessible and crawlable after custom domain setup. Canonical tags mitigate but don't fully prevent duplicate indexing.
   - What's unclear: Whether Mintlify will implement `noindex` headers for `.mintlify.app` subdomains (requested in Discussion #2626).
   - Recommendation: Accept this as a known limitation. The canonical tag is the best available mitigation. Optionally submit the `.mintlify.app` URL for removal in Google Search Console after the custom domain is live.

## Sources

### Primary (HIGH confidence)

- [Mintlify Official Docs — Custom Domain](https://www.mintlify.com/docs/customize/custom-domain) — Complete custom domain setup guide, DNS records, TLS provisioning, provider-specific notes
- [Mintlify Official Docs — SEO](https://www.mintlify.com/docs/optimize/seo) — Canonical URL configuration, metatags, sitemap generation

### Secondary (MEDIUM confidence)

- [GitHub Discussion #2626](https://github.com/orgs/mintlify/discussions/2626) — Community discussion about `.mintlify.app` subdomain indexing with custom domains (Jan 2026)
- [DeepWiki — Mintlify Themes Configuration Reference](<https://deepwiki.com/mintlify/themes/4-configuration-reference-(docs.json)>) — docs.json schema overview and field categories

### Tertiary (LOW confidence)

- None. All findings verified against primary Mintlify documentation.

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH — Official Mintlify docs are clear and detailed
- Architecture: HIGH — Single documented workflow, no ambiguity
- Pitfalls: HIGH — Mintlify docs explicitly document Cloudflare/CAA issues; community discussion confirms canonical limitation

**Research date:** 2026-07-14
**Valid until:** 2026-08-14 (stable — custom domain workflow rarely changes)
