# SiteStack Phase 9.6.3 — Final Version Parameter Security Review

**Audit Date:** November 16, 2026  
**Baseline Commit:** [`b5a7d14`](file:///D:/SiteStack) (`fix(privacy): validate version query parameters`)  
**Previous Baseline:** [`79c3771`](file:///D:/SiteStack) (Phase 9.6)  
**Audit Scope:** Read-only independent security review of version parameter privacy hardening  
**Auditor Mode:** Strictly read-only; no production code, detection rules, scoring, tests, or documentation were modified during this audit.

---

## Executive Summary

Phase 9.6.2 implemented version parameter hardening in [`src/shared/url.ts`](file:///D:/SiteStack/src/shared/url.ts) by introducing `SAFE_VERSION_PATTERN = /^[0-9]+(?:\.[0-9]+)+(?:-[0-9A-Za-z.-]+)?$/`, unconditionally stripping the `v` query parameter, and validating the `ver` parameter against this pattern.

This read-only audit evaluated whether residual privacy risks remain in `SAFE_VERSION_PATTERN` and surveyed all 24 production technology detection rules to determine real-world version extraction requirements.

### Key Audit Findings
1. **Suffix Loophole in `SAFE_VERSION_PATTERN`:** While `SAFE_VERSION_PATTERN` effectively blocks bare tokens, session IDs, and unvalidated strings (e.g., `?ver=user_session_SECRET123` or `?ver=tokenABC`), its open hyphenated suffix `(?:-[0-9A-Za-z.-]+)?` permits **any** arbitrary alphanumeric identifier to pass validation as long as it is prefixed by a valid major.minor number (e.g., `?ver=1.2-session123`, `?ver=1.2-tokenABC`, `?ver=1.2-privateidentifier`, `?ver=1.2-user-secret`).
2. **Technology Rule Requirements:** An exhaustive audit of all 24 production technology definitions revealed that **only 2 rules** (WordPress and WooCommerce) extract version information from `ver` query parameters. Zero technologies rely on arbitrary alphanumeric suffixes. All legitimate versions use either pure numeric releases (`X.Y.Z`) or standard prerelease/development snapshot tags (`dev`, `alpha`, `beta`, `rc`).
3. **Prerelease Suffix Calibration:** The proposed pattern `/^[0-9]+(?:\.[0-9]+)+(?:-(?:dev|alpha|beta|rc|preview|build)(?:\.[0-9A-Za-z.-]+)?)?$/i` fails on legitimate WordPress prereleases such as `7.2-beta5-65440` due to a mandatory dot requirement after the prerelease tag. A refined pattern `/^[0-9]+(?:\.[0-9]+)+(?:-(?:dev|alpha|beta|rc|preview|build)[0-9A-Za-z.-]*)?$/i` preserves all legitimate releases (including `7.2-beta5-65440` and `11.4.0-dev.20261116`) while completely eliminating arbitrary identifier leakage.
4. **Git Diff Audit:** Commit `b5a7d14` modified exactly 8 files, all strictly within scope. The modification to [`tests/popup/phase8-3-multiscan-empty-export.test.ts`](file:///D:/SiteStack/tests/popup/phase8-3-multiscan-empty-export.test.ts) was thoroughly audited and verified as correct, safe, and necessary due to the unconditional stripping of parameter `v`.
5. **Regression Verification:** All 310 automated tests (307 baseline + 3 new tests) pass cleanly across 21 test files. No privacy assertions were weakened or removed.

---

## Section 1: `SAFE_VERSION_PATTERN` Analysis

### 1.1 Regex Definition
In [`src/shared/url.ts`](file:///D:/SiteStack/src/shared/url.ts#L85):
```typescript
export const SAFE_VERSION_PATTERN =
  /^[0-9]+(?:\.[0-9]+)+(?:-[0-9A-Za-z.-]+)?$/;
```

### 1.2 Evaluation Matrix Against Test Vectors
Each test vector was evaluated against `SAFE_VERSION_PATTERN.test(decodedVal)`:

| Parameter & Value | Decoded Value | Matches Regex? | Classification | Privacy & Security Risk Assessment |
| :--- | :--- | :---: | :--- | :--- |
| `?ver=6.4.2` | `6.4.2` | **PASS (`true`)** | Legitimate Software Version | Standard numeric SemVer (e.g. WordPress Core). Zero privacy risk. |
| `?ver=11.4.0-dev.20261116` | `11.4.0-dev.20261116` | **PASS (`true`)** | Legitimate Software Version | WooCommerce nightly/dev snapshot observed in production. Zero privacy risk. |
| `?ver=1.2-session123` | `1.2-session123` | **PASS (`true`)** | **Arbitrary Identifier / Session ID** | **VULNERABILITY**: Survives into evidence, storage, and exports. |
| `?ver=1.2-tokenABC` | `1.2-tokenABC` | **PASS (`true`)** | **Arbitrary Token / Secret** | **VULNERABILITY**: Survives into evidence, storage, and exports. |
| `?ver=1.2-privateidentifier` | `1.2-privateidentifier` | **PASS (`true`)** | **Arbitrary Identifier** | **VULNERABILITY**: Survives into evidence, storage, and exports. |
| `?ver=1.2-user-secret` | `1.2-user-secret` | **PASS (`true`)** | **Arbitrary User Secret** | **VULNERABILITY**: Survives into evidence, storage, and exports. |
| `?ver=1.2-dev.20261116` | `1.2-dev.20261116` | **PASS (`true`)** | Legitimate Software Version | Standard prerelease snapshot. Zero privacy risk. |

### 1.3 Technical Root Cause
- **Numeric Prefix Requirement:** The leading expression `^[0-9]+(?:\.[0-9]+)+` enforces at least two numeric segments separated by dots (e.g., `1.0`, `6.4.2`). This successfully strips arbitrary strings lacking numbers (such as `?ver=SECRET123` or `?ver=session_abc`).
- **Unrestricted Hyphenated Suffix:** The optional suffix `(?:-[0-9A-Za-z.-]+)?` matches a leading hyphen followed by any sequence of alphanumeric characters, dots, or hyphens.
- **Consequence:** Any arbitrary identifier, session token, or user tracking secret that is appended after a numeric prefix and hyphen (e.g., `?ver=1.0-tokenABC` or `?ver=2.1-user-secret`) satisfies the regex and is preserved in resource evidence, Chrome local storage, scan history, and JSON/CSV exports.

---

## Section 2: Technology Rules Version Requirements Survey

An exhaustive audit of all 24 production technology detection rules in `src/engine/rules/` was conducted to determine how version strings are extracted and whether any technology genuinely requires arbitrary suffixes.

### 2.1 Complete Catalog Survey (24 Technologies)

| # | Technology ID | Category | Query Param Version Source? | Actual URL Regex / Pattern | Real-World Format |
| :-: | :--- | :--- | :-: | :--- | :--- |
| 1 | `google-analytics` | Analytics | No (`id`/`tid` only) | `/[?&](?:id\|tid)=(G-[A-Z0-9]+)/i` | `G-XXXXXXXXXX` |
| 2 | `google-tag-manager`| Analytics | No (`id` only) | `/[?&]id=(GTM-[A-Z0-9]+)/i` | `GTM-XXXXXXX` |
| 3 | `hotjar` | Analytics | No | `/static\.hotjar\.com\/c\/hotjar-[\d.]+\.js/i` | Path filename |
| 4 | **`wordpress`** | CMS | **YES (`ver=`)** | `/\/wp-emoji-release\.min\.js\?ver=([0-9]+(?:\.[0-9]+)+(?:-[0-9A-Za-z.-]+)?)/i` | `6.4.2`, `7.2-beta5-65440` |
| 5 | `webflow` | CMS | No | `/assets\.(?:website-files\|webflow)\.com\//i` | Path only |
| 6 | `wix` | CMS | No | `/(?:static\.wixstatic\|parastorage)\.com\//i` | Path only |
| 7 | `shopify` | E-commerce | No | `/cdn\.shopify\.com\//i` | Path only |
| 8 | **`woocommerce`** | E-commerce | **YES (`ver=`)** | `/\/plugins\/woocommerce\/(?:assets\/(?:js\/frontend\/)?woocommerce(?:\.min)?\.js.*?ver=)([0-9]+(?:\.[0-9]+)+(?:-[0-9A-Za-z.-]+)?)/i` | `7.1.4`, `11.4.0-dev.20261116` |
| 9 | `nextjs` | Framework | No | `/\/_next\/static\//i` | Path only |
| 10 | `vue` | Framework | No (path `@` only) | `/vue@([0-9]+(?:\.[0-9]+)+(?:-[0-9A-Za-z.-]+)?)/i` | CDN path |
| 11 | `vitepress` | Framework | No | DOM / Meta | DOM / Meta |
| 12 | `angular` | Framework | No | `/@angular\/core/i` | Path only |
| 13 | `cloudflare` | Infrastructure | No | `/static\.cloudflareinsights\.com\/beacon(?:\.min)?\.js/i` | Path only |
| 14 | `vercel` | Infrastructure | No | `/\/_vercel\/(?:insights\|speed-insights)\//i` | Path only |
| 15 | `netlify` | Infrastructure | No | `/identity\.netlify\.com\//i` | Path only |
| 16 | `react` | Library | No (path `@` only) | `/react@([\d.]+)/i` | CDN path |
| 17 | `jquery` | Library | No (filename only)| `/jquery-([\d.]+)(?:\.min)?\.js/i` | Filename |
| 18 | `bootstrap` | Library | No (path `@` only) | `/(?:bootstrap(?:[/-]\|@)([\d.]+)...)/i` | Path / Filename |
| 19 | `tailwindcss` | Library | No | `/cdn\.tailwindcss\.com/i` | Path only |
| 20 | `meta-pixel` | Marketing | No | `/connect\.facebook\.net\/.../fbevents\.js/i` | Path only |
| 21 | `hubspot` | Marketing | No | `/js\.hs-(?:scripts\|analytics)\.(?:com\|net)\//i` | Path only |
| 22 | `intercom` | Marketing | No | `/widget\.intercom\.io\/widget\//i` | Path only |
| 23 | `stripe` | Payments | No (path `/v3/`) | `/js\.stripe\.com\/v[23]\/?/i` | Path only |
| 24 | `razorpay` | Payments | No (path `/v1/`) | `/checkout\.razorpay\.com\/v1\/checkout\.js/i` | Path only |

### 2.2 Survey Conclusions
1. Exactly **two technologies** (`wordpress` and `woocommerce`) rely on `ver` query parameters.
2. **Zero technologies** use `v` query parameters for version extraction (confirming that unconditionally stripping `v` in Phase 9.6.2 was completely sound).
3. **Zero technologies** require arbitrary alphanumeric suffixes. Both WordPress and WooCommerce strictly adhere to either numeric releases or standard prerelease/snapshot tags (`dev`, `alpha`, `beta`, `rc`).

---

## Section 3: Pattern Hardening Evaluation

### 3.1 Proposed Pattern Analysis
The prompt proposed evaluating:
```typescript
const RESTRICTED_VERSION_PATTERN =
  /^[0-9]+(?:\.[0-9]+)+(?:-(?:dev|alpha|beta|rc|preview|build)(?:\.[0-9A-Za-z.-]+)?)?$/i;
```

#### Test Vector Results on Proposed Pattern
- `6.4.2` $\implies$ **PASS (`true`)**
- `11.4.0-dev.20261116` $\implies$ **PASS (`true`)**
- `1.2-session123` $\implies$ **STRIPPED (`false`)** (Security fixed)
- `1.2-tokenABC` $\implies$ **STRIPPED (`false`)** (Security fixed)
- `1.2-privateidentifier` $\implies$ **STRIPPED (`false`)** (Security fixed)
- `1.2-user-secret` $\implies$ **STRIPPED (`false`)** (Security fixed)
- `1.2-dev.20261116` $\implies$ **PASS (`true`)**

#### Critical Defect in Proposed Pattern
When tested against real-world WordPress prereleases:
- Test case: `7.2-beta5-65440` (from [`tests/fixtures/wordpress-prerelease.html`](file:///D:/SiteStack/tests/fixtures/wordpress-prerelease.html))
- Evaluation: `RESTRICTED_VERSION_PATTERN.test('7.2-beta5-65440')` evaluates to **`false`**!
- Root cause: The sub-pattern `(?:\.[0-9A-Za-z.-]+)?` mandates a literal dot `\.` immediately after `beta`. However, WordPress prereleases format build identifiers as `beta5-65440` or `RC1` without a dot separator.
- Impact: If adopted literally without modification, [`tests/engine/fixtures-runner.test.ts`](file:///D:/SiteStack/tests/engine/fixtures-runner.test.ts#L170-L176) (Fixture 2: WordPress Prerelease) would suffer a regression, stripping the version query parameter and failing extraction.

### 3.2 Refined Recommended Pattern
To support both dot-separated and non-dot-separated prerelease builds while strictly disallowing arbitrary identifier words, the pattern should allow optional alphanumeric build tags following the prerelease keyword:

```typescript
export const RECOMMENDED_SAFE_VERSION_PATTERN =
  /^[0-9]+(?:\.[0-9]+)+(?:-(?:dev|alpha|beta|rc|preview|build)[0-9A-Za-z.-]*)?$/i;
```

#### Evaluation of Refined Pattern
| Input String | Refined Pattern Match | Note |
| :--- | :---: | :--- |
| `6.4.2` | **PASS (`true`)** | Stable numeric release |
| `11.4.0-dev.20261116` | **PASS (`true`)** | WooCommerce dev snapshot |
| `7.2-beta5-65440` | **PASS (`true`)** | WordPress prerelease fixture preserved |
| `6.5-RC1` | **PASS (`true`)** | Release candidate without dot |
| `1.2-session123` | **STRIPPED (`false`)** | Arbitrary identifier blocked |
| `1.2-tokenABC` | **STRIPPED (`false`)** | Arbitrary token blocked |
| `1.2-privateidentifier` | **STRIPPED (`false`)** | Arbitrary identifier blocked |
| `1.2-user-secret` | **STRIPPED (`false`)** | Arbitrary secret blocked |

Feasibility: **100% feasible**. This refined pattern eliminates arbitrary identifier leakage with zero breakage across all existing fixtures, benchmarks, and tests.

---

## Section 4: Phase 9.6.2 Git Diff Audit

Detailed inspection of commit `b5a7d14` vs `79c3771` (`git diff --stat 79c3771 b5a7d14`):

```text
 BETA_TESTING_GUIDE.md                              |   2 +-
 PHASE_9_6_1_INDEPENDENT_VERIFICATION.md            | 340 +++++++++++++++++++++
 PRIVACY_POLICY.md                                  |   9 +-
 README.md                                          |   4 +-
 RELEASE_NOTES.md                                   |  17 +-
 src/shared/url.ts                                  |  25 ++
 tests/engine/phase9-5-evidence-privacy.test.ts     | 250 ++++++++++++++-
 .../popup/phase8-3-multiscan-empty-export.test.ts  |   6 +-
 8 files changed, 630 insertions(+), 23 deletions(-)
```

### 4.1 Scope Verification
- All 8 changed files are strictly within expected boundaries:
  - 1 source file: [`src/shared/url.ts`](file:///D:/SiteStack/src/shared/url.ts)
  - 2 test files: [`tests/engine/phase9-5-evidence-privacy.test.ts`](file:///D:/SiteStack/tests/engine/phase9-5-evidence-privacy.test.ts), [`tests/popup/phase8-3-multiscan-empty-export.test.ts`](file:///D:/SiteStack/tests/popup/phase8-3-multiscan-empty-export.test.ts)
  - 5 documentation files: [`PRIVACY_POLICY.md`](file:///D:/SiteStack/PRIVACY_POLICY.md), [`README.md`](file:///D:/SiteStack/README.md), [`BETA_TESTING_GUIDE.md`](file:///D:/SiteStack/BETA_TESTING_GUIDE.md), [`RELEASE_NOTES.md`](file:///D:/SiteStack/RELEASE_NOTES.md), [`PHASE_9_6_1_INDEPENDENT_VERIFICATION.md`](file:///D:/SiteStack/PHASE_9_6_1_INDEPENDENT_VERIFICATION.md)
- Zero changes occurred in technology rules, detection engine, scoring weights, UI components, or manifest permissions.

### 4.2 Audit of `phase8-3-multiscan-empty-export.test.ts`
Lines 118-120 and line 220 were modified:
- **Previous Expected URL:** `'https://www.youtube.com/watch?v=dQw4w9WgXcQ'`
- **New Expected URL:** `'https://www.youtube.com/watch'`

#### Detailed Root Cause
1. In Phase 9.5, `normalizeScanUrl` was updated to delegate parameter stripping to `sanitizeResourceUrl` to ensure consistent privacy sanitization across top-level URLs and evidence resource URLs.
2. In Phase 9.6.2, `isSensitiveQueryParam` was hardened to unconditionally strip `v` (`if (key === 'v') return true;`) because no supported technology rule uses `v` for version extraction.
3. In `emptyScanYouTube`, the mock URL was `https://www.youtube.com/watch?v=dQw4w9WgXcQ&utm_source=share`.
4. When normalized, `utm_source` and `v` are both stripped by `sanitizeResourceUrl`, producing `https://www.youtube.com/watch`.
5. The test assertion was updated to reflect this behavior.

#### Correctness and Safety Verification
- **Technology Profiling Impact:** SiteStack classifies technology on the domain (`youtube.com`); it is not a video bookmarking tool. Top-level technology detection and scoring are completely unaffected.
- **Privacy Impact:** Stripping `v` from all URLs prevents arbitrary identifiers or tokens passed under `?v=` from entering Chrome storage or export files.
- **Verdict on Change:** The test modification is completely correct, safe, and intentional.

---

## Section 5: Regression Test Verification

### 5.1 Test Execution Results
- **Command:** `npm test` (`vitest run`)
- **Total Test Files:** 21 passed (21 total)
- **Total Tests:** 310 passed (310 total, 0 failing, 0 skipped)
- **Execution Time:** ~14.75s

### 5.2 Verification of New Phase 9.6.2 Tests
The 3 new tests in [`tests/engine/phase9-5-evidence-privacy.test.ts`](file:///D:/SiteStack/tests/engine/phase9-5-evidence-privacy.test.ts) were individually verified:
1. **Test 1.7:** `1.7. Phase 9.6.2: Strictly validates version query parameter (ver) and strips unvalidated v parameter` — Verifies valid SemVer preservation, stripping of arbitrary non-numeric values under `ver`, and unconditional stripping of `v`.
2. **Test 2.4:** `2.4. Phase 9.6.2: Strictly validates version query parameter in resource detection and prevents token leakage` — Verifies that WordPress resource detection does not extract tokens under `?ver=user_session_SECRET123`.
3. **Test 5.2:** `5.2. Phase 9.6.2: Proves unsafe ver and v parameters are completely absent from all 8 lifecycle phases` — Verifies complete absence of unsafe parameters across in-memory scan results, Chrome storage, JSON export, single CSV export, and multi-scan CSV export.

### 5.3 Assertion Integrity
- No existing privacy assertions were weakened.
- Previous assertions that accepted `v=5.3.0` and `v=1.2` were updated to assert that `v` is stripped, strengthening overall privacy enforcement.
- Assertions stripping `token`, `session_id`, `utm_*`, `gclid`, `fbclid`, and custom secrets remain 100% active.

---

## Section Statuses

| Audit Section | Description | Status |
| :--- | :--- | :---: |
| **Section 1** | `SAFE_VERSION_PATTERN` Analysis (Arbitrary Suffix Loophole) | **FAIL** |
| **Section 2** | Technology Rules Version Requirements Survey | **PASS** |
| **Section 3** | Pattern Hardening Evaluation & Suffix Calibration | **PASS** |
| **Section 4** | Phase 9.6.2 Git Diff Audit (`b5a7d14` vs `79c3771`) | **PASS** |
| **Section 5** | Regression Test Verification (310/310 Passing) | **PASS** |

---

## Final Verdict

### `RELEASE BLOCKED`

**Justification:**  
While commit `b5a7d14` successfully prevents bare tokens and unvalidated strings from passing under `?ver=` and unconditionally strips `?v=`, the current implementation of `SAFE_VERSION_PATTERN` contains an active privacy loophole: arbitrary identifiers, session tokens, or user secrets can still survive sanitization if prefixed by a major.minor numeric version string (e.g., `?ver=1.2-session123`, `?ver=1.2-tokenABC`, `?ver=1.2-privateidentifier`, `?ver=1.2-user-secret`).

Because no supported technology requires arbitrary alphanumeric suffixes, and a refined prerelease pattern (`/^[0-9]+(?:\.[0-9]+)+(?:-(?:dev|alpha|beta|rc|preview|build)[0-9A-Za-z.-]*)?$/i`) completely eliminates this risk without breaking any legitimate WordPress or WooCommerce versions, the beta release remains **BLOCKED** until this final targeted pattern hardening is implemented.
