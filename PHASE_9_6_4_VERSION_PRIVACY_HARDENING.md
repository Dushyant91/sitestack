# SiteStack Phase 9.6.4 — Strict Version Suffix Validation Report

**Implementation Date:** November 16, 2026  
**Baseline Commit:** [`b5a7d14`](file:///D:/SiteStack)  
**Target Commit Title:** `fix(privacy): restrict version suffix validation`  
**Previous Audit Status:** Phase 9.6.3 — `RELEASE BLOCKED`  
**Current Phase Status:** `PASS`

---

## Executive Summary

Phase 9.6.3 identified a critical privacy vulnerability in `SAFE_VERSION_PATTERN`: while bare tokens and non-numeric strings were stripped, the open hyphenated suffix `(?:-[0-9A-Za-z.-]+)?` allowed arbitrary identifiers, session tokens, or user secrets to pass validation when prefixed by a numeric SemVer string (e.g. `?ver=1.2-session123`, `?ver=1.2-tokenABC`, `?ver=1.2-privateidentifier`, `?ver=1.2-user-secret`). Furthermore, attempting to use an unrestricted tag pattern like `-(?:dev|alpha|beta|rc|preview|build)[0-9A-Za-z.-]*` was explicitly rejected because it still admitted arbitrary words after the tag (e.g. `1.2-dev-session123`, `1.2-beta-user-secret`).

In Phase 9.6.4, SiteStack implemented a strictly bounded version grammar in [`src/shared/url.ts`](file:///D:/SiteStack/src/shared/url.ts) that:
1. Accepts standard numeric releases (`X.Y.Z`).
2. Restricts prerelease tags strictly to recognized software lifecycle markers (`dev`, `beta`, `rc`, `alpha`).
3. Enforces strictly numeric, bounded metadata after each tag, eliminating all unrestricted character classes (`[A-Za-z]`, `\w`, `.*`).
4. Rejects all adversarial text suffixes, session identifiers, and tokens.
5. Preserves all legitimate software versions across existing fixtures and benchmarks (including `6.4.2`, `11.4.0-dev.20261116`, `7.2-beta5-65440`, and `6.5-RC1`).
6. Continues stripping query parameter `v` unconditionally.
7. Passes 312 tests across 21 test files with zero TypeScript errors and a clean production build.

---

## 1. Exact Accepted Version Grammar

In [`src/shared/url.ts`](file:///D:/SiteStack/src/shared/url.ts):

```typescript
export const SAFE_VERSION_PATTERN =
  /^[0-9]+(?:\.[0-9]+)+(?:-(?:dev\.[0-9]+|beta[0-9]+(?:-[0-9]+)?|rc(?:\.[0-9]+|[0-9]+)|alpha[0-9]+(?:-[0-9]+)?))?$/i;
```

### Grammatical Breakdown

| Grammar Segment | Pattern | Description & Allowed Values | Bounded Constraint |
| :--- | :--- | :--- | :--- |
| **Numeric Base** | `^[0-9]+(?:\.[0-9]+)+` | Major.minor (and optional patch/build) release numbers, e.g. `6.4.2`, `7.1.4`, `18.3.1`, `2.0`, `1.0`. | Requires at least two dot-separated numeric blocks. No alphabetic characters permitted. |
| **Prerelease Suffix** | `(?:-(...))?$` | Optional prerelease segment preceded by a hyphen. Must terminate at the end of the string (`$`). | Only four explicit tag branches are permitted below. |
| **Branch 1: `dev`** | `dev\.[0-9]+` | Development snapshots with numeric timestamps or dates, e.g. `11.4.0-dev.20261116`. | Must be followed by a literal dot and digits only. Rejects `dev-session123`, `dev.SECRET`, etc. |
| **Branch 2: `beta`** | `beta[0-9]+(?:-[0-9]+)?` | Beta releases with build numbers, e.g. `7.2-beta5-65440`, `6.5-beta1`. | Must be followed by digits, optionally followed by a single hyphen and digits. Rejects `beta-user-secret`, `beta5-privateidentifier`. |
| **Branch 3: `rc`** | `rc(?:\.[0-9]+|[0-9]+)` | Release candidates with numeric identifiers, e.g. `6.5-RC1`, `18.3.0-rc.1`. | Must be followed by digits or dot-digits. Case-insensitive (`/i`). Rejects `rc-tokenABC`. |
| **Branch 4: `alpha`** | `alpha[0-9]+(?:-[0-9]+)?` | Alpha builds with revision numbers, e.g. `6.5-alpha1`, `7.0-alpha2-12345`. | Must be followed by digits, optionally followed by a single hyphen and digits. Rejects `alpha-user-token`. |

**Core Security Guarantee:** No branch permits unrestricted alphabetic characters (`[A-Za-z]`, `\w`, `.*`). Every character position following a tag keyword is bounded to numeric sequences and single structural separators (`.` or `-`).

---

## 2. Test Vectors Matrix (Preserved vs. Rejected)

Every vector specified in Phase 9.6.4 was tested across both `isSensitiveQueryParam('ver', val)` and `sanitizeResourceUrl(...)`:

| # | Test Vector | Matches Grammar? | Action Taken | Rationale |
| :-: | :--- | :---: | :---: | :--- |
| 1 | `?ver=6.4.2` | **PASS (`true`)** | **PRESERVED** | Standard numeric release version (WordPress core). |
| 2 | `?ver=11.4.0-dev.20261116` | **PASS (`true`)** | **PRESERVED** | Real-world WooCommerce dev snapshot (`dev.` + numeric timestamp). |
| 3 | `?ver=7.2-beta5-65440` | **PASS (`true`)** | **PRESERVED** | Real-world WordPress prerelease build (`beta` + digits + `-` + digits). |
| 4 | `?ver=6.5-RC1` | **PASS (`true`)** | **PRESERVED** | Standard release candidate (`RC` + digits). |
| 5 | `?ver=user_session_SECRET123` | **FAIL (`false`)** | **STRIPPED** | Arbitrary session string without numeric base. |
| 6 | `?ver=token_ABC123` | **FAIL (`false`)** | **STRIPPED** | Arbitrary authentication token. |
| 7 | `?ver=1.2-session123` | **FAIL (`false`)** | **STRIPPED** | Arbitrary session identifier after numeric base. |
| 8 | `?ver=1.2-tokenABC` | **FAIL (`false`)** | **STRIPPED** | Arbitrary token string after numeric base. |
| 9 | `?ver=1.2-privateidentifier` | **FAIL (`false`)** | **STRIPPED** | Arbitrary tracking identifier. |
| 10 | `?ver=1.2-user-secret` | **FAIL (`false`)** | **STRIPPED** | Arbitrary secret identifier. |
| 11 | `?ver=1.2-dev-session123` | **FAIL (`false`)** | **STRIPPED** | Disallowed hyphen separator and arbitrary string after `dev`. |
| 12 | `?ver=1.2-beta-user-secret` | **FAIL (`false`)** | **STRIPPED** | Arbitrary text string following `beta`. |
| 13 | `?ver=1.2-rc-tokenABC` | **FAIL (`false`)** | **STRIPPED** | Arbitrary token following `rc`. |
| 14 | `?ver=1.2-build-privateidentifier` | **FAIL (`false`)** | **STRIPPED** | Unrecognized tag `build` and arbitrary identifier. |
| 15 | `?ver=1.2-dev.SECRET123` | **FAIL (`false`)** | **STRIPPED** | Alphabetic string `SECRET123` following `dev.`. |
| 16 | `?ver=1.2-beta5-privateidentifier` | **FAIL (`false`)** | **STRIPPED** | Arbitrary identifier appended to valid beta build. |
| 17 | `?ver=` | **FAIL (`false`)** | **STRIPPED** | Empty parameter value. |

---

## 3. Existing Fixture & Benchmark Compatibility

All 24 production technology rules and existing test fixtures were verified against the bounded grammar:

- **WordPress Core:** `wp-emoji-release.min.js?ver=6.4.2` and `?ver=6.3.1` $\implies$ Preserved.
- **WordPress Prerelease Fixture ([`tests/fixtures/wordpress-prerelease.html`](file:///D:/SiteStack/tests/fixtures/wordpress-prerelease.html)):** `wp-emoji-release.min.js?ver=7.2-beta5-65440` $\implies$ Preserved; version extraction succeeds with 100% fidelity.
- **WooCommerce Production Assets:** `woocommerce.min.js?ver=7.1.4` and `?ver=11.4.0-dev.20261116` $\implies$ Preserved; versions extracted cleanly.
- **WooCommerce Admin & Plugins:** `wc-blocks.js?ver=8.7.0` and `index.js?ver=3.3.0` $\implies$ Preserved.
- **Gutenberg Plugin:** `style.min.css?ver=24.4.0` $\implies$ Preserved.
- **Sample Themes & Plugins:** `style.css?ver=1.0` and `style.css?ver=3.1.2` $\implies$ Preserved.
- **JavaScript Libraries:** `react.min.js?ver=18.3.1` and `jquery.min.js?ver=3.7.1` $\implies$ Preserved.
- **Google Analytics / Google Tag Manager:** Public measurement IDs (`G-XXXXXXXXXX`, `GTM-XXXXXXX`, `UA-XXXXX-Y`) in `id`/`tid` are preserved; arbitrary IDs are stripped.

Zero legitimate software versions in SiteStack's test fixtures or benchmark suites are rejected.

---

## 4. End-to-End Privacy Verification Across All 8 Lifecycle Phases

Synthetic secret eradication was validated in Test 5.3 ([`tests/engine/phase9-5-evidence-privacy.test.ts`](file:///D:/SiteStack/tests/engine/phase9-5-evidence-privacy.test.ts#L795-L905)) against all adversarial tokens:
`session123`, `tokenABC`, `privateidentifier`, `user-secret`, `dev-session123`, `beta-user-secret`, `rc-tokenABC`, `build-privateidentifier`, `SECRET123`, `beta5-privateidentifier`.

| # | Lifecycle Stage | Component Audited | Verification Result |
| :-: | :--- | :--- | :--- |
| 1 | **Sanitized Resource URLs** | `sanitizeResourceUrl(...)` | **100% Clean.** All adversarial query strings stripped. Preserved versions intact. |
| 2 | **Evidence Source** | `evidence.source` | **100% Clean.** Truncated evidence strings contain zero secret tokens. |
| 3 | **Evidence Matched Value** | `evidence.matchedValue` | **100% Clean.** Full matched URLs contain zero secret tokens. |
| 4 | **In-Memory Scan Result** | `JSON.stringify(evaluateSignals(...))` | **100% Clean.** In-memory object graph contains zero secret tokens. |
| 5 | **Chrome Local Storage** | `sanitizeScanResult(...)` | **100% Clean.** Storage serialization contains zero secret tokens. |
| 6 | **Single-Scan JSON Export** | `formatExportJson(...)` | **100% Clean.** Single scan export JSON payload contains zero secret tokens. |
| 7 | **Single-Scan CSV Export** | `formatExportCsv(...)` | **100% Clean.** Single scan CSV output contains zero secret tokens. |
| 8 | **Multi-Scan CSV Export** | `formatMultiScanExportCsv(...)` | **100% Clean.** Multi-scan CSV output contains zero secret tokens. |

Simultaneously, legitimate version strings (`ver=7.2-beta5-65440`, `ver=11.4.0-dev.20261116`, `ver=6.4.2`, `ver=6.5-RC1`) were confirmed present and uncorrupted across all 8 phases.

---

## 5. Verification & Build Results

### Automated Test Suite (`npx vitest run`)
- **Total Test Files:** 21 passed (21 total)
- **Total Tests:** 312 passed (312 total, 0 failed, 0 skipped)
- **Execution Time:** ~15.7s

### TypeScript Type Check (`npx tsc -b`)
- **Exit Code:** 0
- **TypeScript Errors:** 0

### Vite Production Build (`npm run build`)
- **Bundle Output:**
  - `dist/popup/index.html`: 0.85 kB (gzip: 0.49 kB)
  - `dist/assets/popup-BL95HZOP.css`: 25.51 kB (gzip: 5.52 kB)
  - `dist/main-probe.js`: 1.79 kB (gzip: 0.83 kB)
  - `dist/isolated-probe.js`: 3.35 kB (gzip: 1.59 kB)
  - `dist/assets/history-CGHB5dSF.js`: 7.38 kB (gzip: 2.73 kB)
  - `dist/service-worker.js`: 26.07 kB (gzip: 8.23 kB)
  - `dist/assets/popup-d0ras7oy.js`: 195.39 kB (gzip: 58.51 kB)
- **Total Gzip Bundle Size:** ~77.8 kB
- **Remote Network Dependencies:** 0

---

## 6. Exact Files Modified

1. [`src/shared/url.ts`](file:///D:/SiteStack/src/shared/url.ts): Updated `SAFE_VERSION_PATTERN` to the bounded version grammar.
2. [`tests/engine/phase9-5-evidence-privacy.test.ts`](file:///D:/SiteStack/tests/engine/phase9-5-evidence-privacy.test.ts): Added adversarial test suite (Test 1.8) and end-to-end 8-stage verification test (Test 5.3).
3. [`PRIVACY_POLICY.md`](file:///D:/SiteStack/PRIVACY_POLICY.md): Updated version parameter documentation to reflect the bounded grammar.
4. [`README.md`](file:///D:/SiteStack/README.md): Updated privacy model section to describe bounded grammar validation.
5. [`BETA_TESTING_GUIDE.md`](file:///D:/SiteStack/BETA_TESTING_GUIDE.md): Updated query parameter validation notes.
6. [`RELEASE_NOTES.md`](file:///D:/SiteStack/RELEASE_NOTES.md): Documented Phase 9.6.4 release notes and updated test count to 312.

---

## 7. Limitations of the Validation Approach

While the bounded grammar successfully eliminates all known adversarial string vectors and prevents arbitrary identifiers from leaking through version parameters, rigorous transparency requires acknowledging the inherent limitations of pattern-based URL sanitization:

1. **Purely Numeric Suffixes:** If an application or backend intentionally constructs a tracking identifier or user token formatted entirely as numeric digits matching the grammar (for example, `?ver=1.0-dev.9876543210123`), the validator cannot distinguish between a legitimate timestamp/build number and a numeric user ID.
2. **Grammar Expansion Constraints:** Future technologies or non-standard software distributions that adopt novel prerelease keywords (e.g. `nightly`, `preview`, `insiders`, `canary`) will have their `ver` parameters stripped unless explicitly added to the bounded grammar. This is a deliberate, security-first trade-off prioritizing privacy over unvetted permissiveness.
3. **Defense-in-Depth Context:** URL sanitization is only one layer of SiteStack's privacy architecture. Even if a hypothetical numeric token were retained in `ver`, SiteStack executes zero network requests, transmits zero data remotely, and stores data exclusively in the user's sandboxed local browser storage.

---

## Final Verdict

# `PASS`

**Conclusion:**  
The bounded version grammar strictly accepts legitimate numeric release versions and supported prerelease builds with numeric metadata while definitively rejecting all arbitrary alphabetic, token, session, and adversarial text suffixes. All 312 unit and regression tests pass, TypeScript compilation succeeds with zero errors, and production builds compile cleanly. The release candidate is privacy-hardened and ready for beta release.
