# Changelog

All notable changes to the SiteStack project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.1.1] - 2026-11-21

### Changed
- **Extension Brand Identity:** Updated the extension display name to `"SiteStack – Discover Website Technologies"` and set the toolbar action title to `"SiteStack"`.
- **Surface Branding Consistency:** Aligned the popup document title and user-facing surfaces with the unified SiteStack product brand and descriptive tagline while preserving all detection logic, local privacy guarantees, and permissions.

---

## [1.1.0] - 2026-11-18

### Added
- **Unified Visual Identity:** Introduced the master "Browser-Stack" SVG icon mark, replacing generic emoji and placeholder symbols across all extension surfaces.
- **Pixel-Fitted Extension Icons:** Generated four pixel-fitted icon assets (16×16, 32×32, 48×48, 128×128 px) featuring a high-contrast navy squircle, crisp browser window frame, and active signal detection indicator.
- **Dedicated Protected-Page Experience:** Added explicit detection and handling for browser-internal schemes (`chrome://`, `brave://`, `edge://`, `about:`, `view-source:`, `chrome-extension://`). Displays a clear "Page Not Supported" state explaining that SiteStack inspects regular HTTP/HTTPS websites.
- **Active-Tab Security Guards:** Added pre-validation to prevent attempted script execution on unscriptable or policy-restricted browser pages, eliminating console errors.
- **Tailwind CSS Realism Test Suite:** Added comprehensive automated test coverage combining inline CSS variable inspection, utility class verification, and production-built HTML fixtures.

### Changed
- **Developer-Tool UI Polish:** Redesigned the extension popup interface with clean typography, refined contrast, category filter pills, and improved spacing inspired by modern developer tools.
- **Local Typography:** Fully transitioned popup typography to local system font stacks, eliminating all external font requests for 100% offline, zero-network operation.
- **Evidence Drawer Readability:** Improved monospace signal formatting, category badges, and point contribution indicators (+X pts) in the explainable evidence drawer.
- **Updated Scanning Feedback:** Refined radar scanning copy to *"Analyzing DOM, JavaScript globals and resource signals"*.

### Fixed
- **Placeholder Icons Replaced:** Resolved the packaging defect where icon assets contained plain blue squares without symbols.
- **Misleading Error Messages:** Resolved an issue where viewing internal browser pages (such as `brave://extensions`) produced a misleading *"Scan Failed — No active browser tab found to inspect"* error due to browser URL redaction.
- **Preview Metrics Calibration:** Corrected preview summary counters to accurately reflect 2 High, 2 Medium, and 1 Inferred detection counts.

---

## [1.0.1-beta] - 2026-11-17

### Added
- **Icon Rendering Pipeline:** Added PowerShell icon generation script utilizing `System.Drawing` to render geometric browser-stack icons across all four required manifest dimensions.

### Fixed
- **Beta Packaging Fix:** Corrected icon asset compilation in the beta distribution package.

---

## [1.0.0-beta] - 2026-11-16

### Added
- **Pure Detection Engine:** Core decoupled rules engine (`evaluator.ts`) supporting 24 curated technologies across 8 categories (CMS, Ecommerce, Frameworks, Libraries, Analytics, Marketing, Payments, Infrastructure).
- **Multi-Class Corroboration Algorithm:** Confidence scoring engine requiring cross-class corroboration across at least two independent signal classes (`global`, `dom`, `meta`, `resource`) for High confidence ($\ge 80\%$).
- **Architectural Dependency Inference:** Dependency graph mapping parent-to-child relationships (e.g., Next.js $\implies$ React, WooCommerce $\implies$ WordPress, VitePress $\implies$ Vue.js) with calibrated inference scoring.
- **Semantic Version Extraction & Maturity Classification:** Runtime extraction of exact software version numbers with classification into `stable`, `prerelease`, `development`, or `unknown`.
- **Infrastructure Telemetry Safeguards:** Strict separation of client-side telemetry beacons (Vercel Analytics, Cloudflare Insights) from confirmed hosting, preventing misleading claims.
- **Local Scan History with LRU Cache:** Storage manager retaining up to 50 recent scans locally in `chrome.storage.local` with automatic quota recovery and de-duplication.
- **Dual-URL Export Pipeline:** Structured JSON and RFC 4180 CSV export generation with unambiguous `scannedWebsite` and `technologyWebsite` columns.
- **Multi-Layer URL Sanitization:** Strict defense-in-depth sanitization stripping authentication tokens, keys, session IDs, `utm_*` marketing tags, `fbclid`, `gclid`, and hash fragments from scanned URLs and diagnostic evidence.
- **Manifest V3 Extension Harness:** Decoupled background service worker, isolated world content probe, and main world content probe for safe execution.
