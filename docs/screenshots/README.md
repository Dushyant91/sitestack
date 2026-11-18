# SiteStack — Extension Screenshots Guide

This directory holds the official screenshots referenced in the repository [README.md](../../README.md).

To ensure complete authenticity, screenshots should be captured directly from the installed extension running in **Google Chrome** or **Brave Browser** without artificial mockups.

---

## Required Screenshot Assets

| Filename | Target State | Recommended Subject Website | Capture Instructions |
| :--- | :--- | :--- | :--- |
| **`ready-to-scan.png`** | Initial / Ready State | Any regular website (e.g., `github.com` or `nextjs.org`) | 1. Open the website.<br>2. Click the SiteStack toolbar icon.<br>3. If auto-scan is not active, capture the "Ready to Inspect Stack" screen showing the domain and "Scan Current Tab" button. |
| **`popup-results.png`** | Scanned Results | A rich multi-technology website (e.g., a Next.js or WooCommerce site) | 1. Click "Scan Current Tab".<br>2. Wait for detection cards to render (e.g., Next.js with version, React `INFERRED`, Tailwind CSS).<br>3. Capture the full popup with category pills and summary metrics. |
| **`evidence-details.png`** | Evidence Drawer | Any high-confidence detected card | 1. From the scanned results view, click on a technology card (e.g., Next.js) to expand its evidence drawer.<br>2. Ensure the individual signals (`global`, `dom`, `resource`), weights (+X pts), and matched strings are visible.<br>3. Capture the popup. |
| **`scan-history.png`** | Scan History Drawer | Scan history with $\ge 2$ entries | 1. Click the **History** button in the footer.<br>2. Ensure the recent scan history list and export action buttons are displayed.<br>3. Capture the history view. |

---

## Capture & Formatting Guidelines

- **Dimensions:** The SiteStack popup is fixed at `380px` width (or native 1x / 2x high-DPI resolution).
- **Format:** PNG format (`.png`).
- **Aspect Ratio:** Maintain the native popup aspect ratio without artificial device bezels or dropshadow padding.
- **Privacy:** Ensure no personal bookmarks, browser profiles, or private URLs are visible in the background.
