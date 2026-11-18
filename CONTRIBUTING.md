# Contributing to SiteStack

Thank you for your interest in contributing to SiteStack! This document provides guidelines for reporting issues, proposing new technology detection rules, and submitting code contributions.

---

## Code of Conduct & Architectural Principles

SiteStack is designed as a high-precision, developer-focused, privacy-first technology profiler. All contributions must adhere to these core invariants:

1. **Zero Network Calls:** The extension core, probes, and UI must never initiate external network requests. Zero telemetry, tracking, or remote API dependencies.
2. **Minimal Permissions:** SiteStack strictly relies on `activeTab`, `scripting`, and `storage`. We do not accept changes that inflate manifest permissions (e.g., `<all_urls>`, `webRequest`, `cookies`).
3. **Decoupled Architecture:** The detection engine (`src/engine/`) is pure, synchronous TypeScript. It receives harvested signals and returns detections without interacting with browser APIs directly.
4. **Multi-Class Corroboration:** High-confidence detections ($\ge 80\%$) must require cross-class corroboration across at least two independent signal classes (`global`, `dom`, `meta`, `resource`). Single-signal rules must never yield High confidence alone.
5. **Privacy by Default:** Scanned URLs and resource evidence must always undergo sanitization to strip query parameters, tokens, credentials, and tracking tags.

---

## Development Setup

### Prerequisites
- Node.js 18.x or higher
- npm 9.x or higher
- Google Chrome or Brave Browser (for manual extension testing)

### Setup Steps

```bash
# 1. Clone your fork of the repository
git clone https://github.com/your-username/sitestack.git
cd sitestack

# 2. Install dependencies
npm install

# 3. Run the complete test suite
npm test

# 4. Run TypeScript typechecking
npx tsc -b

# 5. Build production bundle to dist/
npm run build
```

---

## Proposing New Technology Detection Rules

To propose a new technology or improve an existing detection rule, please open a GitHub Issue with the following information:

1. **Technology Name & Official Website:** e.g., `Remix (https://remix.run)`
2. **Category:** CMS, Ecommerce, Frameworks, Libraries, Analytics, Marketing, Payments, or Infrastructure.
3. **Detection Signals:**
   - **Window Globals:** Specific runtime global objects (e.g., `window.__remixContext`).
   - **DOM Selectors:** Unique structural elements or attributes.
   - **Meta Tags:** Generator tags or platform-specific meta properties.
   - **Resource Timing Patterns:** Distinctive script or asset URL substrings.
4. **Version Extraction:** How an exact version number can be reliably parsed, if available.
5. **Representative Live Websites:** 2–3 public websites using the technology for validation.
6. **Negative Controls:** Common technologies that could generate false-positive matches and must be guarded against.

---

## Submitting Pull Requests

1. **Create a Feature Branch:**
   ```bash
   git checkout -b feature/add-technology-name
   ```
2. **Add Detection Rules & Tests:**
   - Add rule definitions to `src/engine/rules/`.
   - Add test fixtures and test cases to `tests/`. Every new rule must include positive tests, negative controls, and corroboration verification.
3. **Verify Everything Passes:**
   ```bash
   npm test
   npx tsc -b
   npm run build
   ```
4. **Submit Your PR:**
   - Provide a clear summary of changes.
   - Reference any related issues.
   - Confirm that the test suite passes with zero regressions.
