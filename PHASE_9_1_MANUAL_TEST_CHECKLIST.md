# SiteStack — Phase 9.1: Manual Testing & Beta Verification Checklist

**Target Package:** SiteStack Release Candidate 1  
**Build Folder:** `D:\SiteStack\dist`  
**Auditor/Tester:** Beta Testing Team  
**Date:** November 16, 2026  

---

## 1. Extension Installation & Setup

1. Launch Google Chrome with a clean or standard profile.
2. In the Chrome address bar, open:
   ```text
   chrome://extensions/
   ```
3. Enable **Developer mode** using the toggle switch in the upper-right corner.
4. Click the **Load unpacked** button in the top toolbar.
5. In the file picker, select the production distribution folder:
   ```text
   D:\SiteStack\dist
   ```
6. **Verification Checks:**
   - [ ] Extension appears as **SiteStack — Technology Stack Profiler** (version `1.0.0`).
   - [ ] Extension ID is generated with no manifest errors or warnings.
   - [ ] SiteStack icon appears in the Chrome toolbar extensions menu. Pin SiteStack to the toolbar for convenience.

---

## 2. Test Scenarios Matrix

### Test 1: Single-Page Application (Next.js & React Inference)
- **Target URL:** `https://www.notion.com` or `https://react.dev`
- **Steps:**
  1. Navigate to the target website in an active browser tab and allow it to finish loading.
  2. Click the SiteStack icon in the toolbar.
- **Expected Results:**
  - [ ] Popup opens smoothly without console errors.
  - [ ] **Next.js** is detected at **High** confidence ($\ge 80\%$) with version extracted if visible.
  - [ ] **React** is marked with an **`INFERRED`** badge at **75% Medium**, indicating inference from Next.js.
  - [ ] Clicking on the technology card expands the **Evidence Drawer**, showing observed signal paths (e.g. `window.__NEXT_DATA__`, `/_next/static/`).
  - [ ] **Vercel** is **NOT** detected (or is not marked High), confirming that client-side telemetry alone does not falsely attribute cloud hosting.

---

### Test 2: Content Management & Ecommerce (WordPress, WooCommerce, jQuery)
- **Target URL:** `https://woocommerce.com/store` (or any live WooCommerce store)
- **Steps:**
  1. Open the page and click the SiteStack extension icon.
- **Expected Results:**
  - [ ] **WooCommerce** is detected with **High** confidence.
  - [ ] Extracted version displays the WooCommerce core version (e.g. `v7.x.x` or `v8.x.x`), **not** a subpackage bundle version like `wc-blocks`.
  - [ ] If a development version is present on a test build (e.g. `11.4.0-dev.20261116`), the complete dev tag is preserved and categorized as `development`.
  - [ ] **WordPress** is identified (either direct or inferred from WooCommerce) at $\ge 75\%$ confidence.
  - [ ] **jQuery** is identified with version (e.g. `v3.x.x` or `v1.12.4`) if loaded.

---

### Test 3: Infrastructure Telemetry Separation (Medium.com & Cloudflare)
- **Target URL:** `https://medium.com`
- **Steps:**
  1. Open Medium.com and trigger a scan.
- **Expected Results:**
  - [ ] **Google Analytics 4** / **Google Tag Manager** detected with High confidence.
  - [ ] **Cloudflare** is displayed at **Low** confidence ($45\%$).
  - [ ] Expanding the Cloudflare card reveals the explainable justification:
    *"Observed Cloudflare Web Analytics beacon script indicates client-side telemetry, not confirmed Cloudflare hosting or DNS infrastructure."*
  - [ ] No false React detection is triggered by browser extensions (e.g. React DevTools hook alone).

---

### Test 4: Empty Scan / Non-Detectable Website (Google Search)
- **Target URL:** `https://www.google.com`
- **Steps:**
  1. Open Google search and click SiteStack.
- **Expected Results:**
  - [ ] Scan completes within 100ms.
  - [ ] UI displays the empty state message:
    *"No recognized technologies detected from the current 24 supported technologies."*
  - [ ] No unhandled exceptions or broken layout in the popup.
  - [ ] The scan is correctly saved to history as an empty scan.

---

### Test 5: Browser System Page Restriction Guard
- **Target URL:** `chrome://extensions/` or `about:blank`
- **Steps:**
  1. With the extensions tab active, click SiteStack.
- **Expected Results:**
  - [ ] Extension does not attempt code injection.
  - [ ] Clean security notice is shown:
    *"Browser internal and system pages cannot be analyzed by extension security policy."*

---

### Test 6: Local History & Cache Management
- **Steps:**
  1. In the popup header, click the **History** tab / clock icon.
  2. Verify that the recent scans (Notion, WooCommerce, Medium, Google) are listed in chronological order.
  3. Click a past scan item to inspect cached results.
  4. Click **Clear History** (or test deleting individual records).
- **Expected Results:**
  - [ ] Historical scans load instantly from `chrome.storage.local`.
  - [ ] History is bounded to 50 items maximum (LRU retention).
  - [ ] History entries preserve `domain`, `timestamp`, `technologies`, and duration metrics.

---

### Test 7: Single-Scan JSON & CSV Export
- **Steps:**
  1. Scan any multi-technology website (e.g. WooCommerce store).
  2. Click **Export** $\to$ **Download JSON**.
  3. Click **Export** $\to$ **Download CSV**.
- **Expected Results:**
  - [ ] JSON download completes: file named `sitestack-[domain]-[date].json`.
  - [ ] JSON includes `scannedWebsite`, `technologyWebsite`, `website` alias, `engineEvaluationDurationMs`, `scanDurationMs`, and `versionMaturity` ('stable', 'prerelease', 'development', or 'unknown').
  - [ ] CSV download completes: file named `sitestack-[domain]-[date].csv`.
  - [ ] CSV contains exactly **11 standard columns** with proper RFC 4180 double-quote escaping.

---

### Test 8: Multi-Scan History Export (Normal + Empty Scans)
- **Steps:**
  1. Navigate to History view where both normal scans (Notion, WooCommerce) and an empty scan (Google) exist.
  2. Select all items (or click **Export All**).
  3. Download combined JSON and CSV.
- **Expected Results:**
  - [ ] Multi-scan JSON includes `exportedAt`, `totalScans`, and an array of all selected scans. Empty scans have `"technologies": []`.
  - [ ] Multi-scan CSV has exactly **13 columns**:
    `scannedWebsite, scanDate, url, technology, category, version, confidenceScore, confidenceTier, detectionType, parentDependency, confidenceReason, evidenceSummary, technologyWebsite`.
  - [ ] The empty scan emits exactly **one row** with `scannedWebsite`, `scanDate`, `url`, and 10 empty technology fields.

---

### Test 9: Complete Offline / Air-Gapped Verification
- **Steps:**
  1. Disconnect network / disable Wi-Fi.
  2. Open any cached or locally saved HTML file.
  3. Click SiteStack to inspect.
- **Expected Results:**
  - [ ] Popup renders cleanly without network calls.
  - [ ] No external asset requests fail (all styles and icons are embedded).

---

## 3. Manual Sign-Off Table

| Test Case | Description | Tested By | Date | Outcome (PASS/FAIL) | Notes |
| :---: | :--- | :---: | :---: | :---: | :--- |
| **T1** | Next.js & React Inference (Notion/react.dev) | | | | |
| **T2** | WooCommerce Core Prioritization | | | | |
| **T3** | Infrastructure Telemetry Separation | | | | |
| **T4** | Empty Scan Handling (google.com) | | | | |
| **T5** | Restricted Browser Page Notice | | | | |
| **T6** | History LRU Cache Navigation | | | | |
| **T7** | Single-Scan JSON & CSV Exports | | | | |
| **T8** | Multi-Scan CSV (13 Columns + Empty Row) | | | | |
| **T9** | Offline & Local Integrity | | | | |

**Final Manual Verification Sign-Off:**  
Lead Tester: _______________________ Date: _______________ Verdict: [  ] READY FOR BETA
