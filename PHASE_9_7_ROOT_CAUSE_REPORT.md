# SiteStack Phase 9.7 — Root Cause Investigation Report
## Finding: Browser Error Page Misclassified as Successful Empty Scan

**Date:** November 16, 2026  
**Auditor Finding:** When navigating to a nonexistent domain or a browser-generated connection error page, SiteStack displays:  
> *"Scan completed successfully. No supported technologies were detected."*  
**Investigated Files:**
- `src/extension/background/service-worker.ts`
- `src/extension/content/isolated-probe.ts`
- `src/extension/content/main-probe.ts`
- `src/shared/messages.ts`
- `src/popup/components/ErrorState.tsx`
- `src/popup/components/EmptyState.tsx`

---

## 1. Observed Problem & Symptom Analysis

When a user in Google Chrome, Brave, or Microsoft Edge navigates to a dead host, invalid domain, or disconnected network state (e.g., `http://this-does-not-exist-12345.org` or `ERR_INTERNET_DISCONNECTED`), SiteStack presents a clean green-accented successful empty scan:
- **UI Display:** `EmptyState` component displaying *"Scan completed successfully. No supported technologies were detected using the available browser-visible evidence."*
- **Local History:** A false scan record with `"technologies": []` is written to `chrome.storage.local`.
- **Export Behavior:** Users can export a CSV/JSON report claiming the dead domain was analyzed and has zero technologies.

This is a misclassification. The document in the browser tab is not the target website—it is an internal Chromium error document.

---

## 2. Deep-Dive Root Cause Mechanics

### Mechanism 1: Chrome Tab URL Retention vs. Internal Error Document
When Chromium navigation fails (e.g. `ERR_NAME_NOT_RESOLVED`, `DNS_PROBE_FINISHED_NXDOMAIN`, `ERR_INTERNET_DISCONNECTED`, `ERR_CONNECTION_REFUSED`, `ERR_CERT_COMMON_NAME_INVALID`):
1. **The Tab URL:** Chrome intentionally keeps the typed or pending address in `chrome.tabs.Tab.url` (e.g. `http://this-does-not-exist-12345.org/`).
2. **The Document URL:** The actual document loaded into the frame is an internal Chromium error page: `chrome-error://chromewebdata/` (or `edge-error://chromewebdata/`).

### Mechanism 2: URL Pre-Validation Gap in `validateScannableUrl`
In `src/shared/messages.ts`:
```typescript
export function validateScannableUrl(url: string | undefined): {
  scannable: boolean;
  code?: ScanErrorCode;
  message?: string;
} {
  ...
  const trimmed = url.trim().toLowerCase();
  if (
    trimmed.startsWith('chrome://') ||
    trimmed.startsWith('chrome-extension://') ||
    trimmed.startsWith('devtools://') ||
    trimmed.startsWith('edge://') ||
    trimmed.startsWith('brave://') ||
    trimmed.startsWith('about:') ||
    trimmed.startsWith('view-source:')
  ) {
    return { scannable: false, code: 'RESTRICTED_URL', ... };
  }
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return { scannable: false, code: 'UNSUPPORTED_SCHEME', ... };
  }
  return { scannable: true };
}
```
Two defects exist here:
1. Because `tab.url` is `http://this-does-not-exist-12345.org/`, it starts with `http://`. It is not a `chrome://` URL, so `validateScannableUrl` returns `{ scannable: true }`.
2. Even if `tab.url` was explicitly `chrome-error://chromewebdata/`, `chrome-error://` is missing from the prefix list, so it falls through to `UNSUPPORTED_SCHEME` rather than identifying an unavailable error page.

### Mechanism 3: Silent Exception Swallowing in `service-worker.ts` (The Core Defect)
In `src/extension/background/service-worker.ts`:
```typescript
    // 1. Execute Isolated World Probe (DOM & ResourceTiming)
    let isolatedPayload: IsolatedProbePayload = {
      url: tabUrl,
      meta: [],
      dom: [],
      resources: [],
    };
    try {
      const isolatedResults = await chrome.scripting.executeScript({
        target: { tabId },
        func: harvestIsolatedSignals,
      });

      if (isolatedResults && isolatedResults[0]?.result) {
        isolatedPayload = isolatedResults[0].result as IsolatedProbePayload;
      }
    } catch (isolatedErr) {
      console.warn('[SiteStack ServiceWorker] Isolated-world probe notice:', isolatedErr);
    }
```
In Chrome Manifest V3, `chrome.scripting.executeScript` cannot execute scripts on Chromium error documents (`chrome-error://chromewebdata/`). Chrome rejects the call with an error:
- `Cannot access contents of url "chrome-error://chromewebdata/". Extension manifest must request permission to access the respective host.`
- `The frame's document is an error document.`
- `Cannot access a chrome-error:// URL.`

**The Flaw:** `service-worker.ts` catches `isolatedErr`, logs a warning with `console.warn`, and **swallows the error**.
It proceeds with `isolatedPayload = { url: tabUrl, meta: [], dom: [], resources: [] }`.

The subsequent MAIN-world probe also throws an error and is swallowed by `catch (mainErr)`.

Next, `service-worker.ts` assembles `combinedSignals` with empty arrays and passes it to `evaluateSignals(combinedSignals)`.
Because signals are empty, `evaluateSignals` detects 0 technologies and returns a successful `ScanResult` (`technologies: []`).

Finally, `service-worker.ts` calls:
```typescript
await saveScanToStorage(scanResult);
return scanResult;
```
It persists the dead domain into `chrome.storage.local` as a valid scan, and sends `MSG_SCAN_SUCCESS` to the popup!

### Mechanism 4: Missing In-Page Error Document Detection in `isolated-probe.ts`
If `executeScript` ever runs on an error page (e.g. in certain Chromium forks or webviews), `harvestIsolatedSignals` currently has no checks for:
- `window.location.href.startsWith('chrome-error://')`
- `#main-frame-error`
- `.error-code` containing `ERR_NAME_NOT_RESOLVED`, `ERR_INTERNET_DISCONNECTED`, `ERR_CONNECTION_REFUSED`, `DNS_PROBE_FINISHED_NXDOMAIN`, `ERR_CERT_*`.
It simply extracts 0 meta tags, 0 tech selectors, and 0 resources, confirming the false empty scan.

---

## 3. Distinction: Ordinary Websites vs. Browser Error Pages

| Property | Successfully Loaded Website (Empty or Tech) | Ordinary Website with Some Blocked Assets | Browser-Generated Network Error Page |
| :--- | :--- | :--- | :--- |
| **HTTP Status / Document** | 200 OK (HTML document accessible) | 200 OK (HTML document accessible) | Failed (No HTML document received from remote host) |
| **Active Frame Location** | `https://example.com/` | `https://example.com/` | `chrome-error://chromewebdata/` |
| **`chrome.scripting.executeScript`** | **Succeeds.** Returns DOM & meta. | **Succeeds.** Returns DOM & meta. | **Throws:** `chrome-error://` or `error document` exception. |
| **In-Page Error Elements** | None (`#main-frame-error` absent) | None (`#main-frame-error` absent) | `#main-frame-error`, `.error-code` with `ERR_*` |
| **Subresource Failures** | None or negligible | Adblockers/404s in ResourceTiming; **document is alive** | No website resources; internal browser styles only |
| **Required Classification** | **Successful Scan** (empty or detected) | **Successful Scan** (graceful partial signals) | **PAGE_UNAVAILABLE** (Error state; zero history saved) |

---

## 4. Remediation Plan

1. **Add `PAGE_UNAVAILABLE` to `ScanErrorCode` in `src/shared/messages.ts`:**
   - Differentiate restricted system pages (`RESTRICTED_URL`) from unreachable/network error pages (`PAGE_UNAVAILABLE`).
   - Add `chrome-error://`, `edge-error://`, and `brave-error://` to `validateScannableUrl`.
2. **Add In-Page Error Document Detection in `src/extension/content/isolated-probe.ts`:**
   - Inspect `window.location.protocol`, `window.location.href`, `document.documentURI`, `#main-frame-error`, and `.error-code`.
   - Return `{ isErrorPage: true, errorCode }` if the document is an internal error document.
3. **Harden `service-worker.ts` Exception Handling:**
   - If `executeScript` throws an error indicating `chrome-error://` or an error document:
     - Throw a `PAGE_UNAVAILABLE` error.
     - **Do NOT** proceed with evaluation.
     - **Do NOT** call `saveScanToStorage`.
     - Return `{ type: 'MSG_SCAN_ERROR', error: { code: 'PAGE_UNAVAILABLE', ... } }`.
   - If `isolatedPayload.isErrorPage` is true:
     - Throw `PAGE_UNAVAILABLE` error.
4. **Update `src/popup/components/ErrorState.tsx`:**
   - Render `Page Unavailable` with `WifiOff` / `AlertCircle` icon, message, and a `Retry Inspection` button.
5. **Add Comprehensive Regression Tests in `tests/extension/phase9-7-browser-error-pages.test.ts`:**
   - Cover all 6 scenarios required by the prompt.
