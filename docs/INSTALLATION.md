# SiteStack — Installation Guide

This guide provides step-by-step instructions for installing and running SiteStack in **Google Chrome** and **Brave Browser**.

---

## Prerequisites

- **Browser:** Google Chrome (v110+) or Brave Browser (v1.50+).  
  *(Both browsers support Manifest V3 extensions).*
- **For building from source:** Node.js 18.x or higher, and npm.

---

## Method 1: Install from Pre-Built Release Archive (Recommended)

### Step 1: Download the Release Archive
Download the latest verified release archive:
- **File:** `release/sitestack-v1.1.0-stable.zip`
- **SHA-256 Checksum:** `C81887146F96C9DFB5D8C2950698DAB775D8CAD1248046DEB0E7E74973B038CD`

### Step 2: Verify Archive Integrity (Optional but Recommended)
To verify that the downloaded archive is authentic and untampered, verify its SHA-256 checksum in your terminal:

**Windows (PowerShell):**
```powershell
Get-FileHash -Path sitestack-v1.1.0-stable.zip -Algorithm SHA256
```

**macOS:**
```bash
shasum -a 256 sitestack-v1.1.0-stable.zip
```

**Linux:**
```bash
sha256sum sitestack-v1.1.0-stable.zip
```

Compare the output hash with the verified checksum:
`C81887146F96C9DFB5D8C2950698DAB775D8CAD1248046DEB0E7E74973B038CD`

### Step 3: Extract the ZIP Archive
Extract `sitestack-v1.1.0-stable.zip` to a convenient folder on your computer.  
The extracted directory will contain `manifest.json` at its root, along with `service-worker.js`, `isolated-probe.js`, `main-probe.js`, `popup/`, `icons/`, and `assets/`.

### Step 4: Load into Your Browser

#### In Google Chrome:
1. Open Google Chrome and navigate to:
   ```text
   chrome://extensions/
   ```
2. Enable **Developer mode** using the toggle switch in the upper-right corner.
3. Click the **Load unpacked** button in the top-left toolbar.
4. Select the extracted folder containing `manifest.json`.

#### In Brave Browser:
1. Open Brave and navigate to:
   ```text
   brave://extensions/
   ```
2. Enable **Developer mode** using the toggle switch in the upper-right corner.
3. Click the **Load unpacked** button in the top-left toolbar.
4. Select the extracted folder containing `manifest.json`.

### Step 5: Pin to Toolbar
1. Click the puzzle-piece **Extensions** icon in your browser toolbar.
2. Locate **SiteStack — Technology Stack Profiler**.
3. Click the pin icon next to SiteStack so the icon remains readily accessible in your toolbar.

---

## Method 2: Build and Install from Source Code

If you prefer to audit and compile the TypeScript source code directly:

```bash
# 1. Clone the repository
git clone https://github.com/username/sitestack.git
cd sitestack

# 2. Checkout the verified v1.1.0 release tag
git checkout v1.1.0

# 3. Install dependencies
npm install

# 4. Run the full test suite (352 tests across 26 test files)
npm test

# 5. Typecheck and build the production extension
npm run build
```

The compiled extension bundle is emitted to the `dist/` directory.

Follow **Step 4** above, selecting the `dist/` folder when clicking **Load unpacked**.

---

## Troubleshooting

### "Page Not Supported"
If you open SiteStack while viewing a browser-internal page (such as `chrome://extensions`, `brave://extensions`, or `about:blank`), SiteStack will display a **Page Not Supported** screen. This is by design: Chromium security policies prohibit extensions from injecting scripts or inspecting internal browser management pages. Navigate to any regular website (HTTP or HTTPS) to scan.

### "Manifest file is missing or unreadable"
When using **Load unpacked**, ensure you select the root directory that contains `manifest.json` directly inside it, rather than a parent folder.

### Updating the Extension
After updating files or checking out a new release:
1. Go to `chrome://extensions/` or `brave://extensions/`.
2. Find the SiteStack card.
3. Click the reload icon (circular arrow) on the card to reload the latest bundle into memory.
