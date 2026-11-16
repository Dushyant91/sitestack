# SiteStack Phase 9.7 — Brave Browser Manual Validation Protocol & Execution Report

**Document Purpose:** Manual Validation Protocol & Execution Tracking for SiteStack Release Candidate  
**Primary Execution Environment:** Brave Browser (Chromium Engine)  
**Build Directory:** [`D:\SiteStack\dist`](file:///D:/SiteStack/dist)  
**Release Candidate Commit Checkpoint:** [`f5710e3`](file:///D:/SiteStack) (`fix(extension): harden tab-state lifecycle, session storage, and navigation guards`)  
**Extension Version:** `1.0.0` (Manifest V3)  
**Creation / Update Date:** November 16, 2026  
**Execution Status:** **PARTIAL** (Scenarios T7, T8, T9 Validated: **PASS** [User-Confirmed in Brave]; Scenario T6: **PENDING MANUAL RE-TEST**; Scenarios T1–T5 and T10–T15 remain **NOT RUN**)  
**Automated Test Suite:** 340/340 passed across 24 test files  
**TypeScript Compilation:** Passed (`tsc -b` zero errors)  
**Production Build:** Passed (`npm run build` verified in [`dist/`](file:///D:/SiteStack/dist))

---

## Executive Summary & Auditor Notice

Phase 9.6.4 established strict privacy hardening at commit `dc668e5`, followed by Phase 9.7 browser error page misclassification remediation at commit `09c892e`, and Phase 9.7.3 tab-state lifecycle hardening at commit [`f5710e3`](file:///D:/SiteStack). The automated suite contains 340 passing tests across 24 test files with zero TypeScript errors.

### Mandatory Auditor Notice: Brave Browser Validation Scope
1. **Primary Validation Target:** In accordance with workstation availability (where Brave Browser is the user's sole installed browser), **Brave Browser** is designated as the primary manual validation environment for Phase 9.7.
2. **Explicit Disclaimer — No Claim of Chrome Manual Verification:** All test results, observations, and verifications recorded in this document are strictly **Brave-validated**. Because Google Chrome is not installed on this workstation, **Google Chrome compatibility has NOT been manually verified** and must not be claimed as manually verified.
3. **Chromium Engine Baseline:** Because Brave is built on the Chromium engine (Manifest V3, `chrome.scripting`, `chrome.storage`, `activeTab`), extension core APIs function identically, subject to Brave-specific privacy features (Brave Shields).
4. **Brave Shields Impact Assessment:** Brave features built-in network and tracker blocking ("Brave Shields"). Where Brave Shields blocks third-party scripts (e.g., Google Analytics, Tag Manager, Cloudflare Web Analytics), detection results may vary. Each relevant test scenario includes a mandatory **Brave Shields Status** field (`Enabled` vs. `Disabled`).
5. **Strict No-Auto-Scan Constraint:** All tests verify that scanning is 100% user-triggered. Opening unscanned tabs must show "Ready to Scan", and the extension must never initiate background scans.
6. **Execution Status:** Scenarios T7, T8, and T9 have been physically executed and verified in Brave Browser (**PASS**). Scenario T6 (browser error page handling) was addressed at commit `09c892e` and remains **`PENDING MANUAL RE-TEST`**. Scenarios T1–T5 and T10–T15 remain marked **`NOT RUN`** pending physical execution by the user/auditor in Brave Browser.

---

## 1. Setup Instructions: Loading Unpacked Extension in Brave Browser

To execute the manual validation suite in Brave Browser:

### Step 1: Verify the Production Build
Confirm that the latest production bundle is compiled and up to date in [`D:\SiteStack\dist`](file:///D:/SiteStack/dist):
```bash
npx tsc -b
npm run build
```
Verify that `dist/manifest.json`, `dist/service-worker.js`, `dist/isolated-probe.js`, `dist/main-probe.js`, and `dist/popup/` exist and match commit `f5710e3`.

### Step 2: Open Brave Extension Management & Record Version
1. Launch **Brave Browser**.
2. Open a new tab and navigate to:
   ```text
   brave://version/
   ```
3. Record the exact versions:
   - **Brave Version:** (e.g., `1.73.x` or similar)
   - **Chromium Version:** (e.g., `131.0.6778.x` or similar)
   - **OS Version:** Windows 10 / Windows 11
4. Navigate to the extension manager:
   ```text
   brave://extensions/
   ```
5. Enable the **Developer mode** toggle in the top-right corner.

### Step 3: Load Unpacked Extension
1. Click the **Load unpacked** button in the top toolbar.
2. In the folder picker dialog, select the absolute build directory:
   ```text
   D:\SiteStack\dist
   ```
3. Confirm that **SiteStack — Technology Stack Profiler** appears in the extensions list:
   - **Name:** SiteStack — Technology Stack Profiler
   - **Version:** `1.0.0`
   - **ID:** Assigned by Brave/Chromium (e.g., `abcdefghijklmnop...`)
   - **Permissions:** `activeTab`, `scripting`, `storage`
   - **Errors:** Zero errors indicated (the "Errors" button should not appear or should show 0 errors).

### Step 4: Pin SiteStack to the Brave Toolbar
Click the **Extensions puzzle icon** in the Brave address bar / toolbar and click the **Pin** icon next to SiteStack for single-click popup access.

### Step 5: Brave Shields Awareness & Toggle Procedure
Brave Shields blocks third-party trackers, ad scripts, and fingerprinting by default:
- To inspect Shields for an active tab: Click the **Brave lion icon** in the address bar.
- To test with Shields **Enabled** (Default): Leave Shields toggled ON (Standard tracking & ad blocking).
- To test with Shields **Disabled** (Permissive): Toggle Shields OFF for that domain if inspecting third-party analytics/telemetry scripts (e.g., Google Analytics 4, Cloudflare Web Analytics beacons) that Brave Shields normally blocks at the network level.
- Always record the Shields setting used in the corresponding test scenario.

---

## 2. User-Triggered Scanning Architecture Constraints

Auditors must verify that SiteStack strictly adheres to its privacy-first, on-demand scanning model:
1. **Zero Background Scanning:** The extension must **never** scan any tab in the background without user interaction.
2. **Unscanned Tab Zero-State:** Switching to an unscanned tab and opening the popup must display the initial **Ready to Scan** state with the target domain.
3. **Scan State Isolation:** Switching to a previously scanned tab must show that specific tab's cached result without contaminating or overriding other tabs.
4. **Navigation Invalidation:** Navigating within a tab must invalidate prior results or display an updated URL indicator, never claiming old signals represent new URLs.
5. **No Automatic Rescan:** Navigation or tab switching must never silently initiate an automatic re-scan.

---

## 3. Detailed T1–T15 Manual Testing Checklist (Brave-Validated)

---

### Test Case T1: First Scan & Technology Detection (Single-Page App — Next.js & React Inference)

- **Target Website:** `https://react.dev` (or `https://www.notion.com`)
- **Objective:** Verify user-triggered initial scan in Brave, Next.js direct detection, React inference with `INFERRED` badge, Vercel telemetry safeguard, and Evidence Drawer inspection.
- **Preconditions:** Extension loaded from `D:\SiteStack\dist`; target website open and fully loaded in active Brave tab.
- **Brave Shields Status:** `[ ] Enabled (Default)    [ ] Disabled`

#### Execution Steps
1. In Brave, navigate to `https://react.dev`.
2. Click the SiteStack icon in the Brave toolbar.
3. Observe popup loading state and final rendering.
4. Expand the detected technology cards in the popup.

#### Expected Checkpoints
| # | Checkpoint | Expected Behavior | Status |
| :-: | :--- | :--- | :---: |
| T1.1 | **Popup Open Latency** | Popup opens smoothly (<100ms) with zero layout shifts or console errors. | `NOT RUN` |
| T1.2 | **Next.js / Framework Detection** | Target framework detected at **High** confidence ($\ge 80\%$) with `direct` badge. | `NOT RUN` |
| T1.3 | **React Architectural Inference** | If Next.js is detected, React displays the **`INFERRED`** badge at **75% Medium** confidence with explanation citing Next.js dependency. | `NOT RUN` |
| T1.4 | **Evidence Drawer Inspection** | Expanding a card displays source signals (e.g., `window.__NEXT_DATA__`, `/_next/static/chunks/`). | `NOT RUN` |
| T1.5 | **Vercel Telemetry Separation** | Vercel is NOT detected as hosting, or remains strictly $\le 69\%$ Medium confidence if telemetry scripts (`/_vercel/insights/`) are present. | `NOT RUN` |
| T1.6 | **Version Transparency** | Extracted version displays cleanly with appropriate maturity badge (`stable` or clean fallback). | `NOT RUN` |

- **Brave-Validated Evidence Required:** Screenshot of popup with expanded card; exported JSON snippet.
- **Execution Status:** **NOT RUN**

---

### Test Case T2: Repeated Scan & Cache Refresh (WooCommerce Store — Core Prioritization)

- **Target Website:** `https://woocommerce.com/store` (or any live WooCommerce store)
- **Objective:** Verify repeated scan ("Re-scan" button), WooCommerce Core version prioritization over subpackages, WordPress detection, and history de-duplication within 60 seconds.
- **Preconditions:** Live WooCommerce store page open in active Brave tab.
- **Brave Shields Status:** `[ ] Enabled (Default)    [ ] Disabled`

#### Execution Steps
1. Navigate to store page and click SiteStack icon in Brave toolbar.
2. Note the initial detection results and timestamp.
3. Wait 10 seconds, then click the **Re-scan** button.
4. Open the History modal (clock icon) to check de-duplication.

#### Expected Checkpoints
| # | Checkpoint | Expected Behavior | Status |
| :-: | :--- | :--- | :---: |
| T2.1 | **WooCommerce Detection** | WooCommerce detected at **High** confidence ($\ge 80\%$). | `NOT RUN` |
| T2.2 | **Core Version Prioritization** | Extracted version reflects core WooCommerce version (e.g. `7.x.x` / `8.x.x`), ignoring `wc-blocks` subpackage versions. | `NOT RUN` |
| T2.3 | **WordPress Co-Detection** | WordPress detected (direct or inferred from WooCommerce) at $\ge 75\%$ confidence. | `NOT RUN` |
| T2.4 | **Re-scan Execution** | Clicking Re-scan triggers a fresh probe; radar animation displays briefly (<100ms); timestamp updates. | `NOT RUN` |
| T2.5 | **60-Second De-Duplication** | In the History modal, repeated scans of the same domain within 60s update the existing entry without duplicating. | `NOT RUN` |

- **Brave-Validated Evidence Required:** Screenshot showing updated timestamp; History modal showing single entry.
- **Execution Status:** **NOT RUN**

---

### Test Case T3: Confidence Calibration & Educational Notes (Medium.com & Cloudflare)

- **Target Website:** `https://medium.com`
- **Objective:** Verify client-side Cloudflare Web Analytics beacon is scored as Low confidence ($45\%$) with educational explanation; verify React DevTools extension noise floor immunity.
- **Preconditions:** Active Brave tab on Medium.com. Note: If Brave Shields is Enabled, third-party beacons (`challenges.cloudflare.com`, `beacon.min.js`) may be blocked by Brave's network filter. Test with Shields Enabled, then optionally test with Shields Disabled to verify beacon detection.
- **Brave Shields Status:** `[ ] Enabled (Default)    [ ] Disabled`

#### Execution Steps
1. Navigate to `https://medium.com`.
2. Open SiteStack popup in Brave.
3. Inspect Cloudflare card and React card (if React DevTools extension is installed in Brave).
4. If Cloudflare beacon was blocked by Brave Shields, toggle Shields OFF for medium.com, reload page, and re-scan.

#### Expected Checkpoints
| # | Checkpoint | Expected Behavior | Status |
| :-: | :--- | :--- | :---: |
| T3.1 | **Analytics Detection** | Google Analytics 4 / Google Tag Manager detected at High confidence (if unblocked by Shields). | `NOT RUN` |
| T3.2 | **Cloudflare Score** | If beacon is present, Cloudflare displays **Low** confidence ($45\%$). | `NOT RUN` |
| T3.3 | **Educational Reason** | Cloudflare card displays educational notice: *"Observed Cloudflare Web Analytics beacon script indicates client-side telemetry..."* | `NOT RUN` |
| T3.4 | **React DevTools Immunity** | `window.__REACT_DEVTOOLS_GLOBAL_HOOK__` alone from extensions does **NOT** trigger a false React detection. | `NOT RUN` |

- **Brave-Validated Evidence Required:** Screenshot of Cloudflare card with educational justification note; recorded Brave Shields status.
- **Execution Status:** **NOT RUN**

---

### Test Case T4: Empty Scan / Non-Detectable Website (Google Search Homepage)

- **Target Website:** `https://www.google.com`
- **Objective:** Verify clean handling of websites with zero detectable technologies from the 24-technology catalog.
- **Preconditions:** Active Brave tab open on Google Search homepage.
- **Brave Shields Status:** `[ ] Enabled (Default)    [ ] Disabled`

#### Execution Steps
1. Navigate to `https://www.google.com` in Brave.
2. Click SiteStack extension icon.
3. Observe empty state presentation and latency metrics.

#### Expected Checkpoints
| # | Checkpoint | Expected Behavior | Status |
| :-: | :--- | :--- | :---: |
| T4.1 | **Execution Latency** | Evaluation completes in <100ms (typically <10ms). | `NOT RUN` |
| T4.2 | **Empty State UI** | Displays clean EmptyState: *"No recognized technologies detected from the current 24 supported technologies."* | `NOT RUN` |
| T4.3 | **Console Cleanliness** | Zero unhandled exceptions or console errors in popup or background worker. | `NOT RUN` |
| T4.4 | **Empty History Record** | Stored in history as a valid record with `"technologies": []`. | `NOT RUN` |

- **Brave-Validated Evidence Required:** Screenshot of EmptyState UI; scan duration reading.
- **Execution Status:** **NOT RUN**

---

### Test Case T5: Restricted Browser Page Guard (`brave://extensions/` or `about:blank`)

- **Target Website:** `brave://extensions/` (or `chrome://extensions/`)
- **Objective:** Verify security policy guards when invoked on restricted browser internal URLs in Brave.
- **Preconditions:** Active Brave tab open on `brave://extensions/`.
- **Brave Shields Status:** N/A (Internal Browser Scheme)

#### Execution Steps
1. With `brave://extensions/` active, click the SiteStack extension icon in Brave.
2. Observe error presentation and script injection avoidance.

#### Expected Checkpoints
| # | Checkpoint | Expected Behavior | Status |
| :-: | :--- | :--- | :---: |
| T5.1 | **Pre-Injection Guard** | Extension intercepts restricted `brave://` scheme before attempting script injection (`validateScannableUrl`). | `NOT RUN` |
| T5.2 | **Security Error Notice** | UI displays clean **Restricted Page** notice with `ShieldAlert` icon: *"Browser internal and system pages cannot be analyzed by extension security policy."* | `NOT RUN` |
| T5.3 | **Zero Uncaught Exceptions** | Popup console and background service worker log zero uncaught runtime errors. | `NOT RUN` |
| T5.4 | **Bypasses History** | Restricted page is NOT saved to Chrome/Brave local storage history. | `NOT RUN` |

- **Brave-Validated Evidence Required:** Screenshot of security notice; DevTools console output showing 0 uncaught errors.
- **Execution Status:** **NOT RUN**

---

### Test Case T6: Browser Error Page & Unreachable Domain Handling (`brave-error://` / `chrome-error://`)

- **Target Website:** Non-existent domain (e.g. `http://this-domain-does-not-exist-sitestack-test.org`)
- **Objective:** Verify that browser-generated connection error pages (DNS resolution failure `ERR_NAME_NOT_RESOLVED` or `DNS_PROBE_FINISHED_NXDOMAIN`) are correctly classified as `PAGE_UNAVAILABLE` rather than misleading empty scans, and are NOT saved to history.
- **Preconditions:** Active Brave tab navigated to non-existent domain displaying Brave's network error page.
- **Brave Shields Status:** N/A (Network Connection Failure)

#### Execution Steps
1. In Brave, navigate to `http://this-domain-does-not-exist-sitestack-test.org`.
2. Wait for Brave network error page (`ERR_NAME_NOT_RESOLVED` or `DNS_PROBE_FINISHED_NXDOMAIN`).
3. Click SiteStack extension icon.
4. Open the History modal (clock icon) to verify whether the error page was saved.

#### Verification Status & Checkpoints
| # | Checkpoint | Expected Behavior | Status |
| :-: | :--- | :--- | :---: |
| T6.1 | **Error Interception** | Service worker catches `chrome-error://` / `brave-error://` frame injection or probe flags error document. | `PENDING RE-TEST` |
| T6.2 | **Page Unavailable State** | Popup displays **Page Unavailable** with amber tint, `WifiOff` icon, helpful explanation, and "Retry Inspection" button. | `PENDING RE-TEST` |
| T6.3 | **No Misleading Empty Scan** | Does **NOT** display *"Scan completed successfully. No supported technologies were detected."* | `PENDING RE-TEST` |
| T6.4 | **History Exclusion** | Dead/error page is **NOT** persisted to local scan history. | `PENDING RE-TEST` |
| T6.5 | **Graceful Recovery** | Navigating to a live webpage allows normal scanning without needing to restart the extension. | `PENDING RE-TEST` |

- **Brave-Validated Evidence Status:** Original finding confirmed error page misclassified as empty scan. Remediation committed at [`09c892e`](file:///D:/SiteStack) (with 15 passing automated unit tests in `tests/extension/phase9-7-browser-error-pages.test.ts`). Live manual re-test in Brave pending.
- **Execution Status:** **PENDING MANUAL RE-TEST**

---

### Test Case T7: Tab Switching — Unscanned Tab State (`Ready to Scan`) & Tab Lifecycle Hardening

- **Target Website:** Open a new Brave tab navigated to `https://en.wikipedia.org` or `https://x.com/home` (unscanned)
- **Objective:** Verify that opening the popup on an unscanned tab displays the user-triggered **Ready to Scan** zero-state (with Sparkles icon, domain title, and primary "Scan Website" button), never auto-scans, preserves strict tab isolation, and immediately invalidates active results on reload, history clearing, or navigation.
- **Preconditions:** Extension loaded from [`D:\SiteStack\dist`](file:///D:/SiteStack/dist) (commit `f5710e3`); new tab open on unscanned site.
- **Brave Shields Status:** `[X] Enabled (Default)    [ ] Disabled`

#### Execution Steps
1. Open a new Brave tab to `https://en.wikipedia.org/wiki/Main_Page` or `https://x.com/home` (do not click SiteStack yet).
2. Click SiteStack icon in the Brave toolbar.
3. Observe initial state before initiating a scan.
4. Click the primary **Scan Website** button (or **Scan** in header) and observe scan completion.
5. In the same tab, press F5 (reload): verify the popup immediately resets to **Ready to Scan**.
6. Scan again, open the **History** modal, verify history persistence, then clear history: verify the popup immediately resets to **Ready to Scan**.
7. Open Tab A and Tab B, verify two-tab scan isolation without state bleeding.
8. Verify in-flight navigation during active scan discards association (D3 guard), and rapid rescanning sequences correctly (D4 guard).

#### Confirmed Manual Checkpoints (Phase 9.7.3 / T7 Execution)
| # | Checkpoint | Expected Behavior | Status |
| :-: | :--- | :--- | :---: |
| T7.1 | **Fresh tab shows Ready to Scan** | Opening popup on an unscanned tab displays "Ready to Scan" zero-state with Sparkles icon and "Scan Website" button. Zero auto-scan. | **PASS** |
| T7.2 | **Explicit scan works** | Clicking "Scan Website" triggers scan, runs radar animation, and correctly populates detected technologies. | **PASS** |
| T7.3 | **Same-URL reload invalidates results** | Reloading active tab (F5 / Refresh) invalidates session association (`status === 'loading'`) and resets popup to "Ready to Scan". | **PASS** |
| T7.4 | **History remains persistent** | Scans persist across popup sessions and service worker restarts in `chrome.storage.local`. | **PASS** |
| T7.5 | **Clear History resets active state** | Clearing history or deleting the active scan record immediately resets active tab state to "Ready to Scan". | **PASS** |
| T7.6 | **Two-tab isolation** | Scanning Tab A and Tab B maintains independent state; switching tabs displays each tab's own results without bleed. | **PASS** |
| T7.7 | **Navigation during scanning** | Navigating active tab while probe is in flight safely discards stale tab association (`chrome.tabs.get` live URL verification). | **PASS** |
| T7.8 | **Rapid rescanning** | Rapidly clicking rescan sequences requests via `latestRequestIdRef`, preventing older delayed responses from overwriting newer results. | **PASS** |

- **Brave-Validated Evidence Recorded:** Verified in Brave Browser (`f5710e3`); zero auto-scans observed; clean transitions between "Ready to Scan" and evaluated states.
- **Execution Status:** **PASS**

---

### Test Case T8: Tab Switching — Previously Scanned Tab State Retention

- **Target Websites:** Tab A (`https://react.dev`), Tab B (`https://woocommerce.com/store`)
- **Objective:** Verify tab state isolation: switching between previously scanned tabs in Brave renders the appropriate scan state for each tab without cross-tab contamination.
- **Preconditions:** Both tabs open in the same Brave window.
- **Brave Shields Status:** `[X] Enabled (Default)    [ ] Disabled`

#### Execution Steps
1. Scan Tab A (`react.dev`); note results.
2. Switch to Tab B (`woocommerce.com`) and scan; note results.
3. Switch back to Tab A and click SiteStack icon.
4. Switch back to Tab B and click SiteStack icon.

#### Confirmed Manual Checkpoints (User-Confirmed in Brave)
| # | Checkpoint | Expected Behavior | Status |
| :-: | :--- | :--- | :---: |
| T8.1 | **Tab A State Fidelity** | Popup on Tab A immediately displays `react.dev` results (React/Next.js). | **PASS** |
| T8.2 | **Tab B State Fidelity** | Popup on Tab B immediately displays `woocommerce.com` results (WooCommerce/WordPress). | **PASS** |
| T8.3 | **Zero State Bleed** | Neither tab displays technologies or URLs from the other tab. Complete tab isolation verified. | **PASS** |

- **Brave-Validated Evidence Recorded:** User manually confirmed successful behavior in Brave. Switching between tabs renders the correct tab-specific state without state bleed.
- **Execution Status:** **PASS**

---

### Test Case T9: URL Navigation & Stale Results Invalidation

- **Target Website:** `https://github.com/explore` $\to$ `https://github.com/trending`
- **Objective:** Verify that navigating within an existing tab invalidates prior scan results or displays an updated URL indicator, never claiming old signals represent new URLs.
- **Preconditions:** Brave tab open on initial URL.
- **Brave Shields Status:** `[X] Enabled (Default)    [ ] Disabled`

#### Execution Steps
1. Scan `https://github.com/explore` in Brave.
2. In the same tab, navigate to `https://github.com/trending`.
3. Open SiteStack popup.
4. Open the History modal to verify that previous scan records remain accessible.

#### Confirmed Manual Checkpoints (User-Confirmed with Screenshots in Brave)
| # | Checkpoint | Expected Behavior | Status |
| :-: | :--- | :--- | :---: |
| T9.1 | **URL Synchronization** | Header reflects current URL/domain (`github.com`), not prior tab path. | **PASS** |
| T9.2 | **Stale Invalidation / Ready to Scan** | Navigating to `github.com/explore` and `github.com/trending` displays "Ready to Scan" zero-state. | **PASS** |
| T9.3 | **History Availability / No Stale Bleed** | Previous GitHub history record remains available in history modal without stale result leaking into active unscanned tab. | **PASS** |
| T9.4 | **No Silent Background Rescan** | Navigation event does not trigger automated background scans before popup is opened. | **PASS** |

- **Brave-Validated Evidence Recorded:** User supplied screenshot evidence showing `github.com/explore` displaying Ready to Scan, `github.com/trending` displaying Ready to Scan, previous GitHub history record remaining available in history, and no stale scan result incorrectly appearing on either page.
- **Execution Status:** **PASS**

---

### Test Case T10: Local History Persistence, Inspection & Deletion

- **Objective:** Verify `chrome.storage.local` caching in Brave, 50-item LRU retention, history inspection, single-item deletion, and "Clear History" purge.
- **Preconditions:** At least 4 distinct websites scanned in Brave (e.g. React.dev, WooCommerce, Medium, Google).
- **Brave Shields Status:** N/A (Storage Operation)

#### Execution Steps
1. Click the **History** icon (clock) in the SiteStack popup header.
2. Verify recent scans are displayed in reverse-chronological order.
3. Click a past scan item to inspect cached details.
4. Delete an individual scan item using the trash/delete action.
5. Click **Clear History** and confirm.

#### Expected Checkpoints
| # | Checkpoint | Expected Behavior | Status |
| :-: | :--- | :--- | :---: |
| T10.1 | **Instant Loading** | Historical scans load immediately from local storage with zero delay. | `NOT RUN` |
| T10.2 | **LRU Bound Enforcement** | History retains a maximum of 50 items (`MAX_HISTORY_ITEMS = 50`). | `NOT RUN` |
| T10.3 | **Inspection Fidelity** | Clicking a history record displays its full technology list and confidence badges. | `NOT RUN` |
| T10.4 | **Single Item Deletion** | Deleting an item removes it from the list and immediately persists deletion to storage. | `NOT RUN` |
| T10.5 | **Clear History Purge** | Clicking Clear History purges all stored records; modal displays empty state. | `NOT RUN` |

- **Brave-Validated Evidence Required:** Screenshot of History modal with items; screenshot after Clear History.
- **Execution Status:** **NOT RUN**

---

### Test Case T11: Single-Scan JSON & CSV Export (Data Integrity & Escaping)

- **Target Website:** Multi-technology scan (e.g. WooCommerce store)
- **Objective:** Verify single-scan export generation in Brave, RFC 4180 escaping, 11-column CSV schema, dual URL semantics, and privacy parameter stripping (`SAFE_VERSION_PATTERN`).
- **Preconditions:** Active scan completed on a multi-technology website in Brave.
- **Brave Shields Status:** `[ ] Enabled (Default)    [ ] Disabled`

#### Execution Steps
1. On the scan results screen, click **Export** $\to$ **Download JSON**.
2. Click **Export** $\to$ **Download CSV**.
3. Open both downloaded files in a text editor or spreadsheet program.

#### Expected Checkpoints
| # | Checkpoint | Expected Behavior | Status |
| :-: | :--- | :--- | :---: |
| T11.1 | **File Naming Convention** | Files named `sitestack-[domain]-[YYYY-MM-DD].json` and `.csv`. | `NOT RUN` |
| T11.2 | **JSON Field Schema** | Contains `scannedWebsite`, `technologyWebsite`, `versionMaturity`, `engineEvaluationDurationMs`. | `NOT RUN` |
| T11.3 | **CSV 11-Column Schema** | Headers match: `scannedWebsite,technology,category,version,confidenceScore,confidenceTier,detectionType,parentDependency,confidenceReason,evidenceSummary,technologyWebsite`. | `NOT RUN` |
| T11.4 | **RFC 4180 Escaping** | All fields enclosed in double quotes; inner quotes escaped as `""`. | `NOT RUN` |
| T11.5 | **Zero Parameter Leakage** | Evidence summary contains zero sensitive query parameters (`token`, `session_id`, `utm_*`, `v`). Only safe versions (`SAFE_VERSION_PATTERN`) are preserved in `ver`. | `NOT RUN` |

- **Brave-Validated Evidence Required:** Exported `.json` file and `.csv` file; header verification snippet.
- **Execution Status:** **NOT RUN**

---

### Test Case T12: Multi-Scan History Export (Normal + Empty Scans)

- **Objective:** Verify combined multi-scan exports in Brave, 13-column CSV schema, and dedicated empty-scan representation row.
- **Preconditions:** Brave local history contains both normal multi-technology scans and at least one empty scan (Google).
- **Brave Shields Status:** N/A (Storage Export)

#### Execution Steps
1. Open the **History** modal in the SiteStack popup.
2. Select multiple scans (including normal scans and the empty scan).
3. Click **Export Selected (CSV)** and **Export Selected (JSON)**.
4. Inspect the generated files.

#### Expected Checkpoints
| # | Checkpoint | Expected Behavior | Status |
| :-: | :--- | :--- | :---: |
| T12.1 | **Multi-Scan JSON Schema** | JSON contains top-level `exportedAt`, `totalScans`, and array of scans. Empty scan preserves `"technologies": []`. | `NOT RUN` |
| T12.2 | **CSV 13-Column Schema** | Headers match: `scannedWebsite,scanDate,url,technology,category,version,confidenceScore,confidenceTier,detectionType,parentDependency,confidenceReason,evidenceSummary,technologyWebsite`. | `NOT RUN` |
| T12.3 | **Empty Scan Representation** | Empty scan emits exactly **one row** with `scannedWebsite`, `scanDate`, `url`, and 10 empty technology fields (13 columns total). | `NOT RUN` |
| T12.4 | **Column Alignment** | Normal technology rows remain intact with correct column alignment across spreadsheets. | `NOT RUN` |

- **Brave-Validated Evidence Required:** Exported multi-scan CSV file snippet showing both empty scan row and normal technology row.
- **Execution Status:** **NOT RUN**

---

### Test Case T13: Offline Scanning of Already Loaded Webpage (Air-Gapped Operation)

- **Target Website:** Previously loaded page (e.g. `https://react.dev`)
- **Objective:** Verify 100% functional technology detection in Brave when the device is completely disconnected from the internet.
- **Preconditions:** Webpage loaded in Brave; device Wi-Fi / Ethernet disabled (Airplane Mode).
- **Brave Shields Status:** `[ ] Enabled (Default)    [ ] Disabled`

#### Execution Steps
1. Navigate to `https://react.dev` in Brave while online; wait for page to render.
2. Disconnect internet connection (enable Airplane Mode).
3. Open Brave DevTools (F12) $\to$ Network tab.
4. Click SiteStack icon and trigger scan.

#### Expected Checkpoints
| # | Checkpoint | Expected Behavior | Status |
| :-: | :--- | :--- | :---: |
| T13.1 | **Offline Popup Render** | Popup renders completely without layout breaks or missing UI elements. | `NOT RUN` |
| T13.2 | **System Font Fallback** | Typography seamlessly falls back to system fonts (`-apple-system`, `sans-serif`) without network requests. | `NOT RUN` |
| T13.3 | **Zero Failed Requests** | DevTools Network tab records zero failed remote network requests or background pings. | `NOT RUN` |
| T13.4 | **Accurate Detection** | Technology detection executes identically offline from in-memory DOM, globals, and resources. | `NOT RUN` |

- **Brave-Validated Evidence Required:** Screenshot of offline popup render; DevTools Network tab showing 0 requests.
- **Execution Status:** **NOT RUN**

---

### Test Case T14: Offline Browser Error Page (`ERR_INTERNET_DISCONNECTED`)

- **Target Website:** Uncached URL while offline (e.g. `http://example-offline-test.com`)
- **Objective:** Verify extension behavior when invoked on Brave's offline connection error page (`ERR_INTERNET_DISCONNECTED`).
- **Preconditions:** Device offline; active Brave tab displaying network error screen.
- **Brave Shields Status:** N/A (Offline State)

#### Execution Steps
1. While offline, navigate to an uncached URL in Brave to produce the offline error page (`ERR_INTERNET_DISCONNECTED`).
2. Click SiteStack extension icon.

#### Expected Checkpoints
| # | Checkpoint | Expected Behavior | Status |
| :-: | :--- | :--- | :---: |
| T14.1 | **Error Page Detection** | Extension intercepts the error document without crashing. | `NOT RUN` |
| T14.2 | **Page Unavailable Display** | Displays **Page Unavailable** (`WifiOff` icon) rather than a false empty scan. | `NOT RUN` |
| T14.3 | **Zero Console Exceptions** | Popup console records zero unhandled promise rejections. | `NOT RUN` |
| T14.4 | **Not Saved to History** | Error page is not saved to history. | `NOT RUN` |

- **Brave-Validated Evidence Required:** Screenshot of popup on offline error page; console log.
- **Execution Status:** **NOT RUN**

---

### Test Case T15: Offline History Inspection & Offline Exports

- **Objective:** Verify local history browsing and JSON/CSV file export generation function 100% offline in Brave without remote network dependencies.
- **Preconditions:** Device remains offline; local history contains prior scan records in Brave.
- **Brave Shields Status:** N/A (Offline File Generation)

#### Execution Steps
1. While offline, click SiteStack icon on any page in Brave.
2. Open the **History** modal.
3. Select scans and click **Export Selected (CSV)** and **Export Selected (JSON)**.

#### Expected Checkpoints
| # | Checkpoint | Expected Behavior | Status |
| :-: | :--- | :--- | :---: |
| T15.1 | **Offline History Loading** | Historical scan records load instantly from `chrome.storage.local`. | `NOT RUN` |
| T15.2 | **Offline File Downloads** | CSV and JSON files download immediately via local browser Blob URLs without network round-trips. | `NOT RUN` |
| T15.3 | **Data Integrity** | Downloaded offline files contain complete scan records and correct column formatting. | `NOT RUN` |

- **Brave-Validated Evidence Required:** Downloaded CSV and JSON files generated while offline in Brave; screenshot of completed download bar.
- **Execution Status:** **NOT RUN**

---

## 4. Master Brave-Validated Manual Results Template

The following results table tracks observed outcomes during the Brave Browser manual validation sessions:

| Test ID | Scenario Description | Brave Shields Status | Core Target Checkpoints | Brave-Validated Status (PASS / FAIL / BLOCKED / NOT RUN) | Auditor Initials | Timestamp |
| :---: | :--- | :---: | :--- | :---: | :---: | :---: |
| **T1** | Single-Page App (Next.js & React Inference) | `Enabled / Disabled` | Next.js High, React Inferred (75% Med), Vercel $\le 69\%$ | **NOT RUN** | — | — |
| **T2** | Repeated Scan & WooCommerce Core Version | `Enabled / Disabled` | Core script prioritized over wc-blocks, WP detected, 60s dedup | **NOT RUN** | — | — |
| **T3** | Telemetry Separation (Medium & Cloudflare) | `Enabled / Disabled` | Cloudflare beacon Low 45% + educational note, GA4 High | **NOT RUN** | — | — |
| **T4** | Empty Scan (Google Search Homepage) | `Enabled / Disabled` | Clean EmptyState, <100ms execution, valid empty history entry | **NOT RUN** | — | — |
| **T5** | Browser System Page Guard (`brave://`) | `N/A` | Pre-injection guard, security notice, 0 console errors, no history | **NOT RUN** | — | — |
| **T6** | Browser Error Page (`brave-error://`) | `N/A` | Page Unavailable state, WifiOff icon, no empty scan, no history | **PENDING RE-TEST** | Auditor | 2026-11-16 |
| **T7** | Tab Switching: Unscanned Tab State & Lifecycle | `Enabled (Default)` | Ready to Scan zero-state, explicit scan, reload invalidation, history persistence, clear history reset, 2-tab isolation, in-flight navigation guard, rapid rescan guard | **PASS** | Auditor | 2026-11-16 |
| **T8** | Tab Switching: State Retention Across Tabs | `Enabled (Default)` | Tab A shows Tab A results, Tab B shows Tab B results, zero cross-tab state bleed | **PASS** | User | 2026-11-16 |
| **T9** | URL Navigation & Stale Invalidation | `Enabled (Default)` | In-tab navigation updates URL indicator, Ready to Scan zero-state, history preserved, zero stale bleed | **PASS** | User (Screenshots) | 2026-11-16 |
| **T10** | Local History Persistence & Deletion | `N/A` | 50-item LRU, inspect record, delete item, Clear History purge | **NOT RUN** | — | — |
| **T11** | Single-Scan JSON & CSV Export | `Enabled / Disabled` | 11 columns, RFC 4180 escaping, dual URL semantics, 0 token leakage | **NOT RUN** | — | — |
| **T12** | Multi-Scan CSV & JSON Export | `N/A` | 13 columns, dedicated empty scan row with 10 empty tech fields | **NOT RUN** | — | — |
| **T13** | Offline Scanning of Loaded Page | `Enabled / Disabled` | 100% offline detection, system font fallback, 0 network pings | **NOT RUN** | — | — |
| **T14** | Offline Browser Error Page | `N/A` | Page Unavailable on disconnected error page, not saved to history | **NOT RUN** | — | — |
| **T15** | Offline History & Export Downloads | `N/A` | Offline storage read, local Blob download generation | **NOT RUN** | — | — |

---

## 5. Auditor Sign-Off & Verification Verdict

### Verification Scope & Environment Declarations
- **Primary Browser:** Brave Browser (Chromium Engine)
- **Brave Version (from `brave://version/`):** ________________________
- **Chromium Version (from `brave://version/`):** ________________________
- **Operating System:** Windows 10 / Windows 11
- **Google Chrome Compatibility Note:** Google Chrome is not installed on this workstation; Google Chrome manual validation has **NOT** been performed. All findings are explicitly **Brave-validated**.

### Execution Progress Verdict

```text
[ ] PASS: All 15 manual test scenarios executed and verified in Brave Browser with zero defects.
[ ] CONDITIONAL APPROVAL: Minor non-blocking cosmetic defects noted in Brave Browser.
[ ] FAIL / RELEASE BLOCKED: Critical defect discovered during manual execution.
[X] PARTIAL / IN PROGRESS: Scenarios T7, T8, and T9 manually verified and PASSED in Brave Browser. Scenario T6 is PENDING MANUAL RE-TEST following fix commit 09c892e. Scenarios T1–T5 and T10–T15 remain marked NOT RUN pending live execution.
```

**Auditor Name / Role:** Auditor / QA  
**Date of Execution Checkpoint:** November 16, 2026  
**Auditor Signature:** Verified against Release Candidate commit `f5710e3`  
**Comments / Field Observations (including Brave Shields behavior):**  
- Scenarios T7, T8, and T9 executed and verified in Brave Browser with Brave Shields Enabled.
  - T7 confirmed zero auto-scanning, "Ready to Scan" zero-state on fresh tabs, clean reload invalidation on F5 (`status === 'loading'`), persistent history synchronization, two-tab isolation, in-flight navigation guard (D3), and rapid rescan sequencing (D4).
  - T8 confirmed tab-to-scan isolation: switching between tabs renders each tab's own scan state with zero cross-tab bleed.
  - T9 confirmed via user screenshots on GitHub: navigating to `github.com/explore` and `github.com/trending` correctly displays Ready to Scan, preserves prior history records, and displays no stale results.
- Scenario T6 (browser connection error page handling) was addressed at commit `09c892e` (with 15 automated regression tests) and remains `PENDING MANUAL RE-TEST` in Brave.
- Scenarios T1–T5 and T10–T15 remain marked `NOT RUN` until live manual results are supplied.
- Google Chrome manual verification is unverified and not claimed.  
