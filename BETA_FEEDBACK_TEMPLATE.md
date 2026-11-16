# SiteStack — Beta Feedback & Issue Reporting Templates

This document contains standardized templates for reporting issues, anomalies, false positives, and missing detections discovered during SiteStack beta testing.

Please copy the appropriate template below, fill in the required fields, and submit your report to the SiteStack development team.

---

## Template 1: False-Positive Report (Over-Detection)

Use this template when SiteStack detects a technology that is **not actually used** by the website.

```markdown
### [FALSE POSITIVE] <Technology Name> on <Website URL>

**1. Environment Information:**
- Target Website URL: https://example.com/page
- SiteStack Version: 1.0.0 (RC1)
- Chrome Version: (e.g. Chrome 131.0.6778.86 64-bit)
- Operating System: (e.g. Windows 11, macOS Sequoia, Ubuntu 24.04)
- Browser Profile: [ ] Clean Profile  [ ] Profile with React DevTools / Other Extensions

**2. Incorrect Detection Observed:**
- Technology Falsely Detected: (e.g. React, Cloudflare, Vercel)
- Reported Confidence Score: (e.g. 85% High, 69% Medium, 45% Low)
- Detection Type: [ ] Direct  [ ] Inferred
- Parent Dependency (if inferred): (e.g. Next.js)

**3. Harvested Evidence from Evidence Drawer:**
*(Click the technology card to expand the Evidence Drawer, or attach the downloaded JSON)*
- Signal 1: (e.g. window.__REACT_DEVTOOLS_GLOBAL_HOOK__ [present] (25pts))
- Signal 2: (e.g. resource: https://example.com/cdn/widget.js (35pts))

**4. Why This is a False Positive:**
*(Explain how you verified that the site does not use this technology, e.g. third-party widget artifact, browser extension injection, or shared asset CDN)*

**5. Steps to Reproduce:**
1. Navigate to `https://example.com/page`
2. Allow page to finish loading.
3. Click SiteStack extension icon.
4. Observe false detection in results list.

**6. Attachments:**
- [ ] Exported JSON (`sitestack-example_com-YYYY-MM-DD.json`) attached.
- [ ] Screenshot of popup showing the technology card and expanded Evidence Drawer.
```

---

## Template 2: Missing-Detection Report (Under-Detection)

Use this template when a website is **known to use** one of SiteStack's 24 supported technologies, but SiteStack failed to detect it.

```markdown
### [MISSING DETECTION] <Technology Name> on <Website URL>

**1. Environment Information:**
- Target Website URL: https://example.com/page
- SiteStack Version: 1.0.0 (RC1)
- Chrome Version: (e.g. Chrome 131.0.6778.86)
- Operating System: (e.g. Windows 11, macOS Sequoia)

**2. Missing Technology Details:**
- Expected Technology: (Must be one of the 24 supported technologies, e.g. Vue.js, Tailwind CSS, Stripe)
- Category: (e.g. Framework, Library, Payments)
- Expected Version (if known): (e.g. Vue 3.4.0)

**3. Proof of Presence on the Page:**
*(Provide the exact browser signals present in DevTools that prove the technology is running)*
- Window Global: (e.g. In DevTools console, `window.__VUE__` evaluates to `true`)
- DOM Element / Attribute: (e.g. In Elements tab, `<div id="app" data-v-app>`)
- Script / Asset URL: (e.g. In Network tab, `https://example.com/assets/vue.esm-browser.js`)
- Meta Tag: (e.g. `<meta name="generator" content="...">`)

**4. Observed SiteStack Behavior:**
- [ ] Technology is completely absent from results.
- [ ] Technology appears in Evidence Drawer but scored below the 30% noise floor.
- [ ] Popup displayed "No recognized technologies detected".

**5. Steps to Reproduce:**
1. Open target website: `https://example.com/page`
2. Wait for full page load.
3. Click SiteStack icon in toolbar.
4. Verify results list omits the technology.

**6. Attachments:**
- [ ] Exported JSON file attached.
- [ ] DevTools screenshot showing the runtime evidence on the page.
```

---

## Template 3: Version Extraction or Maturity Classification Issue

Use this template when a technology was detected correctly, but its **version string is wrong, missing, truncated, or miscategorized**.

```markdown
### [VERSION ISSUE] <Technology Name> on <Website URL>

**1. Environment Information:**
- Target Website URL: https://example.com/page
- SiteStack Version: 1.0.0 (RC1)
- Chrome Version & OS:

**2. Version Discrepancy:**
- Detected Technology: (e.g. WooCommerce, Bootstrap, jQuery, WordPress)
- SiteStack Extracted Version: (e.g. `v7.1.4`, empty, or truncated)
- SiteStack Version Maturity: [ ] stable  [ ] prerelease  [ ] development  [ ] unknown
- Actual Expected Version: (e.g. `11.4.0-dev.20261116`, `5.3.3`)
- Actual Expected Maturity: [ ] stable  [ ] prerelease  [ ] development  [ ] unknown

**3. Source of Truth:**
*(Where does the correct version appear on the page?)*
- Meta tag: `<meta name="generator" content="...">`
- Global property: `window.<object>.<version>`
- Script URL: `.../script.js?ver=...`

**4. Analysis / Suspected Cause:**
*(e.g. SiteStack extracted subpackage version instead of core version; or regex failed on custom build tag format)*

**5. Attachments:**
- [ ] Exported JSON attached.
- [ ] Screenshot of SiteStack popup and matching DevTools element.
```

---

## Template 4: UI, Layout, Interaction, or Export Defect

Use this template for bugs in the popup interface, search bar, history view, or CSV/JSON exports.

```markdown
### [UI / EXPORT DEFECT] <Short summary of the bug>

**1. Environment Information:**
- SiteStack Version: 1.0.0 (RC1)
- Chrome Version:
- Operating System & Display Scaling: (e.g. Windows 11 at 125% DPI scale, macOS Retina)

**2. Component Affected:**
- [ ] Main Scan View (TechCard, TechIcon, ScanRadar, MetricBanner)
- [ ] Category Filter Navigation
- [ ] Search Bar
- [ ] Evidence Drawer (accordions, badge alignments)
- [ ] History Modal (list rendering, clear history, multi-select)
- [ ] Single-Scan JSON / CSV Export
- [ ] Multi-Scan JSON / CSV Export
- [ ] Empty State / Error State Banner

**3. Description of Bug:**
*(Describe what happened vs what you expected to happen)*

**4. Steps to Reproduce:**
1. Open SiteStack popup.
2. ...
3. ...

**5. Expected Behavior:**
*(What should have occurred)*

**6. Actual Behavior:**
*(What actually occurred, including console errors if any)*

**7. Attachments:**
- [ ] Screenshot or screen recording showing the visual defect.
- [ ] Exported file (if CSV/JSON formatting was corrupted).
```

---

## Template 5: General Beta Feedback & Usability Impressions

Use this template to share qualitative thoughts, performance notes, feature suggestions, or overall impressions.

```markdown
### [BETA FEEDBACK] <Topic or Theme>

**1. Tester Name / Handle:**
**2. Date:**
**3. Chrome Version & OS:**

**4. Overall Experience Rating:**
[ ] Excellent  [ ] Good  [ ] Needs Polish  [ ] Poor

**5. What Worked Well:**
- ...
- ...

**6. Areas for Improvement / Friction Points:**
- ...
- ...

**7. Specific Feature Suggestions:**
- ...
- ...
```
