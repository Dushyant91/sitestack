import { HarvestedMeta, HarvestedDomElement } from '../../engine/types';

export interface IsolatedProbePayload {
  url: string;
  meta: HarvestedMeta[];
  dom: HarvestedDomElement[];
  resources: string[];
}

/**
 * Known structural DOM selectors to probe without parsing full page body
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
  '[ng-app]',
  '[data-v-app]',
  'body.woocommerce',
  'body.woocommerce-page',
  '.woocommerce',
  'html[data-wf-page]',
  'html[data-wf-site]',
  'link[href*="cdn.shopify.com"]',
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

/**
 * Harvests DOM meta tags, structural selectors, and ResourceTiming asset URLs
 * Strictly read-only: never alters DOM, never accesses user input or passwords.
 */
export function harvestIsolatedSignals(): IsolatedProbePayload {
  const url = window.location.href;

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

    // Check for Tailwind CSS custom property signatures in stylesheets
    try {
      const styleTags = document.querySelectorAll('style');
      styleTags.forEach((st) => {
        const text = st.textContent || '';
        if (text.includes('--tw-')) {
          dom.push({ selector: 'style:has-text(--tw-)' });
        }
        if (text.includes('--tw-ring-offset-shadow')) {
          dom.push({ selector: 'style:has-text(--tw-ring-offset-shadow)' });
        }
        if (/\[data-v-[a-f0-9]+\]/i.test(text)) {
          dom.push({ selector: 'style:has-text([data-v-])' });
        }
      });
    } catch {
      // Ignore stylesheet security restrictions
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
