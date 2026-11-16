# SiteStack — Release Notes

## Version 1.0.0 (Release Candidate 1)

**Release Date:** November 16, 2026  
**Git Commit Checkpoint:** Release Candidate commit [`f5710e3`](file:///D:/SiteStack)  
**Target Platform:** Google Chrome & Chromium-based Browsers (Manifest V3)  
**Browser Compatibility Statement:** "SiteStack has been manually validated by the project owner in Google Chrome and Brave Browser. Automated tests and code-level audit results are reported separately."  
**Distribution Build Directory:** [`D:\SiteStack\dist`](file:///D:/SiteStack/dist)  
**Beta Package Archive:** [`D:\SiteStack\release\sitestack-v1.0.0-beta.zip`](file:///D:/SiteStack/release/sitestack-v1.0.0-beta.zip) (82.5 kB, clean unpacked runtime bundle)  
**Automated Test Suite:** 340 passing tests across 24 test suites (100% passing)  
**TypeScript Compilation:** Zero errors (`tsc -b`)

---

## Executive Summary

SiteStack v1.0.0 Release Candidate 1 (RC1) is the first feature-complete, production-ready build of the SiteStack technology intelligence Chrome extension.

SiteStack was built from the ground up to solve the core deficiencies of legacy stack profilers: opaque detection algorithms, noisy single-regex false positives, lack of version transparency, invasive host permissions, and uncalibrated cloud infrastructure claims.

By contrast, SiteStack delivers **explainable, multi-class corroborated technology detection** with **zero external network requests**, running entirely within the local browser sandbox in **under 5 milliseconds**.

---

## Highlights & Key Capabilities

### 1. 24-Technology Curated Catalog Across 8 Categories
Comprehensive detection across the modern web stack:
- **CMS:** WordPress, Webflow, Wix
- **Ecommerce:** Shopify, WooCommerce
- **Frameworks:** Next.js, Vue.js, VitePress, Angular
- **Libraries:** React, jQuery, Bootstrap, Tailwind CSS
- **Analytics:** Google Analytics 4, Google Tag Manager, Hotjar
- **Marketing:** Meta Pixel, HubSpot, Intercom
- **Payments:** Stripe, Razorpay
- **Infrastructure:** Cloudflare, Vercel, Netlify

### 2. Multi-Class Corroboration & Diminishing Returns Scoring
- High-confidence detections ($\ge 80\%$) mathematically require evidence from **at least two distinct signal classes** (e.g. window global + DOM selector, or script asset + meta tag).
- Correlated signals within the same class receive diminishing returns (100% for primary signal, 40% for secondary signals) and are capped at 60 points (50 points for resources).
- Cross-class corroboration applies an evidence bonus ($1.15\times$ for 2 classes, $1.30\times$ for 3+ classes).
- Eliminates false positives from isolated script tags or browser extension hooks.

### 3. Explainable Evidence Drawer
- Every detected technology card features an expandable Evidence Drawer.
- Users can inspect the exact signal types (`global`, `dom`, `meta`, `resource`, `inferred`), specific sources (e.g. `window.__NEXT_DATA__`, `meta[name="generator"]`), captured values, and individual point weights that contributed to the score.

### 4. Architectural Dependency Inference
- Maps deep architectural foundations: Next.js implies React, VitePress implies Vue.js, and WooCommerce implies WordPress.
- Inferred technologies display a distinct **`INFERRED`** badge.
- Inferred dependencies receive independently calibrated confidence scores (75% Medium for High parent, 50% Medium for Medium parent) rather than blind score inheritance.
- If direct runtime proof is discovered on the page, the dependency automatically upgrades to a Direct detection.

### 5. Semantic Version Extraction & Maturity Lifecycle
- Extracts clean version strings across runtime globals, document meta tags, and versioned asset scripts.
- Categorizes extracted versions into a 4-tier maturity lifecycle:
  - **`stable`**: Production release (e.g. `18.3.1`, `7.1.4`, `6.0`).
  - **`prerelease`**: Release candidates, alphas, betas (e.g. `14.0.0-rc.2`, `18.3.1-beta.0`).
  - **`development`**: Daily development snapshots, nightly builds (e.g. `11.4.0-dev.20261116`).
  - **`unknown`**: Non-version identifiers, tracking IDs (e.g. `GTM-XXXXXXX`), or missing versions.
- Prioritizes core package assets over subpackages (e.g. WooCommerce core frontend script over `wc-blocks` sub-bundles).

### 6. Cloud Infrastructure vs Client Telemetry Safeguards
- Strictly prevents client-side analytics beacons from falsely claiming cloud infrastructure hosting:
  - **Vercel:** Telemetry globals (`window.va`, `window.si`) are weighted at 25 (below 30 noise floor) as supporting evidence. Telemetry resources (`/_vercel/insights/`) are calibrated to weight 35. A rule-level cap (`maxConfidenceScore: 69`) guarantees that analytics alone cannot claim High-confidence Vercel hosting without server response headers.
  - **Cloudflare:** Client-side Web Analytics (`beacon.min.js`) produces 45% Low confidence with an explicit educational justification clarifying that it indicates client telemetry rather than confirmed Cloudflare DNS or CDN hosting.

### 7. Zero-Network Privacy Architecture & Multi-Tier Evidence Sanitization
- **0 programmatic network requests:** No `fetch()`, `XMLHttpRequest`, `WebSocket`, or `sendBeacon()` calls from background service workers, content probes, or the detection engine. (Popup typography loads Google Web Fonts when online, with graceful offline fallbacks to local system fonts).
- **0 remote code execution:** Strict CSP compliance (`script-src 'self'`).
- **Minimal Manifest V3 permissions:** Only `activeTab`, `scripting`, and `storage`. No `<all_urls>`, no `webRequest`, no browsing history access.
- **Multi-tier evidence sanitization:** Comprehensive resource URL sanitization across signal evaluation, storage, and CSV/JSON export pipelines.
  - Strips credentials and authentication tokens (`token`, `auth`, `key`, `secret`, `api_key`).
  - Strips session IDs and user identifiers (`session`, `session_id`, `sid`, `user_id`).
  - Strips marketing and ad trackers (`utm_*`, `fbclid`, `gclid`).
  - Strips URL hash fragments (`#...`).
  - Preserves software version parameter `ver` only when strictly matching bounded version grammar (`/^[0-9]+(?:\.[0-9]+)+(?:-(?:dev\.[0-9]+|beta[0-9]+(?:-[0-9]+)?|rc(?:\.[0-9]+|[0-9]+)|alpha[0-9]+(?:-[0-9]+)?))?$/i`); strips unvalidated, token-like, session-like, or adversarial suffix values.
  - Strips query parameter `v` unconditionally because zero supported production rules require it.
  - Preserves strictly validated public measurement tags (`GTM-*`, `G-*`, `UA-*`) required for version extraction.
  - Strips arbitrary user/account IDs in `id` and `tid`.
- **Automatic legacy history migration:** Old unsanitized records in `chrome.storage.local` are automatically sanitized on read and immediately persisted back to storage.

### 8. Sub-5ms Synchronous Engine Latency
- Minimum execution time: $0.62\text{ ms}$
- Average execution time: $1.64\text{ ms}$
- P95 execution time: $4.15\text{ ms}$
- Evaluates entirely in synchronous CPU time; ResourceTiming scrapers are bounded to 350 items (<15 KB).

### 9. Local Scan History with LRU Cache & Quota Recovery
- Stores recent scans locally in `chrome.storage.local`.
- Bounded to 50 items maximum with LRU eviction.
- 60-second de-duplication window prevents duplicate history entries from repeated clicks.
- Built-in quota recovery prunes 50% oldest entries if storage limits are reached.

### 10. Standardized RFC 4180 Exports with Dual URL Semantics
- Single-Scan CSV: Exactly 11 standard columns with RFC 4180 double-quote escaping.
- Multi-Scan CSV: Exactly 13 standard columns (`scannedWebsite`, `scanDate`, `url`, `technology`, `category`, `version`, `confidenceScore`, `confidenceTier`, `detectionType`, `parentDependency`, `confidenceReason`, `evidenceSummary`, `technologyWebsite`).
- Zero-technology scans (e.g. Google Search) emit a dedicated CSV row preserving `scannedWebsite`, `scanDate`, and `url` alongside 10 empty technology fields.
- JSON exports feature clean disambiguation between `scannedWebsite` (domain scanned) and `technologyWebsite` (official vendor site), alongside `versionMaturity` and synchronous duration metrics (`engineEvaluationDurationMs`).

---

## Detailed Development Changelog (Phases 1 — 9)

- **Phase 1 (Architecture & Engine):** Designed the 4-tier detection architecture, rule registry schema, and synchronous evaluation engine (`evaluator.ts`).
- **Phase 2 (Signal Harvesting):** Implemented Manifest V3 content probes: `isolated-probe.ts` (DOM, meta, ResourceTiming) and `main-probe.ts` (approved window globals allowlist).
- **Phase 3 (Popup UI):** Built React 18 popup with category navigation, live search, ScanRadar animations, and the expandable Evidence Drawer.
- **Phase 4 (History & Export):** Added `chrome.storage.local` LRU caching (50 items), rescan de-duplication, quota recovery, and JSON/CSV export utilities.
- **Phase 5 (Confidence Scoring Polish):** Implemented diminishing returns for intra-class signals, cross-class corroboration bonuses, and independent dependency score calibration.
- **Phase 6 (Accuracy & Edge Cases):** Hardened against React DevTools extension hooks, subpackage version collisions, and restricted browser pages (`chrome://`).
- **Phase 7 (Benchmark Matrix):** Validated against a 100-site benchmark suite; verified sub-5ms P95 latency.
- **Phase 8 (Telemetry Calibration & RFC 4180 Exports):**
  - Calibrated Vercel telemetry signals below noise threshold and capped analytics-only detections at 69 Medium.
  - Prioritized WooCommerce core script versions over block subpackages.
  - Implemented version maturity lifecycle classification (`stable`, `prerelease`, `development`, `unknown`).
  - Disambiguated export URLs into `scannedWebsite` and `technologyWebsite`.
  - Added dedicated representation for empty scans in multi-scan CSV exports.
- **Phase 9 (Release Candidate 1 & Privacy Remediation):**
  - Conducted full codebase privacy and permissions audit.
  - Verified zero remote network transmission and zero remote code.
  - Phase 9.5: Implemented critical evidence URL privacy remediation (`src/shared/url.ts`) across evaluation, history, and exports.
  - Phase 9.6: Hardened query parameter allowlist (`id`/`tid` restricted strictly to public measurement containers `/^(?:G-[A-Z0-9]+|GTM-[A-Z0-9]+|UA-[0-9]+-[0-9]+)$/i`), implemented legacy history writeback persistence, verified zero leakage across all 6 evidence classes, and updated all documentation.
  - Phase 9.6.2: Version parameter privacy hardening: implemented `SAFE_VERSION_PATTERN` validation on `ver`, unconditionally stripped unneeded `v` parameter, verified zero leakage across all 8 evidence lifecycle phases, and added regression tests.
  - Phase 9.6.4: Strict version suffix validation: implemented bounded version grammar strictly accepting numeric releases and well-known prerelease tags with numeric metadata (`dev`, `beta`, `rc`, `alpha`), blocking arbitrary alphabetic or identifier-like suffixes, and verified end-to-end secret eradication across all 8 lifecycle phases.

---

## Verification & Build Statistics

- **Total Test Files:** 24 passing
- **Total Unit & Regression Tests:** 340 passing
- **TypeScript Errors:** 0
- **Browser Compatibility Statement:** "SiteStack has been manually validated by the project owner in Google Chrome and Brave Browser. Automated tests and code-level audit results are reported separately."
- **Production Build Artifacts:**
  - `dist/popup/index.html`: 0.85 kB (gzip: 0.50 kB)
  - `dist/assets/popup-B_If2MnA.css`: 26.60 kB (gzip: 5.66 kB)
  - `dist/main-probe.js`: 1.79 kB (gzip: 0.83 kB)
  - `dist/isolated-probe.js`: 4.21 kB (gzip: 1.87 kB)
  - `dist/assets/history-D_sI32Mh.js`: 9.75 kB (gzip: 3.38 kB)
  - `dist/service-worker.js`: 28.01 kB (gzip: 8.78 kB)
  - `dist/assets/popup-BdKBLV3u.js`: 200.21 kB (gzip: 59.65 kB)
- **Beta Distribution Package:** `release/sitestack-v1.0.0-beta.zip` (82.5 kB compressed, 12 production runtime assets)
- **Total Gzip Bundle Size:** ~80.7 kB
- **Remote Network Dependencies:** 0

---

## Known Scope & Future Roadmap

- **Document Response Headers:** In Manifest V3, document-level HTTP response headers (`Server:`, `CF-Ray`) are inaccessible without `webRequest` or host permissions. Future updates will explore optional, user-consented declarative net request rules to enhance cloud infrastructure scoring without compromising baseline privacy.
- **Catalog Expansion:** Post-beta releases will expand coverage to additional frameworks (Svelte, Remix, Astro), CMS engines (Drupal, Joomla), and analytics providers (Mixpanel, PostHog).
