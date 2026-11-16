# SiteStack — Beta Testing Guide

**Target Version:** 1.0.0 (Release Candidate 1)  
**Distribution Build:** `D:\SiteStack\dist`  
**Date:** November 16, 2026  
**Audience:** Beta Testing Team & Internal Auditors

---

## 1. Introduction & Welcome

Welcome to the **SiteStack Beta Testing Program**!

SiteStack is a high-precision, privacy-first Chrome extension that identifies the frontend frameworks, libraries, content management systems, analytics tools, payment gateways, and cloud infrastructure powering any website.

As a beta tester, your primary mission is to evaluate detection accuracy across diverse real-world websites, verify version extraction reliability, test edge-case stability (such as empty or restricted pages), and report any discrepancies.

---

## 2. Installation & Setup

### Prerequisites
- **Browser:** Google Chrome (v110 or newer), Brave, Microsoft Edge, Opera, or Chrome Canary.
- **Build Package:** The precompiled production build located at `D:\SiteStack\dist`.

### Step-by-Step Installation
1. Launch Google Chrome.
2. In the Chrome address bar, navigate to:
   ```text
   chrome://extensions/
   ```
3. Enable **Developer mode** using the toggle switch located in the upper-right corner of the page.
4. Click the **Load unpacked** button in the top-left toolbar.
5. In the file picker dialog, navigate to and select the build directory:
   ```text
   D:\SiteStack\dist
   ```
6. **Verify Installation:**
   - Confirm that the extension card appears as **SiteStack — Technology Stack Profiler** (version `1.0.0`).
   - Check that no manifest errors or warnings are displayed on the extension card.
   - Click the puzzle piece icon (Extensions menu) in the Chrome toolbar and **pin** SiteStack to your toolbar for easy one-click access.

---

## 3. Supported Technologies Catalog (24 Technologies Across 8 Categories)

SiteStack is calibrated for high-precision detection of 24 core technologies:

| Category | Technology ID | Name | Official Website | Expected Detection Signals |
| :--- | :--- | :--- | :--- | :--- |
| **CMS** | `wordpress` | WordPress | `https://wordpress.org` | `window.wp`, `window._wpemojiSettings`, `generator` meta, `/wp-content/` assets |
| | `webflow` | Webflow | `https://webflow.com` | `window.Webflow`, `html[data-wf-page]`, `generator` meta, `assets.website-files.com` |
| | `wix` | Wix | `https://wix.com` | `window.wixBiSession`, `window.wixPerformanceMeasurements`, `static.wixstatic.com` |
| **Ecommerce** | `shopify` | Shopify | `https://shopify.com` | `window.Shopify`, `window.ShopifyAnalytics`, `cdn.shopify.com` assets |
| | `woocommerce` | WooCommerce | `https://woocommerce.com` | `window.woocommerce_params`, `body.woocommerce`, `/plugins/woocommerce/` assets |
| **Frameworks** | `nextjs` | Next.js | `https://nextjs.org` | `window.__NEXT_DATA__`, `window.__next_f`, `#__next`, `/_next/static/` chunks |
| | `vue` | Vue.js | `https://vuejs.org` | `window.Vue`, `window.__VUE__`, `[data-v-app]`, scoped CSS signatures |
| | `vitepress` | VitePress | `https://vitepress.dev` | `window.__VITEPRESS__`, `window.__VP_HASH_MAP__`, `generator` meta |
| | `angular` | Angular | `https://angular.dev` | `window.ng`, `window.getAllAngularRootElements`, `[ng-version]`, `<app-root>` |
| **Libraries** | `react` | React | `https://react.dev` | `window.React`, `[data-reactroot]`, `react.min.js` runtime script |
| | `jquery` | jQuery | `https://jquery.com` | `window.jQuery.fn.jquery`, `window.$.fn.jquery`, `jquery.min.js` asset |
| | `bootstrap` | Bootstrap | `https://getbootstrap.com` | `window.bootstrap.Tooltip.VERSION`, `bootstrap.min.css/js`, doc assets |
| | `tailwindcss` | Tailwind CSS | `https://tailwindcss.com` | `--tw-` stylesheet properties, `--tw-ring-offset-shadow`, utility class patterns |
| **Analytics** | `google-analytics` | Google Analytics 4 | `https://analytics.google.com` | `window.gtag`, `window.gaGlobal`, `google-analytics.com/g/collect` |
| | `google-tag-manager` | Google Tag Manager | `https://tagmanager.google.com` | `window.google_tag_manager`, `googletagmanager.com/gtm.js` |
| | `hotjar` | Hotjar | `https://hotjar.com` | `window.hj`, `window._hjSettings`, `static.hotjar.com/c/hotjar-*.js` |
| **Marketing** | `meta-pixel` | Meta Pixel | `https://www.facebook.com/business/tools/meta-pixel` | `window.fbq`, `window._fbq`, `connect.facebook.net/.../fbevents.js` |
| | `hubspot` | HubSpot | `https://hubspot.com` | `window._hsq`, `window.HubSpotConversations`, `js.hs-scripts.com` |
| | `intercom` | Intercom | `https://intercom.com` | `window.Intercom`, `window.intercomSettings`, `widget.intercom.io` |
| **Payments** | `stripe` | Stripe | `https://stripe.com` | `window.Stripe`, `js.stripe.com/v3/` iframe and script elements |
| | `razorpay` | Razorpay | `https://razorpay.com` | `window.Razorpay`, `checkout.razorpay.com/v1/checkout.js` |
| **Infrastructure** | `cloudflare` | Cloudflare | `https://cloudflare.com` | `window.__cfRLUnblockHandlers`, `static.cloudflareinsights.com/beacon.min.js` |
| | `vercel` | Vercel | `https://vercel.com` | `window.va`, `window.si`, `/_vercel/insights/script.js` |
| | `netlify` | Netlify | `https://netlify.com` | `identity.netlify.com`, `/.netlify/functions/` API requests |

---

## 4. Understanding Confidence Scores & Tiers

SiteStack uses a mathematical multi-class scoring algorithm rather than guessing. When testing, verify that confidence ratings match these definitions:

### The Scoring Tiers
- **High Confidence ($\ge 80\%$ — Green Badge):**
  - Represents definitive, verified presence.
  - **Crucial Rule:** High confidence mathematically requires cross-class corroboration across **at least two independent signal classes** (e.g. a global variable plus a DOM element, or a resource script plus a meta tag). A single signal class alone is capped at 60 points and can never trigger High confidence.
- **Medium Confidence ($50 - 79\%$ — Amber Badge):**
  - Represents probable technology presence based on a strong single signal class (e.g. `window.wp` = 55%), or an **architectural inference** from a confirmed parent technology.
- **Low Confidence ($30 - 49\%$ — Gray Badge):**
  - Represents partial or supporting evidence, such as a client-side telemetry beacon or CDN-hosted asset.
- **Noise Filter ($< 30\%$):**
  - Any signal with a total weight under 30 points is discarded as background noise and will not appear in the UI.

### Architectural Inferences (`INFERRED` Badge)
Some technologies are the architectural foundation of others:
- **Next.js** implies **React**
- **VitePress** implies **Vue.js**
- **WooCommerce** implies **WordPress**

When a parent technology is detected at High confidence, SiteStack automatically surfaces the child dependency with an **`INFERRED`** badge at **75% Medium** confidence. This ensures users know the technology is running, while honestly communicating that direct runtime variables for the child were bundled inside the parent framework.

### Telemetry vs Cloud Hosting Calibration
Pay special attention to infrastructure detections:
- **Cloudflare:** If a site is hosted elsewhere (e.g. Medium.com on AWS) but uses Cloudflare Web Analytics, Cloudflare will appear at **45% Low** confidence with the note: *"Observed Cloudflare Web Analytics beacon script indicates client-side telemetry, not confirmed Cloudflare hosting or DNS infrastructure."*
- **Vercel:** Vercel telemetry client libraries (`window.va`, `window.si`) are capped at weight 25. Even combined with telemetry assets (`/_vercel/insights/`), Vercel is strictly capped at **69% Medium** (`maxConfidenceScore: 69`), preventing client-side analytics from falsely claiming Vercel cloud hosting.

---

## 5. Version Extraction & Maturity Badges

When a technology is detected, SiteStack attempts to extract its exact version:
- **Where versions originate:**
  - Runtime global objects (e.g. `window.React.version`, `window.jQuery.fn.jquery`).
  - Document meta tags (e.g. `<meta name="generator" content="WordPress 7.1.4">`).
  - DOM attributes (e.g. `<div ng-version="17.0.2">`).
  - Resource URLs (e.g. `/plugins/woocommerce/assets/js/frontend/woocommerce.min.js?ver=7.1.4`).

### Version Maturity Classifications
- **`stable`**: Standard production release version (e.g. `7.1.4`, `18.3.1`, `6.0`).
- **`prerelease`**: Feature-frozen release candidate, alpha, or beta (e.g. `14.0.0-rc.2`, `18.3.1-beta.0`).
- **`development`**: Continuous development snapshot, nightly build, or commit tag (e.g. `11.4.0-dev.20261116`).
- **`unknown`**: Non-version string, measurement ID (e.g. `GTM-XXXXXXX`), or when no version could be safely determined.

> [!NOTE]
> Production builds of modern frameworks (like Next.js App Router) frequently strip version strings from the client bundle to minimize payload size. In such cases, SiteStack transparently reports: *"Next.js detected. The production build does not expose a reliable framework version, so SiteStack cannot determine the exact version."*

---

## 6. Known Limitations & Expected Behaviors

During beta testing, keep these expected technical constraints in mind:

1. **Manifest V3 HTTP Response Header Restriction:**
   Chrome Manifest V3 content scripts cannot inspect document-level HTTP response headers (such as `Server: Vercel` or `CF-Ray: ...`) without broad `webRequest` or host permissions (`<all_urls>`). To preserve user privacy, SiteStack avoids these invasive permissions. Cloud hosting is therefore evaluated using browser-visible client assets and intentionally kept conservative.
2. **Browser System Pages (`chrome://`, `about:blank`, Chrome Web Store):**
   Chrome security policy strictly forbids extension script injection on internal browser pages. When opened on such pages, SiteStack displays a clean notice: *"Browser internal and system pages cannot be analyzed by extension security policy."*
3. **Delayed Dynamic Hydration (SPAs):**
   On heavy single-page applications that load asynchronously, clicking SiteStack before initial JavaScript execution finishes might result in a partial scan. Rescanning after page hydration resolves this.
4. **React DevTools Browser Extension:**
   If you have the official React Developer Tools Chrome extension installed, it injects `window.__REACT_DEVTOOLS_GLOBAL_HOOK__` into **every** website you visit (including non-React sites like Amazon.in). SiteStack rates this signal at weight 25 (< 30 threshold) so it will **never** trigger a false React detection on non-React sites.
5. **Evidence URL Privacy Sanitization:**
   When inspecting the Evidence Drawer or exported JSON/CSV files, you will notice that sensitive query parameters (such as `token`, `session_id`, `auth`, `key`, `secret`, `utm_*`, `gclid`, `fbclid`) and URL hash fragments are stripped from both the scanned website URL and individual resource asset URLs. Essential version query parameters (`?ver=6.4.2`, `?v=5.3.0`) and validated public measurement tags (`?id=GTM-XXXXXXX`, `?tid=G-XXXXXXXXXX`) are intentionally preserved because they are required for semantic version extraction and container identification. Arbitrary user, account, or transaction identifiers (e.g. `?id=user123` or `?tid=txn_999`) fail this strict validation pattern and are stripped as sensitive.

---

## 7. How to Test & Reporting Guidelines

We ask beta testers to evaluate three core scenarios:

### Scenario A: Popular Production Websites
Scan a variety of top websites across different stacks:
- **E-Commerce:** Shopify storefronts (Allbirds, Gymshark), WooCommerce stores.
- **SaaS & Tech:** Notion, Stripe, GitHub, Vercel, Linear, React.dev, Angular.dev, Vuejs.org.
- **Media & CMS:** WordPress blogs, Webflow landing pages, Wix sites.
- **Baseline Non-Detectable Sites:** Google Search (`google.com`), Wikipedia.

### Scenario B: Evidence & Export Verification
- Click on technology cards to expand the **Evidence Drawer**. Check that matched values and weights make sense.
- Test single-scan exports (**Download JSON** and **Download CSV**).
- Open the **History** modal, verify recent scans are saved, and test **Export All (CSV)**.
- Verify that scans with zero detections emit a single clean row in CSV exports.

---

## 8. Defect Reporting Instructions

If you encounter an issue, please use our standardized reporting templates from [BETA_FEEDBACK_TEMPLATE.md](file:///D:/SiteStack/BETA_FEEDBACK_TEMPLATE.md):

1. **False-Positive Report (Over-Detection):**
   Use Template 1 if SiteStack reports a technology that the website does not actually use.
2. **Missing-Detection Report (Under-Detection):**
   Use Template 2 if a website clearly uses one of our 24 supported technologies, but SiteStack failed to detect it.
3. **Version Extraction / Maturity Issue:**
   Use Template 3 if an extracted version is incorrect, truncated, or miscategorized.
4. **UI / Layout / Usability Bug:**
   Use Template 4 if the popup displays broken layouts, truncated text, or unresponsive buttons.

Submit all completed reports using [BETA_FEEDBACK_TEMPLATE.md](file:///D:/SiteStack/BETA_FEEDBACK_TEMPLATE.md). For formal verification rounds, use the [MANUAL_VALIDATION_RESULTS_TEMPLATE.md](file:///D:/SiteStack/MANUAL_VALIDATION_RESULTS_TEMPLATE.md).
