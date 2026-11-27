import { HarvestedMeta, HarvestedDomElement } from '../../engine/types';

export interface IsolatedProbePayload {
  url: string;
  meta: HarvestedMeta[];
  dom: HarvestedDomElement[];
  resources: string[];
  isErrorPage?: boolean;
  errorCode?: string;
}

/**
 * Harvests DOM meta tags, structural selectors, and ResourceTiming asset URLs
 * Strictly read-only: never alters DOM, never accesses user input or passwords.
 * Completely self-contained: contains no module-level closures or external function calls
 * so it can be safely serialized and injected via chrome.scripting.executeScript.
 */
export function harvestIsolatedSignals(): IsolatedProbePayload {
  const url = typeof window !== 'undefined' ? window.location.href : '';

  // 0. Detect Browser-Generated Network/Connection Error Pages (Chrome, Brave, Edge)
  try {
    const docHref = typeof window !== 'undefined' && window.location ? window.location.href : '';
    const docUri = typeof document !== 'undefined' ? (document.documentURI || '') : '';
    const docProtocol = typeof window !== 'undefined' && window.location ? window.location.protocol : '';

    let isErrorPage = false;
    let errorCode: string | undefined;

    if (
      docProtocol === 'chrome-error:' ||
      docHref.startsWith('chrome-error://') ||
      docUri.startsWith('chrome-error://') ||
      docHref.startsWith('edge-error://') ||
      docUri.startsWith('edge-error://') ||
      docHref.startsWith('brave-error://') ||
      docUri.startsWith('brave-error://')
    ) {
      isErrorPage = true;
      errorCode = 'BROWSER_ERROR_PAGE';
    }

    if (typeof document !== 'undefined') {
      const errorEl = document.querySelector('.error-code, [jscontent="errorCode"], #main-frame-error .error-code');
      if (errorEl) {
        const text = (errorEl.textContent || '').trim();
        if (
          text.startsWith('ERR_') ||
          text.startsWith('DNS_PROBE_') ||
          text.startsWith('NET::ERR_')
        ) {
          isErrorPage = true;
          errorCode = text;
        }
      } else if (document.getElementById('main-frame-error')) {
        isErrorPage = true;
        errorCode = 'ERR_CONNECTION_FAILED';
      }
    }

    if (isErrorPage) {
      return {
        url,
        meta: [],
        dom: [],
        resources: [],
        isErrorPage: true,
        errorCode,
      };
    }
  } catch {
    // Graceful fallback if DOM is in restricted state
  }

  /**
   * Known structural DOM selectors to probe without parsing full page body.
   * Declared strictly inside function body to ensure self-contained serialization.
   */
  const PROBE_SELECTORS = [
    '#__next',
    'script#__NEXT_DATA__',
    'meta[name="next-head-count"]',
    'link[href*="/_next/static/"]',
    '[data-reactroot]',
    '[data-reactid]',
    '[data-react-checksum]',
    '[ng-version]',
    'app-root',
    'adev-root',
    '[ng-app]',
    '[ng-server-context]',
    '[data-v-app]',
    'body.woocommerce',
    'body.woocommerce-page',
    '.woocommerce',
    'html[data-wf-page]',
    'html[data-wf-site]',
    'link[rel*="https://api.w.org/"]',
    'link[rel="EditURI"][type="application/rsd+xml"]',
    'link[href*="bootstrap"]',
    'input[name="shopify-digital-wallet"]',
    'iframe[src*="js.stripe.com"]',
    'script[src*="js.stripe.com"]',
    'iframe[src*="checkout.razorpay.com"]',
    'iframe[src*="googletagmanager.com/ns.html"]',
    'script[src*="jquery"]',
  ];

  // 1. Harvest Meta Tags
  const meta: HarvestedMeta[] = [];
  try {
    const metaElements = document.querySelectorAll('meta');
    metaElements.forEach((el) => {
      const name = el.getAttribute('name') || undefined;
      const property = el.getAttribute('property') || undefined;
      const content = el.getAttribute('content') || '';

      if (name || property) {
        meta.push({
          name: name ? name.toLowerCase() : undefined,
          property: property ? property.toLowerCase() : undefined,
          content,
        });
      }
    });
  } catch {
    // Graceful fallback if DOM is in restricted state
  }

  // 2. Harvest Specific Structural Selectors
  const dom: HarvestedDomElement[] = [];
  try {
    for (const selector of PROBE_SELECTORS) {
      const el = document.querySelector(selector);
      if (el) {
        // For ng-version or data-* attributes, capture value
        let attribute: string | undefined;
        let value: string | undefined;

        if (selector === '[ng-version]') {
          attribute = 'ng-version';
          value = el.getAttribute('ng-version') || undefined;
        }

        dom.push({
          selector,
          attribute,
          value,
        });
      }
    }

    // Check for Tailwind CSS and Vue custom property/directive signatures in stylesheets (inline and accessible styleSheets)
    try {
      let hasTw = false;
      let hasTwRing = false;
      let hasTwV4Theme = false;
      let hasTwV4Tokens = false;
      let hasVueScoped = false;

      const checkCssText = (text: string) => {
        if (!text) return;
        if (!hasTw && text.includes('--tw-')) {
          hasTw = true;
          dom.push({ selector: 'style:has-text(--tw-)' });
        }
        if (!hasTwRing && text.includes('--tw-ring-offset-shadow')) {
          hasTwRing = true;
          dom.push({ selector: 'style:has-text(--tw-ring-offset-shadow)' });
        }
        if (!hasTwV4Theme && text.includes('@layer theme')) {
          hasTwV4Theme = true;
          dom.push({ selector: 'style:has-text(@layer theme)' });
        }
        if (!hasTwV4Tokens && text.includes('--default-font-family')) {
          hasTwV4Tokens = true;
          dom.push({ selector: 'style:has-text(--default-font-family)' });
        }
        if (!hasVueScoped && /\[data-v-[a-f0-9]+\]/i.test(text)) {
          hasVueScoped = true;
          dom.push({ selector: 'style:has-text([data-v-])' });
        }
      };

      // 1. Inspect inline <style> tags
      const styleTags = document.querySelectorAll('style');
      styleTags.forEach((st) => {
        checkCssText(st.textContent || '');
      });

      // 2. Safely inspect accessible document.styleSheets (same-origin linked stylesheets)
      if (typeof document !== 'undefined' && document.styleSheets) {
        const maxSheets = Math.min(document.styleSheets.length, 10);
        for (let i = 0; i < maxSheets; i++) {
          if (hasTw && hasTwRing && hasTwV4Theme && hasTwV4Tokens && hasVueScoped) {
            break;
          }
          const sheet = document.styleSheets[i];
          try {
            const rules = sheet.cssRules;
            if (rules) {
              const maxRules = Math.min(rules.length, 30);
              for (let j = 0; j < maxRules; j++) {
                const rule = rules[j];
                if (rule && typeof rule.cssText === 'string') {
                  checkCssText(rule.cssText);
                }
              }
            }
          } catch {
            // Cross-origin CSSStyleSheet.cssRules throws SecurityError (DOMException)
            // Silently ignore to preserve sandbox security and performance
          }
        }
      }
    } catch {
      // Ignore stylesheet security restrictions
    }

    // Check for Tailwind CSS distinctive utility classes on sampled DOM elements
    // Inspects first 30 elements for combinations of distinctive utility patterns without full DOM traversal
    try {
      const sampleElements = Array.from(document.querySelectorAll('body, body *')).slice(0, 30);
      const variantRegex = /(?:^|\s)(?:sm|md|lg|xl|2xl|dark|hover|focus|active|group-hover|focus-within|peer-checked|disabled):[a-z0-9-]+/;
      const spacingRegex = /(?:^|\s)-?(?:space-[xy]|divide-[xy]|inset-[xy]|translate-[xy])-[0-9.]+/;
      const paletteRegex = /(?:^|\s)(?:bg|text|border|ring)-(?:slate|zinc|neutral|stone|emerald|indigo|violet|rose|amber|cyan|sky|teal|fuchsia|lime)-[0-9]{2,3}(?:\/[0-9]+)?/;
      const arbitraryRegex = /(?:^|\s)(?:bg|text|border|w|h|min-w|min-h|max-w|max-h|p|m|top|bottom|left|right|grid-cols|grid-rows)-\[[^\]]+\]/;
      const ringRegex = /(?:^|\s)ring(?:-offset)?-[0-9]+/;

      let variantCount = 0;
      let spacingCount = 0;
      let paletteCount = 0;
      let arbitraryCount = 0;
      let ringCount = 0;

      for (const el of sampleElements) {
        const cls = typeof el.className === 'string' ? el.className : (el.getAttribute('class') || '');
        if (!cls) continue;
        if (variantRegex.test(cls)) variantCount++;
        if (spacingRegex.test(cls)) spacingCount++;
        if (paletteRegex.test(cls)) paletteCount++;
        if (arbitraryRegex.test(cls)) arbitraryCount++;
        if (ringRegex.test(cls)) ringCount++;
      }

      let categories = 0;
      if (variantCount > 0) categories++;
      if (spacingCount > 0) categories++;
      if (paletteCount > 0) categories++;
      if (arbitraryCount > 0) categories++;
      if (ringCount > 0) categories++;

      const totalMatches = variantCount + spacingCount + paletteCount + arbitraryCount + ringCount;
      // Require multiple distinct utility categories or strong variant usage across elements
      if ((categories >= 2 && totalMatches >= 3) || (variantCount >= 2 && totalMatches >= 3)) {
        dom.push({ selector: 'dom:tailwind-utilities' });
      }
    } catch {
      // Graceful fallback
    }

    // Check for Vue.js scoped CSS attributes on root container and descendants
    try {
      const rootContainer = document.querySelector('#app, [id="__nuxt"], [data-v-app]');
      if (rootContainer) {
        const hasScoped = Array.from(rootContainer.attributes).some((a) => a.name.startsWith('data-v-')) ||
          Array.from(rootContainer.children).slice(0, 15).some((child) =>
            Array.from(child.attributes).some((a) => a.name.startsWith('data-v-'))
          );
        if (hasScoped) {
          dom.push({ selector: '[data-v-scoped]' });
        }
      }
    } catch {
      // Graceful fallback
    }
  } catch {
    // Graceful fallback
  }

  // 3. Harvest ResourceTiming Asset URLs
  const resources: string[] = [];
  try {
    if (typeof performance !== 'undefined' && typeof performance.getEntriesByType === 'function') {
      const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      const seenUrls = new Set<string>();

      for (const entry of entries) {
        const name = entry.name;
        // Ignore data: and blob: URIs
        if (name && !name.startsWith('data:') && !name.startsWith('blob:') && !seenUrls.has(name)) {
          seenUrls.add(name);
          resources.push(name);
          // Bound resource list to 350 max to keep memory overhead < 15KB
          if (resources.length >= 350) break;
        }
      }
    }
  } catch {
    // ResourceTiming disabled or unavailable
  }

  return {
    url,
    meta,
    dom,
    resources,
  };
}

// If loaded directly as content script
if (typeof window !== 'undefined' && typeof chrome !== 'undefined' && chrome.runtime?.onMessage) {
  chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
    if (request?.type === 'PROBE_ISOLATED_WORLD') {
      const payload = harvestIsolatedSignals();
      sendResponse(payload);
    }
    return true;
  });
}
