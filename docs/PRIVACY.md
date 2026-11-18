# SiteStack — Privacy Architecture & Data Handling

> **SiteStack is built on a strictly local, zero-transmission privacy architecture.**  
> Know what is powering any website without compromising your browsing privacy.

---

## 1. Core Principles

SiteStack operates under a strict set of privacy guarantees:

- **100% Local Execution:** All profiling, signal harvesting, detection evaluation, history caching, and export generation occur exclusively within your browser's local sandbox.
- **Zero Application Network Requests:** Extension background scripts, probes, and UI components contain zero calls to `fetch()`, `XMLHttpRequest`, `WebSocket`, or `navigator.sendBeacon()`.
- **Zero Backend Infrastructure:** SiteStack operates without backend APIs, proxy servers, databases, or cloud endpoints.
- **Zero Telemetry or Analytics:** No third-party tracking scripts, crash reporters, analytics SDKs, or usage telemetry are bundled.
- **Zero Remote Executable Code:** All JavaScript is packaged locally in accordance with Manifest V3 security requirements (`script-src 'self'`). No code is dynamically loaded from remote URLs.
- **Air-Gapped Operation:** The detection engine and probing mechanisms function fully offline without an internet connection.
- **Local Typography:** The popup interface utilizes local system fonts. It makes zero external font or stylesheet network requests.
- **Bundler Preload Safety:** The packaged bundle contains an inert Vite `modulepreload` polyfill that natively returns immediately in Chromium browsers (`link.relList.supports("modulepreload")`); it references only local extension bundle chunks.

---

## 2. Manifest V3 Permissions

SiteStack requests only the minimal permissions necessary to inspect the active tab upon explicit user invocation:

```json
{
  "permissions": [
    "activeTab",
    "scripting",
    "storage"
  ]
}
```

| Permission | Scope & Purpose | Privacy Boundary |
| :--- | :--- | :--- |
| **`activeTab`** | Grants temporary access to the currently focused browser tab when the extension icon is clicked. | Inactive tabs, background tabs, and browser history are inaccessible. Broad host permissions (such as `<all_urls>`) are completely omitted. |
| **`scripting`** | Injects passive, read-only probing routines into the active tab via `chrome.scripting.executeScript`. | Probes run briefly in-memory to harvest signals, do not alter page behavior, and do not install persistent event listeners or observers. |
| **`storage`** | Enables saving recent scan summaries locally in `chrome.storage.local` and caching active tab scans in `chrome.storage.session`. | Data is stored solely on your local device. It is never synced to any cloud service (`chrome.storage.sync` is not used). |

### Permissions SiteStack Does NOT Request

- **`webRequest` / `webRequestBlocking`:** SiteStack never intercepts, inspects, or blocks network traffic.
- **`cookies`:** SiteStack never reads, writes, or inspects cookies.
- **`history`:** SiteStack has no access to your browser navigation history.
- **`tabs`:** Broad tab-query capabilities are omitted; only the narrow `activeTab` permission is used.
- **`<all_urls>`:** SiteStack has zero ambient access to websites you visit.

---

## 3. Signal Harvesting Scope & Boundaries

When a scan is triggered, SiteStack gathers passive structural signals from the active page.

### What SiteStack Inspects

1. **Window Globals Allowlist (44 Properties):** Checks for the presence of specific vendor objects in the page execution context against a static allowlist of 44 identifiers:
   - *CMS & Storefront:* `wp`, `_wpemojiSettings`, `Shopify`, `ShopifyAnalytics`, `BOOMR`, `Webflow`, `wixBiSession`, `wixPerformanceMeasurements`.
   - *Frameworks & Routing:* `__NEXT_DATA__`, `__next_f`, `__next_p`, `next`, `React`, `__REACT_DEVTOOLS_GLOBAL_HOOK__`, `Vue`, `__VUE__`, `__VUE_DEVTOOLS_GLOBAL_HOOK__`, `__VP_HASH_MAP__`, `__VITEPRESS__`, `ng`, `getAllAngularRootElements`.
   - *Libraries:* `jQuery`, `$`, `bootstrap`.
   - *Analytics & Marketing:* `gtag`, `gaGlobal`, `google_tag_data`, `google_tag_manager`, `dataLayer`, `hj`, `_hjSettings`, `fbq`, `_fbq`, `_hsq`, `HubSpotConversations`, `Intercom`, `intercomSettings`.
   - *Ecommerce & Payments:* `woocommerce_params`, `wc_cart_fragments_params`, `Stripe`, `Razorpay`.
   - *Infrastructure:* `__cfRLUnblockHandlers`, `va`, `si`.
2. **Structural DOM Selectors (27 Selectors):** Tests for static root mount points, framework scripts, and container elements (e.g., `#__next`, `script#__NEXT_DATA__`, `[data-reactroot]`, `[ng-version]`, `app-root`, `[data-v-app]`, `body.woocommerce`, `html[data-wf-page]`). One selector (`input[name="shopify-digital-wallet"]`) tests purely for element presence to detect the Shopify wallet container; its value or form state is never read. The Angular selector (`[ng-version]`) reads the attribute value to parse the framework version string.
3. **Targeted Style & Class Inspection:**
   - Queries `<style>` tag text content strictly for framework signatures (`--tw-`, `--tw-ring-offset-shadow`, `[data-v-]`).
   - Samples the `class` attribute of the first 30 elements of `body, body *` against 5 Tailwind CSS utility regex patterns.
   - Inspects attribute names on root elements (`#app`, `[id="__nuxt"]`, `[data-v-app]`) for `data-v-` scoped component markers.
4. **Meta Tags:** Reads `<meta name="...">` and `<meta property="...">` tags (e.g., `generator`) to extract platform identifiers and software versions.
5. **ResourceTiming Asset URLs:** Queries `performance.getEntriesByType('resource')` for static script and stylesheet filenames (e.g., `/_next/static/`, `bootstrap.min.css`). The scraped resource list is hard-capped at 350 items (<15 KB payload) to prevent memory overhead.
6. **Active Tab URL & Status:** Reads `window.location.href` to identify the scanned website domain and detect browser-generated connection error pages.

### What SiteStack NEVER Inspects

- **Form Fields & User Inputs:** SiteStack never reads `<input>` text values, `<textarea>` contents, `<select>` options, or content-editable elements.
- **Credentials & Authentication:** Passwords, API keys, bearer tokens, and session credentials are never read or captured.
- **Personal Information:** User names, email addresses, phone numbers, and physical addresses are never queried or stored.
- **Client Storage:** `localStorage`, `sessionStorage`, `document.cookie`, and `indexedDB` of websites are never accessed.
- **Network Headers & Payloads:** HTTP request and response headers, POST bodies, and WebSocket frames are not captured or stored.

---

## 4. Multi-Layer URL Sanitization

To ensure sensitive parameters are never persisted or exported, SiteStack applies multi-layer URL sanitization across evaluation, storage, and exports:

### Stripped Query Parameters
- **Authentication & Secrets:** Any parameter named or matching `token`, `access_token`, `auth`, `key`, `api_key`, `secret`, `password`, `hash`, `signature`, or `sig` is permanently deleted.
- **Sessions & User Identity:** Parameters containing `session`, `session_id`, `sid`, `user_id`, `uid`, `account`, or `email` are stripped.
- **Marketing & Tracking Tags:** All `utm_*` marketing tags, `fbclid`, `gclid`, `gclsrc`, `dclid`, `msclkid`, `twclid`, `yclid`, `mc_cid`, `mc_eid`, `_ga`, `_gl`, `ref`, and `ref_url` are permanently removed.
- **Hash Fragments:** All `#...` URL fragments (which can contain client-side routing tokens or state parameters) are stripped.

### Safe Parameter Handling
- **Version Query Validation:** The `ver` parameter is preserved only when strictly matching version grammar (`/^[0-9]+(?:\.[0-9]+)+.../`). Arbitrary strings, token-like suffixes, and unvalidated values are stripped. The parameter `v` is stripped unconditionally.
- **Measurement Allowlist:** Only standardized public measurement IDs matching `/^(?:G-[A-Z0-9]+|GTM-[A-Z0-9]+|UA-[0-9]+-[0-9]+)$/i` are preserved for analytics rule matching; arbitrary account identifiers are removed.

---

## 5. Local Data Storage & History

- **Persistent Storage (`chrome.storage.local`):** Scan history is saved strictly to `chrome.storage.local` within your browser's sandboxed extension profile under the key `sitestack_history`. Bounded by an LRU (Least Recently Used) cache capped at 50 scans, preventing unbounded storage growth.
- **Session Cache (`chrome.storage.session`):** Temporary scan associations linking `tabId` to `ScanResult` are stored under `sitestack_tab_scans` in ephemeral session storage. This data is never written to persistent disk and is automatically cleared when the browser session ends.
- **Data Boundaries:** Scan results, URLs, and history never leave your browser sandbox programmatically. The sole mechanism by which data exits the browser is when you **manually trigger a file export** (CSV or JSON) to your local file system.
- **User Control:** You can view, search, export, or clear your complete scan history at any time through the extension popup.
