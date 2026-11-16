# SiteStack Phase 9.7.2 — Focused Tab-State Persistence & Lifecycle Audit Report

**Audit Checkpoint:** Baseline `b5e3fe3`  
**Scope:** Tab state persistence, browser lifecycle, service worker restarts, navigation lifecycle, and race condition guards.  
**Mode:** Read-only investigation and verification.

---

## 1. Tab State Storage Audit (Section A)

### Current Implementation Analysis
In commit `b5e3fe3`, tab-to-scan associations were implemented in [`src/extension/storage/history.ts`](file:///D:/SiteStack/src/extension/storage/history.ts#L330-L460):
- Storage Key: `STORAGE_KEY_TAB_SCANS = 'sitestack_tab_scans'`
- Storage Area: Currently calls `chrome.storage.local.get` and `chrome.storage.local.set`.

### Storage Comparison & Behavioral Characteristics

| Dimension | `chrome.storage.local` (Current) | `chrome.storage.session` (Recommended Target) |
|---|---|---|
| **Persistence Mechanism** | Serialized to disk (IndexedDB / LevelDB). | Kept strictly in Chromium browser process memory. |
| **Service Worker Restart** | Survives service worker termination and idle cycles. | Survives service worker termination and idle cycles. |
| **Browser Restart** | **Persists across browser exits.** Stale tab IDs (e.g. Tab `101`) could match newly created tabs in a restored session. | **Automatically purged by Chromium** when browser exits. A fresh browser launch always starts with 0 tab associations. |
| **Tab Lifecycle Fit** | Tab IDs in Chromium are temporary integers scoped to a browser process run. Storing them on disk creates orphan entries. | Perfectly aligns with tab lifecycle: both tab IDs and session storage die with the browser process. |
| **History Deletion** | Synchronously prunes `sitestack_tab_scans`. | Can be synchronously pruned in `session` storage just as easily. |
| **Manifest V3 Compatibility** | Supported. | Supported natively in Chrome 102+ and Brave (Chromium engine). Requires no new permissions (covered by existing `"storage"`). |
| **Test Environment Mocking** | Mocked in existing unit tests. | Requires fallback to `chrome.storage.local` or in-memory map when `chrome.storage.session` is undefined in test mocks. |

### Confirmed Storage Defects & Proposed Storage Strategy
- **Defect S1 (Browser Restart Stale Associations):** Because `chrome.storage.local` persists to disk, restarting Brave/Chrome leaves `sitestack_tab_scans` intact. If Brave restores tabs or reassigns previously used tab IDs, opening SiteStack could falsely display prior session results.
- **Proposed Storage Architecture:**
  Create a unified `getSessionStorage()` accessor:
  ```typescript
  function getTabStorageArea(): chrome.storage.StorageArea | null {
    if (typeof chrome !== 'undefined' && chrome.storage?.session) {
      return chrome.storage.session;
    }
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      return chrome.storage.local;
    }
    return null;
  }
  ```
  - `STORAGE_KEY_HISTORY` remains 100% in `chrome.storage.local` (persistent user history and exports).
  - `STORAGE_KEY_TAB_SCANS` uses `chrome.storage.session` (in-memory, dies on browser exit, survives service worker restart, falls back to local in mock environments).

---

## 2. Navigation & Document Lifecycle Audit (Section B)

### Inspection of `chrome.tabs.onUpdated` Listener
In [`src/extension/background/service-worker.ts`](file:///D:/SiteStack/src/extension/background/service-worker.ts#L274-L281):
```typescript
if (typeof chrome !== 'undefined' && chrome.tabs?.onUpdated) {
  chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
    if (changeInfo.url) {
      invalidateTabScanIfUrlChanged(tabId, changeInfo.url).catch(() => {});
    }
  });
}
```

### Evaluation of the 5 Lifecycle Scenarios

#### 1. Same-URL Reload (F5 / Refresh Button)
- **Current Behavior:** **DEFECT CONFIRMED.**
  When a user reloads the current page (e.g. `https://react.dev/`), Chromium fires `onUpdated` with `{ status: 'loading' }`, but `changeInfo.url` is `undefined`!
  Because the current code has `if (changeInfo.url)`, the reload is completely ignored.
  Even if `changeInfo.url` were present, `invalidateTabScanIfUrlChanged` compares `normalizeScanUrl(entry.url) !== normalizeScanUrl(newUrl)`. Since the URLs are identical, it returns without invalidating.
- **Result:** After a user reloads the page, SiteStack still displays the pre-reload scan.
- **Required Fix:** Listen for `changeInfo.status === 'loading'`. When a tab enters `loading`, call `invalidateTabScan(tabId)` to invalidate the prior scan.

#### 2. Browser Back and Forward Navigation
- **Current Behavior:** Partially protected.
  If Back/Forward changes the URL (e.g. from `/settings` to `/profile`), `changeInfo.url` is emitted and invalidates the previous scan. Also, `getTabScan` compares `entry.url` against `currentUrl` on popup open.
  However, with `bfcache` (Back/Forward Cache), pages may be restored without a full URL change event.
- **Required Fix:** Invalidation on `changeInfo.status === 'loading'` ensures all Back/Forward transitions invalidate stale results.

#### 3. HTTP / Client-Side Redirects
- **Current Behavior:** When an HTTP redirect occurs (e.g. `http://` $\to$ `https://` or `/` $\to$ `/login`), the browser emits `status: 'loading'` followed by `url: newUrl`.
- **Current Defect:** If a scan occurred on the pre-redirect URL, the old association might linger if the redirect occurs during or after the scan.
- **Required Fix:** Invalidate on `status: 'loading'`.

#### 4. Rapid Navigation During Active Scan (Race Condition)
- **Current Behavior:** **DEFECT CONFIRMED.**
  Suppose Tab 101 initiates a scan for `https://site-a.com`.
  While `chrome.scripting.executeScript` is running asynchronously (100–300ms), the user navigates Tab 101 to `https://site-b.com`.
  When `performTabScan` finishes, it unconditionally calls:
  `await setTabScan(tabId, tabUrl, scanResult)` where `tabUrl` is `https://site-a.com`.
  Although `getTabScan` later checks `currentUrl` on popup open, the in-memory/session storage temporarily contains a mismatched association for Tab 101.
- **Required Fix:** At the end of `performTabScan`, check the tab's *live* current URL via `chrome.tabs.get(tabId)`. If `currentTab.url !== tabUrl`, drop the tab scan association and do not call `setTabScan`.

#### 5. Late Scan Response Overwriting Newer Navigation in Popup
- **Current Behavior:** **DEFECT CONFIRMED.**
  In [`src/popup/hooks/useScanner.ts`](file:///D:/SiteStack/src/popup/hooks/useScanner.ts#L170-L185), when `chrome.runtime.sendMessage` returns `MSG_SCAN_SUCCESS`, it immediately calls:
  ```typescript
  setResult(response.result);
  setIsScanned(true);
  ```
  If the active tab was navigated to a new URL while the scan was in flight, the popup receives the old result and displays it over the new URL.
- **Required Fix:** In `useScanner.ts`'s callback, query the active tab's current URL before setting state:
  ```typescript
  const [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (currentTab?.url && normalizeScanUrl(currentTab.url) === normalizeScanUrl(response.result.url)) {
    setResult(response.result);
    setIsScanned(true);
  } else {
    // Tab navigated away while scan was in-flight -> remain in unscanned state
    setResult(null);
    setIsScanned(false);
  }
  ```

---

## 3. Summary of Confirmed Defects & Targeted Remediation Plan

| ID | Category | Defect Description | Required Targeted Fix |
|---|---|---|---|
| **D1** | Storage | `chrome.storage.local` persists tab scans to disk, surviving browser restarts. | Use `chrome.storage.session` for tab scans with fallback to `local` in mock environments. |
| **D2** | Lifecycle | Same-URL page reload does not invalidate tab scan. | In `chrome.tabs.onUpdated`, call `invalidateTabScan(tabId)` whenever `changeInfo.status === 'loading'`. |
| **D3** | Concurrency | Rapid navigation during active scan binds old URL result to tab. | In `performTabScan`, verify tab's live URL before calling `setTabScan`. |
| **D4** | Popup Race | Late scan response updates popup state after tab has navigated. | In `useScanner.ts`, verify active tab URL matches `response.result.url` before calling `setResult`. |
