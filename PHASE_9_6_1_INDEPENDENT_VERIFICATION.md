# SiteStack Phase 9.6.1 — Independent Privacy Verification Report

**Audit Target Commit:** [`79c3771`](file:///D:/SiteStack)  
**Date & Time:** November 16, 2026  
**Auditor:** Independent Security & Code Verification Agent  
**Scope:** Read-Only Verification of Phase 9.6 Privacy Remediation, Query Parameter Allowlist, Evidence Pipeline, Header Architecture, and Storage Writeback  
**Final Verdict:** **RELEASE BLOCKED** (Identified critical unvalidated version parameter privacy gap in `src/shared/url.ts`)

---

## Executive Summary Matrix

| Section | Audit Domain | Status | Key Finding |
| :--- | :--- | :---: | :--- |
| **1** | Version Parameter Sanitization (`ver`, `v`) | **FAIL** | `?ver=` and `?v=` parameter values are **completely unvalidated**. Arbitrary values like `?ver=user_session_SECRET123` and `?v=account_private_identifier` bypass sanitization and are persisted to disk and exports. |
| **2** | Header Evidence Architecture | **PASS** | `headers` are **never** collected in production. Extension requests zero network sniffing permissions (`webRequest` is absent). Response headers exist solely in engine type definitions and synthetic unit test mocks. |
| **3** | Measurement ID Allowlist (`id`, `tid`) | **PASS** | `PUBLIC_MEASUREMENT_ID_PATTERN` strictly validates `GTM-*`, `G-*`, and `UA-*` containers. Arbitrary account/user/transaction IDs are stripped. Handled safely across mixed-case, URL encoding, duplicates, and malformed URLs. |
| **4** | All Six Evidence Types Verification | **PASS** | `dom`, `global`, `meta`, `header`, and `inferred` evidence cannot leak arbitrary URLs or query secrets. `resource` is sanitized at 4 pipeline stages (evaluator, storage, export JSON, export CSV), but inherits Section 1's `ver`/`v` gap. |
| **5** | Legacy Storage Writeback | **PASS** | Verified that `getScanHistory()` not only sanitizes legacy dirty records in memory, but actively writes the clean array back to `chrome.storage.local`. Re-reads confirm no disk regression. |
| **6** | Documentation Accuracy | **FAIL (Partial)** | `PRIVACY_POLICY.md` and `README.md` accurately disclose Google Fonts and zero programmatic network requests, but over-claim that version parameters are safe without disclosing that `ver` and `v` parameter values are currently unvalidated. |

---

## Section 1: Verify Version Parameter Sanitization (`ver`, `v`)

### Inspected Files & Functions
- **File:** [`src/shared/url.ts`](file:///D:/SiteStack/src/shared/url.ts)
- **Functions:** `isSensitiveQueryParam(rawKey, rawVal)`, `sanitizeResourceUrl(rawUrl)`, `sanitizeMalformedUrlString(raw)`
- **Rule Files:** [`src/engine/rules/cms.ts`](file:///D:/SiteStack/src/engine/rules/cms.ts), [`src/engine/rules/ecommerce.ts`](file:///D:/SiteStack/src/engine/rules/ecommerce.ts), [`src/engine/rules/libraries.ts`](file:///D:/SiteStack/src/engine/rules/libraries.ts)

### Code Inspection
In [`src/shared/url.ts`](file:///D:/SiteStack/src/shared/url.ts#L87-L126), `isSensitiveQueryParam` is implemented as follows:

```typescript
export function isSensitiveQueryParam(rawKey: string, rawVal?: string): boolean {
  if (!rawKey || typeof rawKey !== 'string') return false;

  let decoded = rawKey;
  try {
    decoded = decodeURIComponent(rawKey);
  } catch {
    // Gracefully handle malformed URL encoding
  }

  const key = decoded.toLowerCase().trim();
  if (!key) return false;

  // 1. Prefix matches (utm_*)
  if (key.startsWith('utm_')) return true;

  // 2. Exact match in sensitive set
  if (SENSITIVE_PARAM_NAMES.has(key)) return true;

  // 3. Pattern match for compound credential keys
  if (COMPOUND_SENSITIVE_PATTERN.test(key)) return true;

  // 4. Value-aware inspection for generic 'id' and 'tid' parameters:
  if (key === 'id' || key === 'tid') {
    if (!rawVal || typeof rawVal !== 'string') return true;
    let decodedVal = rawVal.trim();
    try {
      decodedVal = decodeURIComponent(decodedVal);
    } catch {
      // Keep trimmed value
    }
    if (!PUBLIC_MEASUREMENT_ID_PATTERN.test(decodedVal)) {
      return true; // Strip arbitrary non-measurement IDs
    }
  }

  return false;
}
```

### Empirical Evaluation of Synthetic Test Vectors
Tracing the function logic against the user's specific test vectors:

1. **Vector 1: `?ver=user_session_SECRET123`**
   - `key` is `'ver'`.
   - `key.startsWith('utm_')` $\implies$ `false`.
   - `SENSITIVE_PARAM_NAMES.has('ver')` $\implies$ `false`.
   - `COMPOUND_SENSITIVE_PATTERN.test('ver')` $\implies$ `false`.
   - `key === 'id' || key === 'tid'` $\implies$ `false`.
   - **Result:** Function returns `false` (classified as NOT sensitive).
   - **Sanitization Output:** `https://example.com/asset.js?ver=user_session_SECRET123` is **PRESERVED IN FULL**.
2. **Vector 2: `?v=account_private_identifier`**
   - `key` is `'v'`.
   - Falls through all checks and returns `false`.
   - **Sanitization Output:** `https://example.com/asset.js?v=account_private_identifier` is **PRESERVED IN FULL**.
3. **Vector 3: `?ver=token_ABC123`**
   - `key` is `'ver'`.
   - Falls through all checks and returns `false`.
   - **Sanitization Output:** `https://example.com/asset.js?ver=token_ABC123` is **PRESERVED IN FULL**.

### Legitimate Version Extraction Requirements
Inspection of the rule definitions reveals:
- **WordPress** ([`src/engine/rules/cms.ts`](file:///D:/SiteStack/src/engine/rules/cms.ts#L36)):
  `urlRegex: /\/wp-emoji-release\.min\.js\?ver=([0-9]+(?:\.[0-9]+)+(?:-[0-9A-Za-z.-]+)?)/i`
  *Requires:* `ver` parameter with standard numeric / SemVer / pre-release format (e.g. `6.4.2`).
- **WooCommerce** ([`src/engine/rules/ecommerce.ts`](file:///D:/SiteStack/src/engine/rules/ecommerce.ts#L43)):
  `urlRegex: /\/plugins\/woocommerce\/(?:assets\/(?:js\/frontend\/)?woocommerce(?:\.min)?\.js.*?ver=)([0-9]+(?:\.[0-9]+)+(?:-[0-9A-Za-z.-]+)?)/i`
  *Requires:* `ver` parameter with numeric / SemVer format (e.g. `7.1.4`, `11.4.0-dev.20261116`).
- **Bootstrap** ([`src/engine/rules/libraries.ts`](file:///D:/SiteStack/src/engine/rules/libraries.ts#L81)):
  Extracts from global `bootstrap.Tooltip.VERSION` or URL path `docs/6.0/dist/...`. It does **not** rely on `?v=`.
- **jQuery** ([`src/engine/rules/libraries.ts`](file:///D:/SiteStack/src/engine/rules/libraries.ts#L54)):
  Extracts from global `jQuery.fn.jquery` or filename `jquery-3.7.1.min.js`. It does **not** rely on `?v=` or `?ver=`.

### Conclusion for Section 1
- **Genuine Privacy Gap:** **YES**.
- While Phase 9.6 introduced value-level restriction for `id` and `tid` (`PUBLIC_MEASUREMENT_ID_PATTERN`), it left `ver` and `v` completely unvalidated on the value level.
- Any arbitrary token, session ID, secret, or tracking identifier passed under `?ver=` or `?v=` completely bypasses sanitization.
- **Section 1 Rating:** **FAIL**.

---

## Section 2: Verify Header Evidence Architecture

### Inspected Files
- **Manifest:** [`manifest.json`](file:///D:/SiteStack/manifest.json)
- **Service Worker:** [`src/extension/background/service-worker.ts`](file:///D:/SiteStack/src/extension/background/service-worker.ts)
- **Probes:** [`src/extension/content/isolated-probe.ts`](file:///D:/SiteStack/src/extension/content/isolated-probe.ts), [`src/extension/content/main-probe.ts`](file:///D:/SiteStack/src/extension/content/main-probe.ts)
- **Engine:** [`src/engine/evaluator.ts`](file:///D:/SiteStack/src/engine/evaluator.ts), [`src/engine/types.ts`](file:///D:/SiteStack/src/engine/types.ts)
- **Rules:** [`src/engine/rules/infrastructure.ts`](file:///D:/SiteStack/src/engine/rules/infrastructure.ts)

### Findings
1. **Manifest Permissions:**
   `manifest.json` requests only `"activeTab"`, `"scripting"`, and `"storage"`.
   - `chrome.webRequest`: **ABSENT**.
   - `chrome.declarativeNetRequest`: **ABSENT**.
   - Host permissions (`<all_urls>`): **ABSENT**.
2. **Probe Signal Harvesting:**
   - `isolated-probe.ts` harvests only `url`, `meta`, `dom`, and `resources`. It does not harvest HTTP response headers.
   - `main-probe.ts` inspects only approved `window` globals.
   - `PerformanceResourceTiming` in browser content scripts exposes URL filenames (`entry.name`), timings, and byte transfer sizes. It **cannot** expose HTTP response headers by browser security design.
3. **Service Worker Assembly:**
   In [`src/extension/background/service-worker.ts`](file:///D:/SiteStack/src/extension/background/service-worker.ts#L82-L88):
   ```typescript
   const combinedSignals: HarvestedSignals = {
     url: isolatedPayload.url || tabUrl,
     meta: isolatedPayload.meta || [],
     dom: isolatedPayload.dom || [],
     resources: isolatedPayload.resources || [],
     globals: globalSignals,
   };
   ```
   `combinedSignals.headers` is **never set**; it is always `undefined`.
4. **Rule Definitions:**
   Searching the entire `src/engine/rules/` directory for `headers:` returns **0 matches**. Not a single rule in the 24-technology catalog defines a header matching signal.
5. **Where Header Evidence Appears:**
   Header evidence appears **exclusively in test fixtures** (`tests/engine/evaluator.test.ts`, `tests/engine/benchmark.test.ts`, `tests/engine/phase9-5-evidence-privacy.test.ts`) to test the engine's generic scoring types.

### What the Production Extension Can and Cannot Observe
- **CAN Observe:** DOM tree, `<meta>` tags, window globals in `world: 'MAIN'`, resource URLs via `performance.getEntriesByType('resource')`.
- **CANNOT Observe:** Document-level HTTP response headers (`Server: Vercel`, `CF-Ray`, `x-vercel-id`, `set-cookie`, etc.).
- **Hosting Detection Integrity:** Because `headers` cannot be observed, Vercel detection cannot receive server header corroboration in production, and is permanently subject to `maxConfidenceScore: 69`. SiteStack's documentation honestly discloses this limitation.
- **Section 2 Rating:** **PASS**.

---

## Section 3: Verify Measurement ID Allowlist

### Inspected Code
In [`src/shared/url.ts`](file:///D:/SiteStack/src/shared/url.ts#L78-L126):
```typescript
const PUBLIC_MEASUREMENT_ID_PATTERN = /^(?:G-[A-Z0-9]+|GTM-[A-Z0-9]+|UA-[0-9]+-[0-9]+)$/i;
```

### Verification Against Technical Criteria
1. **Valid GTM IDs Preserved:**
   - Input: `https://www.googletagmanager.com/gtm.js?id=GTM-TEST123`
   - Matched by `GTM-[A-Z0-9]+`. `isSensitiveQueryParam('id', 'GTM-TEST123')` returns `false`.
   - **Verified Preserved.**
2. **Valid GA4 IDs Preserved:**
   - Input: `https://www.googletagmanager.com/gtag/js?id=G-MEASURE456` and `collect?tid=G-MEASURE456`
   - Matched by `G-[A-Z0-9]+`. Both return `false`.
   - **Verified Preserved.**
3. **Valid Universal Analytics (UA) IDs Preserved:**
   - Input: `https://example.com/analytics.js?id=UA-12345-1`
   - Matched by `UA-[0-9]+-[0-9]+`. Returns `false`.
   - **Verified Preserved.**
4. **Arbitrary User/Account/Transaction IDs Stripped:**
   - Input: `https://example.com/script.js?id=user_secret_12345` $\implies$ Stripped (`?id=` removed).
   - Input: `https://example.com/script.js?id=987654321` $\implies$ Stripped.
   - Input: `https://example.com/pay.js?tid=txn_checkout_888` $\implies$ Stripped.
   - **Verified Stripped.**
5. **URL-Encoded Values:**
   - In `isSensitiveQueryParam`, `rawVal` is decoded via `decodeURIComponent(decodedVal)`.
   - `id=GTM%2DABC123` decodes to `GTM-ABC123` and matches `PUBLIC_MEASUREMENT_ID_PATTERN`.
   - **Verified Handled Safely.**
6. **Mixed-Case Parameter Names:**
   - In `isSensitiveQueryParam`, `rawKey` is decoded and converted to lower case: `const key = decoded.toLowerCase().trim()`.
   - Handles `ID`, `Id`, `TID`, `tId`, etc.
   - **Verified Handled Safely.**
7. **Duplicate Parameters:**
   - `URLSearchParams.forEach((val, key) => ...)` executes on each individual entry.
   - For `?id=GTM-123&id=user999`, the first entry is preserved while the second is dropped.
   - **Verified Handled Safely.**
8. **Malformed URLs:**
   - Handled by `sanitizeMalformedUrlString` fallback parser when `new URL()` throws. Splits by `&` and `;`, safely extracts key/value pairs, and validates each pair.
   - **Verified Handled Safely.**
- **Section 3 Rating:** **PASS**.

---

## Section 4: Verify All Six Evidence Types

### Inspected Pipeline
`Signal collection` $\implies$ `Evaluation (evaluator.ts)` $\implies$ `ScanResult` $\implies$ `History storage (history.ts)` $\implies$ `JSON export` $\implies$ `CSV export (export.ts)`.

| Evidence Type | Leakage Potential into `evidence.source` | Leakage Potential into `evidence.matchedValue` | Verification Status |
| :--- | :--- | :--- | :---: |
| **`resource`** | Evaluator calls `truncateResourceUrl(resUrl, 120)` which applies `sanitizeResourceUrl`. Storage and exports apply `sanitizeResourceEvidenceString`. | Evaluator calls `sanitizeResourceUrl(resUrl)`. Storage and exports apply `sanitizeResourceUrl`. | **PASS (Conditional)**: Pipeline correctly routes all fields through sanitization, but subject to Section 1's `ver`/`v` parameter gap. |
| **`dom`** | `source` is static CSS selector string (e.g. `[data-reactroot]`, `[ng-version]`). | Only set for `[ng-version]` attribute value (e.g. `17.2.1`). Never contains URLs or query strings. | **PASS** |
| **`global`** | `source` is static path `window.<path>` (e.g. `window.wp`, `window.React`). | Only set to string version (e.g. `18.3.1`) or undefined. | **PASS** |
| **`meta`** | `source` is `<meta name="...">` or `<meta property="...">`. | Captures `content.slice(0, 50)` from generator tags (e.g. `WordPress 6.4.2`). Supported rules never match URLs in meta tags. | **PASS** |
| **`header`** | Never collected in production. In test fixtures, `source` is `header: server`. | In test fixtures, `matchedValue` is `Vercel` or `cloudflare`. | **PASS** |
| **`inferred`** | `source` is static template string `Architectural dependency of Next.js (...)`. | Always `undefined`. | **PASS** |

- **Section 4 Rating:** **PASS**.

---

## Section 5: Verify Legacy Storage Writeback

### Inspected Code
In [`src/extension/storage/history.ts`](file:///D:/SiteStack/src/extension/storage/history.ts#L162-L184):
```typescript
export async function getScanHistory(): Promise<ScanResult[]> {
  if (typeof chrome === 'undefined' || !chrome.storage?.local) return [];

  try {
    const data = await chrome.storage.local.get(STORAGE_KEY_HISTORY);
    const rawStored = data[STORAGE_KEY_HISTORY];
    const normalized = normalizeStoredHistory(rawStored);

    // Persist sanitized records back to storage if migration/sanitization cleaned up legacy records
    if (rawStored && JSON.stringify(rawStored) !== JSON.stringify(normalized)) {
      try {
        await chrome.storage.local.set({ [STORAGE_KEY_HISTORY]: normalized });
      } catch (migrateErr) {
        console.warn('[SiteStack Storage] Legacy migration writeback notice:', migrateErr);
      }
    }

    return normalized;
  } catch (err) {
    console.warn('[SiteStack Storage] Failed to retrieve history:', err);
    return [];
  }
}
```

### Verification Against Technical Criteria
1. **Sanitized In Memory:** `normalizeStoredHistory(rawStored)` passes all records through `sanitizeScanResult`, cleaning `url`, `evidence.source`, and `evidence.matchedValue`.
2. **Written Back to `chrome.storage.local`:** If `JSON.stringify(rawStored) !== JSON.stringify(normalized)`, `chrome.storage.local.set({ [STORAGE_KEY_HISTORY]: normalized })` is executed immediately.
3. **Re-Read Integrity:** Verified by automated test 3.2 in `tests/engine/phase9-5-evidence-privacy.test.ts`:
   - Inspects `mockStorage[STORAGE_KEY_HISTORY]` directly after first read.
   - Asserts that dirty tokens (`DIRTY_TOKEN_123`, `DIRTY_SESS_456`, `OLD_SECRET`) are gone from `mockStorage`.
   - Executes a second `getScanHistory()` call and confirms returned data remains clean.
4. **Metadata Preservation:** Verified that `id`, `domain`, `timestamp`, `scanDurationMs`, `engineEvaluationDurationMs`, `technologies`, and `stats` are preserved intact.
- **Section 5 Rating:** **PASS**.

---

## Section 6: Documentation Accuracy Check

### Comparison Matrix

| Documentation File | Topic / Claim | Actual Production Behavior | Audit Verdict |
| :--- | :--- | :--- | :---: |
| [`PRIVACY_POLICY.md`](file:///D:/SiteStack/PRIVACY_POLICY.md) | **Google Fonts Stylesheet** (Section 2 & 8) | Discloses `<link>` tags in `popup/index.html` fetching from Google Fonts CDN when online, with system font fallback offline. Matches reality. | **PASS** |
| [`PRIVACY_POLICY.md`](file:///D:/SiteStack/PRIVACY_POLICY.md) | **Zero Programmatic Network Calls** (Section 2) | Discloses zero `fetch()`, `XMLHttpRequest`, `WebSocket`, or `sendBeacon()` in service worker and probes. Matches reality. | **PASS** |
| [`PRIVACY_POLICY.md`](file:///D:/SiteStack/PRIVACY_POLICY.md) | **Header Evidence & Hosting** (Section 3) | Discloses that `webRequest` is omitted and response headers cannot be inspected in MV3. Matches reality. | **PASS** |
| [`PRIVACY_POLICY.md`](file:///D:/SiteStack/PRIVACY_POLICY.md) | **Measurement ID Exceptions** (Section 5) | States `id` and `tid` are restricted to `GTM-*`, `G-*`, `UA-*`. Matches reality. | **PASS** |
| [`PRIVACY_POLICY.md`](file:///D:/SiteStack/PRIVACY_POLICY.md) | **Version Parameter Safety** (Section 5) | States: *"Query parameters ver ... and v ... are preserved because they are technically required for accurate semantic version extraction across CMS platforms and component libraries."* **However**, it fails to disclose that any arbitrary non-version string in `ver` or `v` is also preserved without validation. | **FAIL (Incomplete)** |
| [`README.md`](file:///D:/SiteStack/README.md) | **Version Parameter Safety** (Privacy Model) | States: *"Safe version parameters (ver, v) ... are preserved where required for software version extraction; arbitrary user/account IDs are stripped."* A reader may believe arbitrary IDs in `ver` or `v` are stripped, when in reality only `id` and `tid` are stripped. | **FAIL (Incomplete)** |
| [`BETA_TESTING_GUIDE.md`](file:///D:/SiteStack/BETA_TESTING_GUIDE.md) | **Evidence Privacy** (Section 6.5) | States: *"Arbitrary user, account, or transaction identifiers (e.g. ?id=user123 or ?tid=txn_999) fail this strict validation pattern and are stripped as sensitive."* Accurately attributes stripping to `id` and `tid`. | **PASS** |
| [`RELEASE_NOTES.md`](file:///D:/SiteStack/RELEASE_NOTES.md) | **Changelog & Bundle Statistics** | Matches commit `79c3771`, 307 tests across 21 files, and exact Vite output chunks. | **PASS** |

- **Section 6 Rating:** **FAIL (Partial)** due to incomplete disclosure of unvalidated `ver`/`v` parameter values.

---

## Discrepancies Between Phase 9.6 Report and Actual Code

1. **Phase 9.6 Report Claim:**
   > *"The preserved query parameter allowlist (id, ver, v, tid)... Values that could contain credentials or personal identifiers are not preserved unnecessarily."*
   **Actual Code Reality:**
   `isSensitiveQueryParam()` applies `PUBLIC_MEASUREMENT_ID_PATTERN` **only** when `key === 'id' || key === 'tid'`.
   Parameters named `ver` and `v` are neither checked against `SENSITIVE_PARAM_NAMES` nor validated against a version regex pattern.
   Consequently, `?ver=user_session_SECRET123`, `?v=account_private_identifier`, or `?ver=token_ABC123` are **fully preserved**.
2. **Missing `v=` Version Extraction Rule:**
   The documentation and Phase 9.6 report claimed `v` is required for Bootstrap version extraction.
   **Actual Code Reality:**
   Inspection of `src/engine/rules/libraries.ts` shows Bootstrap extracts versions via `bootstrap.Tooltip.VERSION` (window global) or `docs/([\d.]+)/dist/css/bootstrap.min.css` (URL path regex). It **never** uses `?v=` for version extraction.
   WordPress and WooCommerce use `?ver=`.
   Therefore, preserving `v` was based on an assumption rather than an actual rule requirement, and keeping unvalidated `v` creates an unnecessary query parameter leakage surface.

---

## Tests Executed & Results

Executed complete test suite via Vitest to confirm baseline test suite health:
```text
npx vitest run
Test Files: 21 passed (21)
Tests:      307 passed (307)
Duration:   17.19s
```

TypeScript compilation check:
```text
npx tsc -b
-> Exited with code 0 (0 errors)
```

Production build check:
```text
npm run build
-> Built in 5.35s (all 7 distribution chunks valid)
```

---

## Final Verdict & Release Assessment

### **FINAL VERDICT: RELEASE BLOCKED**

### Reason for Block:
SiteStack cannot be certified for beta release with an unvalidated version parameter privacy gap:
1. `?ver=` and `?v=` preserve arbitrary query values without pattern validation.
2. If a website passes session identifiers or auth tokens via `?ver=` (e.g. `?ver=sess_abc12345`) or `?v=` (e.g. `?v=account_token_xyz`), SiteStack preserves those secrets in local storage, history, and CSV/JSON exports.
3. Legitimate version extraction only requires `?ver=` to match valid SemVer/numeric release patterns (e.g. `/^[0-9]+(?:\.[0-9]+)+(?:-[0-9A-Za-z.-]+)?$/`) for WordPress and WooCommerce. `?v=` is not even used by any rule in the catalog.

### Recommended Remediation for Subsequent Phase (Read-Only Policy Respected — No Code Modified):
1. In `src/shared/url.ts`, implement a strict SemVer / release version pattern validator for `ver`:
   `const SAFE_VERSION_PATTERN = /^[0-9]+(?:\.[0-9]+)+(?:-[0-9A-Za-z.-]+)?$/;`
   If `key === 'ver'`, ensure `SAFE_VERSION_PATTERN.test(decodedVal)` before preserving; otherwise strip it.
2. Remove unneeded `v` parameter exception or restrict it to `SAFE_VERSION_PATTERN`.
3. Update documentation and regression tests accordingly.
