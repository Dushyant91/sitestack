/**
 * MAIN-world Probe
 * Executes directly in the page's execution context (world: 'MAIN')
 * Safely inspects an approved allowlist of read-only JavaScript global properties.
 * Returns only serializable JSON primitives back to the service worker.
 */

const APPROVED_GLOBAL_ALLOWLIST = [
  // CMS
  'wp',
  '_wpemojiSettings',
  'Shopify',
  'ShopifyAnalytics',
  'BOOMR',
  'Webflow',
  'wixBiSession',
  'wixPerformanceMeasurements',

  // Frameworks
  '__NEXT_DATA__',
  'next',
  'React',
  '__REACT_DEVTOOLS_GLOBAL_HOOK__',
  'Vue',
  '__VUE__',
  'ng',
  'getAllAngularRootElements',

  // Libraries
  'jQuery',
  '$',
  'bootstrap',

  // Analytics
  'gtag',
  'gaGlobal',
  'google_tag_data',
  'google_tag_manager',
  'dataLayer',
  'hj',
  '_hjSettings',

  // Marketing
  'fbq',
  '_fbq',
  '_hsq',
  'HubSpotConversations',
  'Intercom',
  'intercomSettings',

  // Ecommerce & Payments
  'woocommerce_params',
  'wc_cart_fragments_params',
  'Stripe',
  'Razorpay',

  // Infrastructure
  '__cfRLUnblockHandlers',
];

/**
 * Safely inspects allowed window properties and serializes clean snapshot
 */
export function harvestMainSignals(): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  if (typeof window === 'undefined') return result;

  for (const key of APPROVED_GLOBAL_ALLOWLIST) {
    try {
      const val = (window as unknown as Record<string, unknown>)[key];
      if (val !== undefined && val !== null) {
        // Handle specific objects with nested version numbers safely
        if (key === 'jQuery' || key === '$') {
          const fn = (val as Record<string, unknown>).fn;
          const jqueryVer = fn && typeof fn === 'object' ? (fn as Record<string, unknown>).jquery : undefined;
          result[key] = {
            fn: { jquery: typeof jqueryVer === 'string' ? jqueryVer : 'present' },
          };
        } else if (key === 'React') {
          const ver = (val as Record<string, unknown>).version;
          result[key] = {
            version: typeof ver === 'string' ? ver : undefined,
          };
        } else if (key === 'Vue') {
          const ver = (val as Record<string, unknown>).version;
          result[key] = {
            version: typeof ver === 'string' ? ver : undefined,
          };
        } else if (key === 'next') {
          const ver = (val as Record<string, unknown>).version;
          result[key] = {
            version: typeof ver === 'string' ? ver : undefined,
          };
        } else if (key === 'Shopify') {
          const theme = (val as Record<string, unknown>).theme;
          result[key] = {
            theme: theme && typeof theme === 'object' ? {
              name: (theme as Record<string, unknown>).name,
              version: (theme as Record<string, unknown>).version,
            } : {},
          };
        } else if (key === 'bootstrap') {
          const tooltip = (val as Record<string, unknown>).Tooltip;
          const ver = tooltip && typeof tooltip === 'object' ? (tooltip as Record<string, unknown>).VERSION : undefined;
          result[key] = {
            Tooltip: { VERSION: typeof ver === 'string' ? ver : undefined },
          };
        } else if (key === '__NEXT_DATA__') {
          const buildId = (val as Record<string, unknown>).buildId;
          const page = (val as Record<string, unknown>).page;
          result[key] = { buildId, page };
        } else if (typeof val === 'function') {
          result[key] = { __type: 'function' };
        } else if (typeof val === 'object') {
          // Store shallow existence marker for tracking objects
          result[key] = {};
        } else {
          // Primitive number/string/boolean
          result[key] = val;
        }
      }
    } catch {
      // Ignore security errors on restricted properties
    }
  }

  return result;
}
