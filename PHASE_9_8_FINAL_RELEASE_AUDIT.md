# SiteStack Phase 9.8 — Final Release Audit Checklist & Verification Protocol

**Document Purpose:** Comprehensive Release Readiness Audit Protocol for SiteStack Release Candidate  
**Target Release:** SiteStack v1.0.0 (Release Candidate)  
**Evaluation Commit Checkpoint:** [`f5710e3`](file:///D:/SiteStack) (`fix(extension): harden tab-state lifecycle, session storage, and navigation guards`)  
**Production Build Directory:** [`D:\SiteStack\dist`](file:///D:/SiteStack/dist)  
**Validation Environment:** Brave Browser (Chromium Engine)  
**Status:** **AUDIT CHECKLIST PREPARED (PENDING AUDITOR SIGN-OFF & T8–T15 EXECUTION)**  
**Beta-Ready Declaration:** **DEFERRED** (Pending T8–T15 manual verification in Brave Browser and completion of all Section 1–13 audit sign-offs)

---

## Executive Summary & Audit Mandate

Phase 9.8 establishes the exhaustive, multi-dimensional release audit protocol to verify that SiteStack adheres to all privacy, security, lifecycle, export, error handling, and build integrity requirements before any general or beta distribution.

This document serves as the formal checklist for the release auditor. Every domain below must be inspected and signed off individually.

---

## 1. Manifest V3 & Permissions Audit

### Scope & Policy
SiteStack adheres to the principle of least privilege under Google Chrome Web Store Developer Program Policies.

```json
{
  "manifest_version": 3,
  "name": "SiteStack — Technology Stack Profiler",
  "version": "1.0.0",
  "permissions": [
    "activeTab",
    "scripting",
    "storage"
  ]
}
```

### Verification Checkpoints
- [ ] **CP-1.1 ActiveTab-Only Model:** Verify `activeTab` is the only tab permission requested. The broad `tabs` permission is absent.
- [ ] **CP-1.2 Zero Host Permissions:** Verify `<all_urls>`, `*://*/*`, `http://*/*`, and `https://*/*` are completely absent from `manifest.json`.
- [ ] **CP-1.3 Zero Network Interception:** Verify `webRequest`, `webRequestBlocking`, and `declarativeNetRequest` are absent.
- [ ] **CP-1.4 Zero Session / Cookie Access:** Verify `cookies` permission is absent.
- [ ] **CP-1.5 Zero Native / Background Overhead:** Verify `nativeMessaging`, `webNavigation`, and `background.persistent` are absent.
- [ ] **CP-1.6 Scripting Scope:** Verify `scripting` is used exclusively for on-demand injection of read-only probes into the actively focused tab.

---

## 2. Privacy Policy Accuracy & Alignment Audit

### Scope & Policy
Compare the actual production codebase against all representations made in [`PRIVACY_POLICY.md`](file:///D:/SiteStack/PRIVACY_POLICY.md).

### Verification Checkpoints
- [ ] **CP-2.1 Zero Personal Data Collection:** Verify that form inputs (`<input>`, `<textarea>`, `<select>`), passwords, session cookies, and authentication tokens are never read, accessed, or queried by `src/extension/content/` probes.
- [ ] **CP-2.2 Client-Side Isolation:** Verify that all detection logic (`src/engine/`) runs 100% locally in-memory without remote API dependencies.
- [ ] **CP-2.3 External Asset Disclosures:** Verify that the only external network request ever initiated by the extension is the optional Google Web Fonts stylesheet link (`Plus Jakarta Sans`, `JetBrains Mono`) inside `dist/popup/index.html`.
- [ ] **CP-2.4 System Font Fallback:** Verify that if the Google Fonts CDN is unreachable or offline, the UI falls back seamlessly to system sans-serif fonts without layout breakage or console errors.
- [ ] **CP-2.5 Local Inline Icons:** Verify that all technology badges and UI icons render from compiled inline SVG components (Lucide React), with zero remote image requests.

---

## 3. URL and Diagnostic Evidence Sanitization Audit

### Scope & Policy
Audit the multi-layer sanitization pipeline in [`src/shared/url.ts`](file:///D:/SiteStack/src/shared/url.ts) across signal harvesting, engine evaluation, storage, and exports.

### Verification Checkpoints
- [ ] **CP-3.1 Sensitive Query Parameter Stripping:** Verify unconditional stripping of sensitive query parameters (`token`, `auth`, `key`, `api_key`, `secret`, `password`, `hash`, `signature`, `session_id`, `sid`, `user_id`, `uid`, `email`, `utm_*`, `fbclid`, `gclid`, etc.).
- [ ] **CP-3.2 Fragment Identifier Stripping:** Verify all URL hash fragments (`#...`) are permanently stripped from scanned URLs and resource evidence.
- [ ] **CP-3.3 Strict Version Parameter (`ver`) Sanitization:** Verify that `ver` query parameters are preserved **only** when matching the bounded version grammar:
  ```text
  /^[0-9]+(?:\.[0-9]+)+(?:-(?:dev\.[0-9]+|beta[0-9]+(?:-[0-9]+)?|rc(?:\.[0-9]+|[0-9]+)|alpha[0-9]+(?:-[0-9]+)?))?$/i
  ```
  Verify that arbitrary strings (e.g. `?ver=session123`, `?ver=1.2-tokenABC`, `?ver=1.2-user-secret`) are stripped.
- [ ] **CP-3.4 Unvalidated `v` Parameter Stripping:** Verify that query parameter `v` is stripped unconditionally from all resource evidence.
- [ ] **CP-3.5 Strictly Bounded Measurement Identifiers (`id`, `tid`):** Verify `id` and `tid` are preserved only when matching public analytics and container formats:
  ```text
  /^(?:G-[A-Z0-9]+|GTM-[A-Z0-9]+|UA-[0-9]+-[0-9]+)$/i
  ```
- [ ] **CP-3.6 Defense-in-Depth Sanitization:** Verify sanitization is enforced at 4 distinct layers:
  1. Content probe harvesting (`isolated-probe.ts`).
  2. Engine evaluation (`evaluator.ts`).
  3. Storage layer persistence (`history.ts`).
  4. Export generation pipelines (`export.ts`).

---

## 4. Network Transmission & Zero-Telemetry Audit

### Scope & Policy
Verify that the extension cannot transmit telemetry, URLs, or browsing data across the network.

### Verification Checkpoints
- [ ] **CP-4.1 Codebase Network Grep:** Verify zero instances of `fetch()`, `XMLHttpRequest`, `WebSocket`, or `navigator.sendBeacon()` across all production source files (`src/`).
- [ ] **CP-4.2 Zero Telemetry SDKs:** Verify package manifests (`package.json`) contain zero analytics SDKs (Google Analytics, Segment, Sentry, Mixpanel, Datadog).
- [ ] **CP-4.3 Manifest Content Security Policy:** Verify `manifest.json` does not declare permissive CSP overrides or remote script sources (`script-src 'self'`).
- [ ] **CP-4.4 Background Worker Isolation:** Verify `service-worker.ts` communicates exclusively via `chrome.runtime.onMessage` with internal extension components.

---

## 5. Tab-State Lifecycle & Active Tab Isolation Audit

### Scope & Policy
Audit the Phase 9.7.3 tab-state lifecycle hardening implemented at commit `f5710e3`.

### Verification Checkpoints
- [ ] **CP-5.1 Ephemeral Session Storage (D1):** Verify temporary tab-to-scan associations (`STORAGE_KEY_TAB_SCANS`) reside in `chrome.storage.session` and are never serialized to disk.
- [ ] **CP-5.2 Legacy Local Key Cleanup (D1):** Verify `cleanupLegacyLocalTabScans()` runs on startup and removes obsolete `sitestack_tab_scans` keys from `chrome.storage.local`.
- [ ] **CP-5.3 Same-URL Reload Invalidation (D2):** Verify `chrome.tabs.onUpdated` listening for `status === 'loading'` immediately invalidates tab associations on F5 reload, Back/Forward, or cross-domain navigation.
- [ ] **CP-5.4 Navigation During Active Scan Guard (D3):** Verify `performTabScan` performs live URL verification via `chrome.tabs.get(tabId)` before writing tab associations, discarding results if the user navigated away during probe execution.
- [ ] **CP-5.5 Popup Late-Response & Rescan Guard (D4):** Verify `useScanner.ts` sequences scan requests via `latestRequestIdRef` and checks active tab URL before committing scan results, discarding stale out-of-order responses.
- [ ] **CP-5.6 Zero Automatic Scanning:** Verify that opening the popup on an unscanned tab displays "Ready to Scan" with zero background probing.

---

## 6. Scan History & Data Retention Audit

### Scope & Policy
Audit local history persistence, LRU bounds, and deletion synchronization in [`src/extension/storage/history.ts`](file:///D:/SiteStack/src/extension/storage/history.ts).

### Verification Checkpoints
- [ ] **CP-6.1 Local Storage Sandbox:** Verify persistent scan history resides strictly in `chrome.storage.local` under `sitestack_history`.
- [ ] **CP-6.2 50-Item LRU Bound:** Verify storage is strictly bounded at 50 items (`MAX_HISTORY_ITEMS = 50`), automatically pruning oldest records on overflow.
- [ ] **CP-6.3 60-Second De-Duplication:** Verify repeated scans of the same domain within 60 seconds update the existing entry without duplicating.
- [ ] **CP-6.4 Quota Recovery:** Verify storage quota errors trigger recovery pruning (removing oldest 50% of records) without crashing.
- [ ] **CP-6.5 Single-Scan Deletion Synchronization:** Verify deleting an individual history item also purges any active session tab scan referencing that item.
- [ ] **CP-6.6 Full History Clear Synchronization:** Verify `clearScanHistory()` purges all persistent records from `chrome.storage.local` and clears all tab associations in `chrome.storage.session`.

---

## 7. JSON and CSV Export Schemas Audit

### Scope & Policy
Audit single-scan and multi-scan export pipelines in [`src/popup/utils/export.ts`](file:///D:/SiteStack/src/popup/utils/export.ts).

### Verification Checkpoints
- [ ] **CP-7.1 Single-Scan CSV 11-Column Schema:** Verify header columns strictly match:
  `scannedWebsite,technology,category,version,confidenceScore,confidenceTier,detectionType,parentDependency,confidenceReason,evidenceSummary,technologyWebsite`
- [ ] **CP-7.2 Multi-Scan CSV 13-Column Schema:** Verify header columns strictly match:
  `scannedWebsite,scanDate,url,technology,category,version,confidenceScore,confidenceTier,detectionType,parentDependency,confidenceReason,evidenceSummary,technologyWebsite`
- [ ] **CP-7.3 Dual URL Semantics:** Verify `scannedWebsite` is the target scanned domain and `technologyWebsite` is the official vendor documentation URL.
- [ ] **CP-7.4 RFC 4180 Escaping:** Verify all CSV values are enclosed in double quotes, and internal quotes are escaped as `""`.
- [ ] **CP-7.5 Dedicated Empty Scan Row:** Verify empty scans emit exactly one CSV row with `scannedWebsite`, `scanDate`, `url`, and 10 empty technology fields.
- [ ] **CP-7.6 Export Sanitization Re-Pass:** Verify all evidence strings are sanitized through `sanitizeResourceEvidenceString` before file generation.

---

## 8. Restricted & System Page Security Guard Audit

### Scope & Policy
Verify the extension's pre-injection guards when invoked on restricted browser protocols.

### Verification Checkpoints
- [ ] **CP-8.1 Scheme Interception:** Verify `validateScannableUrl` catches `brave://`, `chrome://`, `edge://`, `about:`, `chrome-extension://`, `devtools://`, and `file://`.
- [ ] **CP-8.2 Pre-Injection Blocking:** Verify no probe scripts are injected into restricted browser schemes.
- [ ] **CP-8.3 UI Presentation:** Verify popup renders clean Restricted Page notice with `ShieldAlert` icon.
- [ ] **CP-8.4 History Exclusion:** Verify restricted page invocations are never saved to history.
- [ ] **CP-8.5 Zero Console Errors:** Verify zero unhandled exceptions or runtime rejections.

---

## 9. Browser Error Page Handling Audit

### Scope & Policy
Audit classification and UI handling of browser-generated connection error pages (`brave-error://`, `chrome-error://`, `ERR_NAME_NOT_RESOLVED`, `ERR_CONNECTION_REFUSED`, `ERR_INTERNET_DISCONNECTED`).

### Verification Checkpoints
- [ ] **CP-9.1 Accurate Classification:** Verify error pages are classified as `PAGE_UNAVAILABLE`, never as successful empty scans.
- [ ] **CP-9.2 UI Presentation:** Verify popup renders "Page Unavailable" with amber styling and `WifiOff` icon.
- [ ] **CP-9.3 History Exclusion:** Verify browser error pages are never persisted to local history.
- [ ] **CP-9.4 Error Frame Guard:** Verify content script injection failures on `chrome-error://` frames are caught gracefully in `service-worker.ts`.
- [ ] **CP-9.5 Recovery:** Verify subsequent navigation to a live webpage works without requiring an extension reload.

---

## 10. Offline & Air-Gapped Operation Audit

### Scope & Policy
Verify that SiteStack operates with complete fidelity in air-gapped or disconnected environments.

### Verification Checkpoints
- [ ] **CP-10.1 Offline Evaluation:** Verify technology detection executes from in-memory DOM, globals, and ResourceTiming entries without internet.
- [ ] **CP-10.2 Offline History & Export:** Verify local history browsing and CSV/JSON downloads via `Blob` and `URL.createObjectURL` function offline.
- [ ] **CP-10.3 Offline Error Handling:** Verify disconnected error page (`ERR_INTERNET_DISCONNECTED`) displays "Page Unavailable".
- [ ] **CP-10.4 Zero Background Requests:** Verify DevTools Network tab records zero failed outbound network requests when offline.

---

## 11. Build & Checkpoint Integrity Audit

### Scope & Policy
Verify production build reproducibility, TypeScript compilation, and bundle characteristics.

### Verification Checkpoints
- [ ] **CP-11.1 Clean TypeScript Build:** Verify `npx tsc -b` exits with code 0 (zero errors or warnings).
- [ ] **CP-11.2 Reproducible Production Packaging:** Verify `npm run build` compiles `dist/` cleanly from committed source `f5710e3`.
- [ ] **CP-11.3 File Size & Overhead Limits:** Verify all output bundles comply with performance budgets:
  - `dist/service-worker.js` < 35 kB
  - `dist/isolated-probe.js` < 10 kB
  - `dist/main-probe.js` < 5 kB
  - `dist/assets/popup-*.js` < 250 kB
- [ ] **CP-11.4 Source Map Generation:** Verify production source maps (`.map`) are generated for audit inspection.
- [ ] **CP-11.5 Working Tree Purity:** Verify working tree has zero uncommitted modifications on tracked production files.

---

## 12. Brave Compatibility & Chrome Verification Boundary

### Scope & Policy
Document the explicit platform boundaries and compatibility declarations for Release Candidate 1.

### Declarations & Boundaries
1. **Brave-Validated Target:** SiteStack RC1 is verified in **Brave Browser** (Chromium Engine). All manual testing protocols, shields toggling, and lifecycle validations were conducted on Brave.
2. **Brave Shields Nuance:** Brave Shields blocks certain third-party beacons (e.g. Cloudflare analytics, GA4). Detection results for those technologies depend on Shields being enabled or disabled.
3. **Explicit Chrome Non-Claim:** Google Chrome manual validation has **NOT** been performed on this workstation. Google Chrome compatibility is inferred from Chromium engine parity (Manifest V3, `chrome.scripting`, `chrome.storage`), but **must not be advertised or certified as manually verified in Chrome**.

---

## 13. Known Issues, Edge Cases & Release Limitations

### Documented Release Boundaries
1. **Active Tab Only:** SiteStack operates on the single active tab. It cannot batch-scan multiple tabs simultaneously.
2. **Dynamic / Delayed Script Loading:** If a single-page application injects framework scripts or global objects significantly after initial page load, SiteStack evaluates the state present at the exact instant the user clicks "Scan". A manual "Rescan" captures later dynamically injected assets.
3. **Strict 24-Technology Catalog Scope:** Technologies outside the supported 24 rules (React, Next.js, Vue, Nuxt, Angular, Svelte, jQuery, WordPress, WooCommerce, Shopify, Magento, Drupal, Bootstrap, Tailwind CSS, Google Analytics 4, Google Tag Manager, Cloudflare, AWS CloudFront, Vercel, Netlify, Webpack, Vite, PHP, Node.js) intentionally produce an empty scan result.
4. **Browser System Schemes:** System pages (`brave://`, `chrome://`, `edge://`, `about:blank`) cannot be profiled by browser security policy.
5. **Session Storage Invalidation on F5:** In accordance with Phase 9.7.3 lifecycle rules, reloading a tab clears the tab's scan association, requiring the user to click "Scan Website" to re-profile the newly reloaded page.

---

## 14. Phase 9.8 Audit Sign-Off Matrix

| Section | Audit Domain | Status | Auditor Initials | Sign-Off Date | Notes |
| :---: | :--- | :---: | :---: | :---: | :--- |
| **S1** | Manifest V3 & Permissions | PENDING | — | — | Least privilege; activeTab only |
| **S2** | Privacy Policy Accuracy | PENDING | — | — | Zero-transmission verification |
| **S3** | URL & Evidence Sanitization | PENDING | — | — | Bounded grammar `ver`, stripped `v` |
| **S4** | Zero Telemetry & Network Egress | PENDING | — | — | Zero fetch/XHR in production code |
| **S5** | Tab-State Lifecycle (D1–D4) | PENDING | — | — | Session storage & navigation guards |
| **S6** | History Persistence & Deletion | PENDING | — | — | 50-item LRU, synchronized purge |
| **S7** | JSON & CSV Export Pipelines | PENDING | — | — | RFC 4180, 11/13 columns, empty row |
| **S8** | Restricted Page Security Guards | PENDING | — | — | Scheme validation prior to injection |
| **S9** | Browser Error Page Handling | PENDING | — | — | Classified as PAGE_UNAVAILABLE |
| **S10** | Offline & Air-Gapped Operation | PENDING | — | — | 100% local detection & Blob downloads |
| **S11** | Build & Checkpoint Integrity | PENDING | — | — | 340 tests pass, `f5710e3` reproducible |
| **S12** | Brave vs. Chrome Boundaries | PENDING | — | — | Explicit Brave-validated boundary |
| **S13** | Known Limitations & Edge Cases | PENDING | — | — | Documented catalog and lifecycle rules |

---

## 15. Final Beta-Ready Release Verdict

```text
[ ] APPROVED FOR BETA DISTRIBUTION: All 15 manual tests (T1–T15) verified in Brave Browser; all 13 audit domains signed off.
[X] CONDITIONAL HOLD / DEFERRED: Scenario T7 validated (PASS); Scenarios T1–T6 and T8–T15 remain NOT RUN; final audit sign-offs pending completion of manual test suite.
[ ] RELEASE BLOCKED: Critical defect identified during Phase 9.8 audit.
```

**Lead Auditor:** ________________________________________  
**Date of Verdict:** ________________________  
**Release Disposition:** SiteStack is **NOT** declared beta-ready at this checkpoint. Beta readiness declaration is deferred until live manual execution of T1–T6 and T8–T15 in Brave Browser is completed and signed off.
