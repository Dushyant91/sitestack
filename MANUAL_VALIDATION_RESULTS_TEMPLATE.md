# SiteStack — Manual Validation Results Report & Audit Template

**Target Package:** SiteStack Release Candidate 1 (v1.0.0)  
**Build Directory:** [`D:\SiteStack\dist`](file:///D:/SiteStack/dist)  
**Git Commit Checkpoint:** [`4d75d69`](file:///D:/SiteStack)  
**Reference Checklist:** [`PHASE_9_1_MANUAL_TEST_CHECKLIST.md`](file:///D:/SiteStack/PHASE_9_1_MANUAL_TEST_CHECKLIST.md)  
**Audit Date:** November 16, 2026  
**Auditor / Lead Tester:** _______________________  
**Test Environment:**
- Operating System: _______________________
- Google Chrome Version: _______________________
- Browser Profile: [ ] Clean Profile  [ ] React DevTools Installed Profile

---

## Instructions for the Testing Auditor

1. Load the unpacked extension from `D:\SiteStack\dist` in `chrome://extensions/` with Developer Mode enabled.
2. Execute each of the 9 manual test scenarios described below.
3. Record the exact observed behavior, verify each expected checkpoint, and paste captured evidence (Evidence Drawer contents, exported JSON snippets, or screenshots).
4. Mark the outcome as **PASS**, **FAIL**, or **BLOCKED**.
5. Complete the Executive Sign-Off Table at the end of this document.

---

## Test Scenario 1: Single-Page Application (Next.js & React Inference)

- **Target URL:** `https://www.notion.com` or `https://react.dev`
- **Focus:** Verify Next.js detection, React inference with `INFERRED` badge, version extraction, Evidence Drawer clarity, and absence of false Vercel hosting.
- **Preconditions:** Extension loaded; active tab navigated to target URL and fully rendered.

### Execution Log
1. Navigate to target URL in an active tab.
2. Click the SiteStack icon in the Chrome toolbar.
3. Observe popup rendering, technology cards, confidence badges, and Evidence Drawer.

### Expected vs. Actual Checkpoints

| # | Checkpoint | Expected Result | Actual Observed Result | Status (PASS/FAIL) |
| :-: | :--- | :--- | :--- | :-: |
| 1.1 | **Popup Launch** | Popup opens smoothly (<100ms) with zero console errors. | | |
| 1.2 | **Next.js Detection** | **Next.js** detected at **High** confidence ($\ge 80\%$) with direct badge. | | |
| 1.3 | **React Inference** | **React** detected with **`INFERRED`** badge at **75% Medium** confidence (implied by Next.js). | | |
| 1.4 | **Evidence Drawer** | Expanding Next.js card shows exact signal paths (e.g. `window.__NEXT_DATA__`, `/_next/static/chunks/`). | | |
| 1.5 | **Vercel Safeguard** | **Vercel** is NOT detected (or remains strictly $\le 69\%$ Medium), confirming telemetry does not claim hosting. | | |
| 1.6 | **Version Transparency** | If version is not in production client bundle, UI displays clean explanation. | | |

### Harvested Evidence & Notes
```text
[Paste Evidence Drawer signals or JSON snippet here]
```
- **Scenario Verdict:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  
- **Auditor Notes:** __________________________________________________________________

---

## Test Scenario 2: Content Management & Ecommerce (WordPress & WooCommerce Core)

- **Target URL:** `https://woocommerce.com/store` (or any live WooCommerce store)
- **Focus:** Verify WooCommerce detection, core version prioritization (ignoring `wc-blocks` subpackages), and WordPress inference/direct detection.
- **Preconditions:** Active tab open on a live WooCommerce product or store page.

### Execution Log
1. Navigate to the store page and allow assets to finish loading.
2. Click the SiteStack toolbar icon.
3. Inspect WooCommerce card, extracted version, maturity tag, and WordPress detection.

### Expected vs. Actual Checkpoints

| # | Checkpoint | Expected Result | Actual Observed Result | Status (PASS/FAIL) |
| :-: | :--- | :--- | :--- | :-: |
| 2.1 | **WooCommerce Detection** | **WooCommerce** detected with **High** confidence ($\ge 80\%$). | | |
| 2.2 | **Core Version Prioritization** | Extracted version displays the WooCommerce core version (e.g. `7.x.x` or `8.x.x`), **not** subpackage `wc-blocks`. | | |
| 2.3 | **Development Tag Handling** | If a dev/nightly build is scanned (e.g. `11.4.0-dev.20261116`), complete tag is preserved and tagged `development`. | | |
| 2.4 | **WordPress Presence** | **WordPress** is identified (direct or inferred from WooCommerce) at $\ge 75\%$ confidence. | | |
| 2.5 | **jQuery / Ancillary Tech** | Ancillary libraries (e.g. jQuery, Stripe) detected cleanly if present. | | |

### Harvested Evidence & Notes
```text
[Paste WooCommerce & WordPress evidence snippets here]
```
- **Scenario Verdict:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  
- **Auditor Notes:** __________________________________________________________________

---

## Test Scenario 3: Infrastructure Telemetry Separation (Medium.com & Cloudflare)

- **Target URL:** `https://medium.com`
- **Focus:** Verify that client-side Cloudflare Web Analytics beacon is scored as Low confidence ($45\%$) and does not falsely claim Cloudflare hosting; verify no false React detection from browser extensions.
- **Preconditions:** Active tab open on Medium.com.

### Execution Log
1. Navigate to Medium.com.
2. Open SiteStack popup.
3. Inspect Cloudflare card and React card (if React DevTools extension is installed).

### Expected vs. Actual Checkpoints

| # | Checkpoint | Expected Result | Actual Observed Result | Status (PASS/FAIL) |
| :-: | :--- | :--- | :--- | :-: |
| 3.1 | **Analytics Tools** | **Google Analytics 4** and/or **Google Tag Manager** detected at High confidence. | | |
| 3.2 | **Cloudflare Score** | **Cloudflare** appears at **Low** confidence ($45\%$). | | |
| 3.3 | **Cloudflare Justification** | Cloudflare card displays educational reason: *"Observed Cloudflare Web Analytics beacon script indicates client-side telemetry..."* | | |
| 3.4 | **React DevTools Immunity** | If React DevTools is installed in Chrome, `__REACT_DEVTOOLS_GLOBAL_HOOK__` alone does **NOT** trigger React. | | |

### Harvested Evidence & Notes
```text
[Paste Cloudflare Evidence Drawer text here]
```
- **Scenario Verdict:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  
- **Auditor Notes:** __________________________________________________________________

---

## Test Scenario 4: Empty Scan / Non-Detectable Website (Google Search)

- **Target URL:** `https://www.google.com`
- **Focus:** Verify handling of websites with zero detectable technologies from the 24-technology catalog.
- **Preconditions:** Active tab open on Google Search homepage.

### Execution Log
1. Navigate to `https://www.google.com`.
2. Click SiteStack extension icon.
3. Observe UI empty state presentation and timing metrics.

### Expected vs. Actual Checkpoints

| # | Checkpoint | Expected Result | Actual Observed Result | Status (PASS/FAIL) |
| :-: | :--- | :--- | :--- | :-: |
| 4.1 | **Fast Execution** | Evaluation completes in <100ms (typically <5ms). | | |
| 4.2 | **Empty State UI** | Displays clean EmptyState: *"No recognized technologies detected from the current 24 supported technologies."* | | |
| 4.3 | **Zero Unhandled Errors** | No broken layout, no crash, no red console errors in extension popup. | | |
| 4.4 | **History Persistence** | Scan is cleanly saved to history as an empty scan record (`technologies: []`). | | |

### Harvested Evidence & Notes
```text
[Paste scanDurationMs and empty scan history entry here]
```
- **Scenario Verdict:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  
- **Auditor Notes:** __________________________________________________________________

---

## Test Scenario 5: Browser System Page Restriction Guard

- **Target URL:** `chrome://extensions/` or `about:blank`
- **Focus:** Verify security policy guards when invoked on restricted browser internal URLs.
- **Preconditions:** Active tab open on `chrome://extensions/`.

### Execution Log
1. With `chrome://extensions/` active, click the SiteStack extension icon.
2. Observe error presentation and script injection avoidance.

### Expected vs. Actual Checkpoints

| # | Checkpoint | Expected Result | Actual Observed Result | Status (PASS/FAIL) |
| :-: | :--- | :--- | :--- | :-: |
| 5.1 | **Injection Prevention** | Extension catches restricted URL before attempting code injection. | | |
| 5.2 | **Security Error Notice** | UI displays clean security notice: *"Browser internal and system pages cannot be analyzed by extension security policy."* | | |
| 5.3 | **Console Cleanliness** | No uncaught runtime exceptions in service worker or popup console. | | |

### Harvested Evidence & Notes
```text
[Record observed notice message and UI state here]
```
- **Scenario Verdict:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  
- **Auditor Notes:** __________________________________________________________________

---

## Test Scenario 6: Local History & Cache Management

- **Focus:** Verify `chrome.storage.local` caching, 50-item LRU retention, rescan de-duplication, and history deletion.
- **Preconditions:** Several websites scanned (e.g. Notion, WooCommerce, Medium, Google).

### Execution Log
1. Click the **History** icon (clock) in the popup header.
2. Verify recent scans are displayed in reverse-chronological order.
3. Click a past scan item to inspect cached details.
4. Rescan the same page within 60 seconds and observe de-duplication.
5. Click **Clear History** (or test deleting individual records).

### Expected vs. Actual Checkpoints

| # | Checkpoint | Expected Result | Actual Observed Result | Status (PASS/FAIL) |
| :-: | :--- | :--- | :--- | :-: |
| 6.1 | **Instant Loading** | Historical scans load immediately from local storage. | | |
| 6.2 | **LRU Bound Enforcement** | History retains a maximum of 50 items (`MAX_HISTORY_ITEMS = 50`). | | |
| 6.3 | **Rescan De-duplication** | Rescanning the same domain within 60s updates the top record without duplicating. | | |
| 6.4 | **Record Integrity** | Records preserve `scannedWebsite`, `timestamp`, `technologies`, and duration metrics. | | |
| 6.5 | **Purge Functionality** | Deleting single items or clicking **Clear History** wipes records from storage. | | |

### Harvested Evidence & Notes
```text
[Record history item count and storage verification here]
```
- **Scenario Verdict:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  
- **Auditor Notes:** __________________________________________________________________

---

## Test Scenario 7: Single-Scan JSON & CSV Export

- **Focus:** Verify single-scan export formats, RFC 4180 escaping, 11-column CSV schema, and dual URL fields.
- **Preconditions:** Active scan completed on a multi-technology website (e.g. WooCommerce store).

### Execution Log
1. On the scan results screen, click **Export** $\to$ **Download JSON**.
2. Click **Export** $\to$ **Download CSV**.
3. Open both downloaded files in a text editor or spreadsheet program (e.g. Excel).

### Expected vs. Actual Checkpoints

| # | Checkpoint | Expected Result | Actual Observed Result | Status (PASS/FAIL) |
| :-: | :--- | :--- | :--- | :-: |
| 7.1 | **JSON File Name** | File named `sitestack-[domain]-[YYYY-MM-DD].json`. | | |
| 7.2 | **JSON Field Schema** | Contains `scannedWebsite`, `technologyWebsite`, `versionMaturity`, `engineEvaluationDurationMs`. | | |
| 7.3 | **CSV File Name** | File named `sitestack-[domain]-[YYYY-MM-DD].csv`. | | |
| 7.4 | **CSV 11-Column Schema** | CSV has exactly 11 columns matching: `scannedWebsite, technology, category, version, confidenceScore, confidenceTier, detectionType, parentDependency, confidenceReason, evidenceSummary, technologyWebsite`. | | |
| 7.5 | **RFC 4180 Escaping** | All fields enclosed in double quotes; internal quotes properly escaped as `""`. | | |

### Harvested Evidence & Notes
```csv
[Paste top 2 rows of exported CSV here]
```
- **Scenario Verdict:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  
- **Auditor Notes:** __________________________________________________________________

---

## Test Scenario 8: Multi-Scan History Export (Normal + Empty Scans)

- **Focus:** Verify combined multi-scan exports, 13-column CSV schema, and dedicated empty-scan representation row.
- **Preconditions:** History contains both normal multi-technology scans (Notion, WooCommerce) and at least one empty scan (Google).

### Execution Log
1. Open the **History** modal.
2. Select multiple scans (including normal scans and the empty Google scan).
3. Click **Export Selected (CSV)** and **Export Selected (JSON)**.
4. Inspect the generated files.

### Expected vs. Actual Checkpoints

| # | Checkpoint | Expected Result | Actual Observed Result | Status (PASS/FAIL) |
| :-: | :--- | :--- | :--- | :-: |
| 8.1 | **Multi-Scan JSON** | JSON contains top-level `exportedAt`, `totalScans`, and array of scans. Empty scan preserves `"technologies": []`. | | |
| 8.2 | **CSV 13-Column Schema** | CSV headers match: `scannedWebsite, scanDate, url, technology, category, version, confidenceScore, confidenceTier, detectionType, parentDependency, confidenceReason, evidenceSummary, technologyWebsite`. | | |
| 8.3 | **Empty Scan Representation** | Empty scan emits exactly **one row** with `scannedWebsite`, `scanDate`, `url`, and 10 empty technology fields (13 columns total). | | |
| 8.4 | **Row Separation** | Normal technology rows remain intact with correct column alignment. | | |

### Harvested Evidence & Notes
```csv
[Paste empty scan CSV row and normal tech row here]
```
- **Scenario Verdict:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  
- **Auditor Notes:** __________________________________________________________________

---

## Test Scenario 9: Complete Offline / Air-Gapped Verification

- **Focus:** Verify that SiteStack operates with 100% functionality and zero errors when completely disconnected from the internet.
- **Preconditions:** Device Wi-Fi / Ethernet disabled (Air-gapped mode). A locally saved HTML file or cached webpage open in Chrome.

### Execution Log
1. Disconnect network connection (Airplane Mode or disable network adapter).
2. Open Chrome and navigate to a locally stored test HTML page or cached page.
3. Click the SiteStack icon.
4. Observe popup behavior and DevTools Network tab.

### Expected vs. Actual Checkpoints

| # | Checkpoint | Expected Result | Actual Observed Result | Status (PASS/FAIL) |
| :-: | :--- | :--- | :--- | :-: |
| 9.1 | **Offline Popup Render** | Popup renders completely without layout breaks or missing UI elements. | | |
| 9.2 | **System Font Fallback** | Typography seamlessly falls back to system fonts (`-apple-system`, `sans-serif`). | | |
| 9.3 | **Zero Failed Requests** | DevTools Network tab records zero failed remote network requests. | | |
| 9.4 | **Detection & Export** | Technology evaluation and JSON/CSV downloads function identically offline. | | |

### Harvested Evidence & Notes
```text
[Record offline behavior observations here]
```
- **Scenario Verdict:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  
- **Auditor Notes:** __________________________________________________________________

---

## Executive Sign-Off & Verification Summary

| Test Case | Scenario Description | Expected Outcome | Actual Outcome (PASS / FAIL) | Tester Initials | Date |
| :---: | :--- | :--- | :---: | :---: | :---: |
| **T1** | Single-Page App (Notion / react.dev) | Next.js High, React Inferred 75%, No false Vercel | | | |
| **T2** | CMS & Ecommerce (WooCommerce / WordPress) | WooCommerce High, Core script prioritized, WP detected | | | |
| **T3** | Telemetry Separation (Medium / Cloudflare) | Cloudflare Low 45% with educational note, GA4 High | | | |
| **T4** | Empty Scan (Google Search) | Clean empty state, <100ms latency, zero crashes | | | |
| **T5** | Browser System Page Guard (`chrome://`) | Safe restriction notice, zero code injection | | | |
| **T6** | Local History & Cache Management | 50-item LRU, 60s de-duplication, quota recovery | | | |
| **T7** | Single-Scan JSON & CSV Export | 11 columns, RFC 4180 escaping, dual URL semantics | | | |
| **T8** | Multi-Scan CSV Export | 13 columns, dedicated empty scan row | | | |
| **T9** | Offline & Air-Gapped Verification | 100% functionality offline, zero network requests | | |

---

### Final Release Candidate Verdict

[ ] **APPROVED FOR BETA DISTRIBUTION:** All 9 manual test scenarios passed with zero critical or high-severity defects.  
[ ] **CONDITIONAL APPROVAL:** Minor cosmetic issues noted; acceptable for closed beta.  
[ ] **REJECTED / BLOCKED:** Critical defect detected; requires code modification before release.

**Lead Auditor Signature:** ________________________________________  
**Date:** ________________________  
**Sign-Off Comments:** __________________________________________________________________
