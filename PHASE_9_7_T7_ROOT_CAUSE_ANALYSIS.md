# SiteStack Phase 9.7 — Root-Cause Analysis: T7 Unexpected Results on Unscanned Tab

**Incident Reference:** Phase 9.7 Manual Validation — Finding T7  
**Observed Behavior:** Navigating to an unscanned Wikipedia tab (`https://en.wikipedia.org/wiki/Main_Page`) and opening SiteStack immediately displayed two technology detections (jQuery and WordPress) without any user-initiated scan action. The expected state was "Ready to Scan".  
**Document Purpose:** In-depth technical investigation across popup initialization, service worker messaging, storage caching, and tab lifecycle tracking.

---

## 1. Direct Answers to Investigation Inquiries

### Inquiry 1: Is a scan automatically triggered on tab activation?
- **In the Background Service Worker:** **No.** There are no `chrome.tabs.onActivated` or `chrome.tabs.onUpdated` event listeners in `service-worker.ts`. Tab switching or page loading in the browser does not trigger background scanning.
- **On Popup Opening:** **YES.** In [`src/popup/hooks/useScanner.ts`](file:///D:/SiteStack/src/popup/hooks/useScanner.ts#L105-L107), a top-level `useEffect` unconditionally invokes `executeScan(false)` on popup mount:
  ```typescript
  useEffect(() => {
    executeScan(false);
  }, [executeScan]);
  ```
  `executeScan(false)` immediately dispatches `MSG_START_SCAN` to the service worker. If the page was not previously cached, `service-worker.ts` **immediately injects probes and performs a live scan of the active tab without user interaction**.

---

### Inquiry 2: Are results from a different tab being reused?
- **Yes, when domains overlap.**
  In [`src/extension/storage/history.ts`](file:///D:/SiteStack/src/extension/storage/history.ts#L303-L325), `getCachedScan(urlOrDomain)` queries the global history (`sitestack_history`) in `chrome.storage.local` matching solely on **domain hostname** (`targetDomainKey`) with a 1-hour expiration window (`maxAgeMs = 3600000`):
  ```typescript
  const targetDomainKey = getDomainKey(urlOrDomain);
  const matched = existing.find(
    (entry) => getDomainKey(entry.domain || entry.url) === targetDomainKey
  );
  if (matched && Date.now() - matched.timestamp < maxAgeMs) {
    return matched;
  }
  ```
  Because this lookup does not evaluate `tabId` or path, any previous scan of that domain performed in **any** tab within the past hour is served to any newly opened tab on the same domain.
  Furthermore, the extension maintains **zero tab-specific scan state mapping** (`tabId -> ScanResult`), causing all tabs to share a global history pool.

---

### Inquiry 3: Are results being loaded from a URL/domain cache?
- **Yes.** When `executeScan(false)` is dispatched by the popup, `performTabScan` in `service-worker.ts` first queries `getCachedScan(tabUrl)`. If a prior scan of `en.wikipedia.org` existed in `chrome.storage.local`, it returned that stored record.
- If no cached scan existed, `performTabScan` did **not** stop or return an unscanned state — it executed a full live scan on the live page.

---

### Inquiry 4: Does a previous scan exist for this exact tab and URL?
- **No.** The extension does not record `tabId` in storage records, memory, or history. The extension has no mechanism to know whether a scan was executed in the current tab or a different tab, nor whether the current tab was created seconds ago or hours ago.

---

## 2. Technical Deep Dive: Why Wikipedia Displayed jQuery & WordPress

When the auditor opened `https://en.wikipedia.org/wiki/Main_Page` and clicked the SiteStack extension icon:

1. **Automatic Scan Dispatch:**
   `useScanner.ts` mounted with `isLoading = true` and fired `executeScan(false)`.
2. **Live Script Execution on Wikipedia:**
   Assuming `en.wikipedia.org` was not cached, `performTabScan(tabId, tabUrl, false)` in `service-worker.ts` executed:
   - `chrome.scripting.executeScript({ target: { tabId }, func: harvestIsolatedSignals })`
   - `chrome.scripting.executeScript({ target: { tabId }, world: 'MAIN', func: harvestMainSignals })`
3. **Signals Harvested from Wikipedia (MediaWiki):**
   - **jQuery:** MediaWiki loads jQuery on all Wikipedia pages; `window.jQuery` was detected (`weight: 55`).
   - **WordPress:** On Wikipedia/MediaWiki, edit forms, gadgets, or Wikimedia scripts expose `window.wp` (or form element properties on `window`). In [`src/engine/rules/cms.ts`](file:///D:/SiteStack/src/engine/rules/cms.ts#L20), the WordPress rule defines:
     ```typescript
     globals: [
       { path: 'wp', weight: 55 },
       { path: '_wpemojiSettings', weight: 50 },
     ]
     ```
     Because `55 >= SCORE_MEDIUM_THRESHOLD (50)`, `window.wp` alone crossed the detection threshold at Medium confidence.
4. **Display:**
   `evaluateSignals` returned `{ technologies: [WordPress, jQuery] }`, saved it to `sitestack_history`, and the popup rendered both technology cards immediately without the user ever clicking "Scan".

---

## 3. Core Architectural Defects Identified

1. **Defect 1: Popup auto-scans on mount.**
   `useScanner.ts` calls `executeScan(false)` on `useEffect`, treating popup open as an implicit scan trigger.
2. **Defect 2: Service worker conflates "start scan" with "check tab status".**
   `service-worker.ts` only has `performTabScan`, which always executes probe injection if cache is absent. There is no read-only status query to ask: *"Has this tab been scanned yet?"*
3. **Defect 3: Missing in-memory Tab Session State (`tabId -> TabScanState`).**
   Neither the service worker nor popup tracks tab identity or active scan status per tab.
4. **Defect 4: Missing navigation listeners.**
   No `chrome.tabs.onUpdated` or `chrome.webNavigation.onCommitted` listeners exist to invalidate tab scan state when the user navigates to a new URL in an existing tab.
5. **Defect 5: Missing "Ready to Scan" UI state.**
   `App.tsx` has no zero-state view for an unscanned tab. If `result` is null, it displays `EmptyState.tsx`, which says *"Scan completed successfully. No supported technologies were detected."* (which is an empty-scan result, not an unscanned state).

---

## 4. Proposed Remediation Architecture (Before Implementation)

### A. In-Memory Tab Scan Registry (Service Worker)
Implement a session-scoped tab registry in `src/extension/background/service-worker.ts`:
```typescript
interface TabScanEntry {
  url: string;              // Normalized URL when scan occurred
  result: ScanResult;       // Cached result for this tab
  timestamp: number;
}
const tabScanRegistry = new Map<number, TabScanEntry>();
```
- When a scan is explicitly triggered (`MSG_START_SCAN`), the result is stored in `tabScanRegistry.set(tabId, { url: normalizedUrl, result, timestamp })`.
- Add `chrome.tabs.onUpdated` listener: When `changeInfo.url` or navigation occurs on `tabId`, if the URL changed from `entry.url`, remove `tabId` from `tabScanRegistry`.
- Add `chrome.tabs.onRemoved` listener: Clean up `tabScanRegistry.delete(tabId)`.

### B. Read-Only Tab Status Query (`MSG_GET_TAB_STATUS`)
Introduce a lightweight message `MSG_GET_TAB_STATUS`:
- Input: `{ tabId: number, url: string }`
- Logic:
  - Validates URL scheme via `validateScannableUrl`.
  - Checks `tabScanRegistry.get(tabId)`.
  - If an entry exists **and** `normalizeScanUrl(entry.url) === normalizeScanUrl(tabUrl)`, returns `{ status: 'SCANNED', result: entry.result }`.
  - Otherwise, returns `{ status: 'UNSCANNED', url: tabUrl, domain }`.
  - **Crucially: NEVER executes script injection, probes, or engine evaluation.**

### C. Explicit User-Triggered Scan Execution (`MSG_START_SCAN`)
- `MSG_START_SCAN` is **only** sent when the user explicitly clicks the "Scan Website" / "Rescan" button.
- Runs `performTabScan`, saves to storage history, and records in `tabScanRegistry`.

### D. "Ready to Scan" UI in Popup
- In `useScanner.ts`: On mount, queries `MSG_GET_TAB_STATUS`.
  - If `status === 'UNSCANNED'`, sets `result = null`, `isLoading = false`, `isUnscanned = true`.
- In `App.tsx`: When `isUnscanned === true`, renders a clean **Ready to Scan** state with:
  - Target domain and URL.
  - Explanation: *"Click Scan Website to inspect frontend technologies and frameworks."*
  - Prominent primary action button: **Scan Website**.
- In `Header.tsx`: Shows `Ready to scan` and a primary `Scan` button instead of `Rescan`.

---

## 5. Validation Test Plan

Add comprehensive unit and integration tests in `tests/extension/phase9-7-tab-scanning.test.ts`:
1. **Test 1 — New Unscanned Tab:** Opening popup on a fresh tab queries status, receives `UNSCANNED`, renders "Ready to Scan", and verifies 0 probe injections occurred.
2. **Test 2 — Switching from Scanned Tab to Unscanned Tab:** Tab 1 has completed scan (Next.js/React); Tab 2 is newly opened Wikipedia. Tab 1 displays scan results; Tab 2 displays "Ready to Scan".
3. **Test 3 — Two Tabs with Different Previously Scanned Websites:** Tab 1 (Shopify) and Tab 2 (WooCommerce). Switching between them renders their respective results without cross-tab bleed.
4. **Test 4 — Reopening Popup without Initiating Scan:** Opening and closing popup on an unscanned tab multiple times never initiates a scan or changes state.
5. **Test 5 — In-Tab URL Navigation Invalidation:** Tab 1 scanned on `github.com/explore`; navigates to `github.com/trending`. Tab state is invalidated; reopening popup displays "Ready to Scan" for the new URL.
