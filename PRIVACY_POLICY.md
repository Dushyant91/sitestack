# SiteStack — Privacy Policy & Security Architecture

**Effective Date:** November 16, 2026  
**Version:** 1.0.0 (Release Candidate 1 — Post-Privacy Remediation)  
**Applicable Package:** SiteStack — Technology Stack Profiler Chrome Extension  
**Repository & Source:** [d:\SiteStack](file:///d:/SiteStack)

---

## 1. Core Privacy Principle

**SiteStack is built on a strictly local, zero-transmission privacy architecture.**

SiteStack does not collect, track, transmit, monetize, sell, or share any personal information, browsing history, form inputs, session data, or scan results. All profiling, signal harvesting, detection evaluation, history caching, and export generation occur **100% locally within your browser's private sandbox**.

This policy has been audited and verified against the actual production source code at Git commit `8c7056f` and Phase 9.6 verification.

---

## 2. Codebase Network Audit & External Asset Disclosure

A complete static code audit of the entire extension codebase (`src/` and `dist/`) verifies the following factual guarantees:

- **Zero Programmatic Network Calls:** The extension's background service worker, isolated content probe, main content probe, evaluation engine, and history storage systems perform **zero** programmatic network requests: there are zero calls to `fetch()`, `XMLHttpRequest`, `WebSocket`, or `navigator.sendBeacon()`.
- **Zero Backend Servers:** SiteStack operates without any backend API, database, remote collector, proxy server, or cloud service.
- **Zero Telemetry or Analytics Beacons:** SiteStack contains no Google Analytics, Segment, Sentry, Mixpanel, or third-party tracking scripts.
- **Zero Remote Executable Code:** In full compliance with Google Chrome Web Store Manifest V3 security requirements, SiteStack packages all JavaScript locally. No code is dynamically fetched, evaluated (`eval`), or executed from remote URLs (`script-src 'self'`).
- **Air-Gapped Operation:** SiteStack's detection engine and probe pipelines function with full capability when your device is completely disconnected from the internet.
- **UI Typography Stylesheet Disclosure:** The extension popup interface (`dist/popup/index.html`) includes standard `<link>` tags referencing Google Web Fonts (`Plus Jakarta Sans` and `JetBrains Mono`). If an active internet connection is available when the popup is opened, the browser fetches these stylesheet and font files directly from Google's CDN (`fonts.googleapis.com` / `fonts.gstatic.com`). If offline or if CDN connections are blocked, SiteStack automatically falls back to local system typography (`-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`). No browsing data, scanned URLs, or user identifiers are sent with this font stylesheet request. All technology brand icons are compiled as local inline SVG components and never loaded remotely.

---

## 3. Manifest V3 Permissions Justification

SiteStack strictly adheres to the principle of least privilege, requesting only the minimum permissions necessary to function:

```json
{
  "permissions": [
    "activeTab",
    "scripting",
    "storage"
  ]
}
```

| Permission | Technical Scope & Code Justification | Privacy Safeguard |
| :--- | :--- | :--- |
| **`activeTab`** | Enables inspection of the single tab that is currently active and in focus when you click the SiteStack extension icon. | Access is granted **only on explicit user invocation** (clicking the toolbar icon). SiteStack has no access to background tabs, inactive tabs, or browsing history. The broad `<all_urls>` permission is completely omitted. |
| **`scripting`** | Injects two read-only probing functions (`harvestIsolatedSignals` and `harvestMainSignals`) into the active tab via `chrome.scripting.executeScript`. | Probe scripts run in-memory, perform passive inspection, and exit immediately. They never modify the webpage DOM or inject persistent listeners. |
| **`storage`** | Enables saving your recent technology scan results to `chrome.storage.local`. | Data is saved exclusively to your local browser storage on your computer. It is never synced to the cloud or transferred across devices (`chrome.storage.sync` is not used). |

Permissions SiteStack **does NOT request**:
- `webRequest` / `webRequestBlocking` (No traffic sniffing or request alteration).
- `cookies` (No inspection of session cookies or credentials).
- `history` (No access to browser browsing history).
- `webNavigation` (No tracking of URL navigation events).
- `nativeMessaging` (No communication with host operating system binaries).
- `tabs` (Only the narrow `activeTab` permission is utilized).

---

## 4. Signal Harvesting & Data Safety Standards

When you trigger a scan on a webpage, SiteStack's probes execute read-only queries against specific structural elements of the page.

### What SiteStack Inspects
1. **Public Meta Tags:** Reads `<meta name="...">` and `<meta property="...">` elements (e.g. `generator`, `shopify-digital-wallet`) to detect platform identifiers.
2. **Structural DOM Selectors:** Tests for the presence of a pre-approved list of 26 static framework mount points and container elements (e.g. `#__next`, `[data-reactroot]`, `[ng-version]`, `body.woocommerce`).
3. **ResourceTiming Asset URLs:** Queries `performance.getEntriesByType('resource')` for static script and stylesheet filenames (e.g. `/_next/static/`, `jquery.min.js`, `bootstrap.min.css`). The scraped resource list is hard-capped at 350 items (<15 KB payload) to prevent memory overhead.
4. **Window Global Allowlist:** Inspects a static allowlist of 37 known read-only vendor objects in the page's execution context (e.g. `window.wp`, `window.Shopify`, `window.React`, `window.jQuery`).

### What SiteStack NEVER Inspects
- **Form Inputs & Textareas:** Never reads `<input>`, `<textarea>`, `<select>`, or content-editable elements.
- **Passwords & Credentials:** Never touches password fields, API keys, bearer tokens, or login inputs.
- **Personal Data:** Never accesses names, email addresses, phone numbers, credit card numbers, or physical addresses.
- **User Cookies & Storage:** Never reads `document.cookie`, `localStorage`, `sessionStorage`, or `indexedDB` of scanned websites.
- **Network Payloads:** Never inspects request bodies, response bodies, or WebSocket communication.

---

## 5. Multi-Layer Evidence URL Sanitization & Parameter Privacy

To prevent accidental retention or leakage of sensitive data in URLs and diagnostic evidence, SiteStack implements a strict, multi-layer defense-in-depth sanitization architecture (`src/shared/url.ts`) across every stage of the lifecycle:

### Multi-Tier Sanitization Pipeline
1. **Top-Level Scanned URLs:** Normalized and sanitized in both the evaluation engine (`evaluator.ts`) and storage manager (`history.ts`) via `normalizeScanUrl`.
2. **Evidence Source URLs:** All resource URLs collected from `performance.getEntriesByType('resource')` are sanitized via `sanitizeResourceUrl` before being assigned to `evidence.source` (and truncated to max 120 characters).
3. **Evidence Matched Values:** Raw matched asset URLs are sanitized via `sanitizeResourceUrl` before being recorded in `evidence.matchedValue`.
4. **Non-Resource Evidence Protection:** DOM selectors (`source`), global object paths, meta generator strings, and inferred dependencies never contain arbitrary URLs, tokens, or query strings.
5. **Storage Layer Sanitization:** `sanitizeScanResult` re-validates all evidence items before writing to `chrome.storage.local`.
6. **Export Pipelines Sanitization:** Single-scan JSON, single-scan CSV, and multi-scan CSV export generators execute runtime sanitization (`sanitizeResourceEvidenceString`) on all evidence strings prior to generating download blobs.

### Parameter Stripping Rules
- **Authentication & Secrets Stripped:** All query parameters matching names like `token`, `access_token`, `auth`, `key`, `api_key`, `secret`, `password`, `hash`, `signature`, or `sig` are permanently deleted.
- **Session & Identity Identifiers Stripped:** All parameters containing `session`, `session_id`, `sid`, `user_id`, `uid`, `account`, or `email` are permanently deleted.
- **Advertising & Tracking Parameters Stripped:** All `utm_*` marketing parameters, `fbclid`, `gclid`, `gclsrc`, `dclid`, `msclkid`, `twclid`, `yclid`, `mc_cid`, `mc_eid`, `_ga`, `_gl`, `ref`, and `ref_url` are permanently deleted.
- **Hash Fragments Stripped:** All `#...` URL fragments (which may contain client-side routing tokens, authentication tokens, or state payloads) are stripped.

### Safe Version Parameter Preservation & Measurement Allowlist
- **Software Version Parameters Preserved:** Query parameters `ver` (e.g. `wp-emoji-release.min.js?ver=6.4.2`, `woocommerce.min.js?ver=7.1.4`) and `v` (e.g. `bootstrap.min.css?v=5.3.0`) are preserved because they are technically required for accurate semantic version extraction across CMS platforms and component libraries.
- **Strictly Bounded Measurement Identifier Allowlist:** The query parameters `id` and `tid` are preserved **only** when their value conforms strictly to public analytics and container formats matching `/^(?:G-[A-Z0-9]+|GTM-[A-Z0-9]+|UA-[0-9]+-[0-9]+)$/i` (such as `googletagmanager.com/gtm.js?id=GTM-XXXXXXX` or `google-analytics.com/g/collect?tid=G-XXXXXXXXXX`). Generic or arbitrary user, account, or transaction identifiers (e.g. `?id=user123` or `?tid=txn_999`) fail this pattern match and are automatically stripped as sensitive.

---

## 6. Local Storage, Legacy History Migration & Data Retention

- **Storage Location:** All historical scan records are stored in Chrome's sandboxed `chrome.storage.local` under the key `sitestack_history`. Data never leaves your machine.
- **Automatic Legacy History Migration:** When loading history via `getScanHistory()`, SiteStack automatically detects any legacy records that were stored prior to the Phase 9.5 privacy remediation. It sanitizes all legacy records and **immediately persists the sanitized records back to `chrome.storage.local`**. Reopening the extension or exporting history will never restore or leak old unsanitized tokens.
- **LRU Retention Limit:** Storage is hard-capped at **50 items maximum** (`MAX_HISTORY_ITEMS = 50`). When the 51st scan is executed, the oldest scan is automatically pruned.
- **Rescan De-Duplication:** Rescanning the same domain within 60 seconds updates the existing record rather than creating duplicate entries.
- **Storage Quota Safeguard:** If Chrome's storage quota is approached, SiteStack catches the exception and prunes the oldest 50% of entries to prevent extension failure.
- **User Control & Deletion:**
  - You can delete any individual scan record from the History modal at any time.
  - You can purge all stored history instantly by clicking the **Clear History** button.
  - Uninstalling the SiteStack extension immediately removes all stored data from your disk via Chrome's extension lifecycle management.

---

## 7. Data Exports

When you use the **Download JSON** or **Download CSV** export features:
- All file generation is performed in-memory using standard JavaScript `Blob` objects.
- File downloads are triggered locally via `URL.createObjectURL()`.
- Exported files are saved directly to your local file system via Chrome's download manager.
- No scan data is ever transmitted to an external server during export.

---

## 8. Third-Party Typography & Assets

The extension popup loads its UI typography via Google Web Fonts (`Plus Jakarta Sans` and `JetBrains Mono`). 
- If an internet connection is available, font stylesheets are retrieved directly from Google's content delivery network.
- If the browser is offline or the connection is blocked, SiteStack automatically falls back to system fonts (`-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`).
- All technology icons are rendered using locally compiled SVG components; no external icon images are fetched over the network.

---

## 9. Compliance with Chrome Web Store Developer Policies

SiteStack fully complies with the [Google Chrome Web Store Developer Program Policies](https://developer.chrome.com/docs/webstore/program_policies/):
- **Single Purpose:** Profiling the technology stack of the currently active website.
- **Limited Use:** Data collected in-memory is used solely to present technology stack information to the user in the extension UI.
- **Data Minimization:** Requests the fewest permissions possible, avoiding broad host permissions.
- **Manifest V3 Compliant:** Uses standard service workers and isolated script execution without remote code.

---

## 10. Contact & Privacy Inquiries

For technical audits, questions, or privacy feedback, open an issue in the project repository:
- Project Documentation: [README.md](file:///D:/SiteStack/README.md)
- Feedback Template: [BETA_FEEDBACK_TEMPLATE.md](file:///D:/SiteStack/BETA_FEEDBACK_TEMPLATE.md)
- Code Repository: [d:\SiteStack](file:///d:/SiteStack)
