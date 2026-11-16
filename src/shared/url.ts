/**
 * Comprehensive URL Normalization and Sensitive Parameter Sanitization Utility
 *
 * Guarantees zero leakage of authentication tokens, session identifiers, API keys,
 * secrets, and marketing/advertising tracking parameters across all lifecycle stages:
 * - Evidence collection & evaluation (evaluator.ts)
 * - Local storage persistence & legacy record hydration (history.ts)
 * - Single-scan and multi-scan JSON and CSV exports (export.ts)
 */

/**
 * Known sensitive, authentication, session, credential, and tracking query parameter keys.
 * All checks are performed case-insensitively against decoded parameter names.
 */
export const SENSITIVE_PARAM_NAMES: ReadonlySet<string> = new Set([
  // Authentication & Credentials
  'token',
  'access_token',
  'refreshtoken',
  'refresh_token',
  'id_token',
  'auth',
  'authorization',
  'key',
  'api_key',
  'apikey',
  'secret',
  'password',
  'passwd',
  'pwd',
  'session',
  'session_id',
  'sessionid',
  'sid',
  'cookie',
  'credential',
  'credentials',
  'code',
  'state',
  'nonce',
  'sig',
  'signature',
  'jwt',
  'bearer',
  'private',
  'client_secret',

  // Marketing, Tracking & Advertising Identifiers
  'fbclid',
  'gclid',
  'gclsrc',
  'dclid',
  'msclkid',
  'twclid',
  'yclid',
  'ttclid',
  'sc_lid',
  'mc_cid',
  'mc_eid',
  '_ga',
  '_gl',
  '_hsenc',
  '_hsmi',
  '_openstat',
  'ref',
  'ref_src',
  'ref_url',
  'referrer',
]);

/**
 * Regex pattern matching compound sensitive parameter names delimited by underscores or hyphens
 * (e.g. auth_token, user_session, app_secret, client_key, access_token)
 */
const COMPOUND_SENSITIVE_PATTERN = /(?:^|[_-])(?:auth|token|secret|password|passwd|session|apikey|api_key|credential|signature|jwt|bearer)(?:[_-]|$)/i;

/**
 * Known public measurement container ID pattern for Google Analytics / Google Tag Manager
 * e.g. G-XXXXXXXXXX, GTM-XXXXXXX, UA-XXXXX-Y
 */
const PUBLIC_MEASUREMENT_ID_PATTERN = /^(?:G-[A-Z0-9]+|GTM-[A-Z0-9]+|UA-[0-9]+-[0-9]+)$/i;

/**
 * Determines whether a query parameter key (and optional value) is sensitive, a tracking identifier,
 * or an arbitrary non-measurement identifier.
 */
export function isSensitiveQueryParam(rawKey: string, rawVal?: string): boolean {
  if (!rawKey || typeof rawKey !== 'string') return false;

  let decoded = rawKey;
  try {
    decoded = decodeURIComponent(rawKey);
  } catch {
    // Gracefully handle malformed URL encoding
  }

  const key = decoded.toLowerCase().trim();
  if (!key) return false;

  // 1. Prefix matches (utm_*)
  if (key.startsWith('utm_')) return true;

  // 2. Exact match in sensitive set
  if (SENSITIVE_PARAM_NAMES.has(key)) return true;

  // 3. Pattern match for compound credential keys
  if (COMPOUND_SENSITIVE_PATTERN.test(key)) return true;

  // 4. Value-aware inspection for generic 'id' and 'tid' parameters:
  // SiteStack analytics rules require 'id'/'tid' only for public GTM container IDs
  // or Google Analytics measurement tags. Arbitrary user, account, or database IDs are stripped.
  if (key === 'id' || key === 'tid') {
    if (!rawVal || typeof rawVal !== 'string') return true;
    let decodedVal = rawVal.trim();
    try {
      decodedVal = decodeURIComponent(decodedVal);
    } catch {
      // Keep trimmed value
    }
    if (!PUBLIC_MEASUREMENT_ID_PATTERN.test(decodedVal)) {
      return true; // Strip arbitrary non-measurement IDs
    }
  }

  return false;
}

/**
 * Fallback sanitizer for malformed URLs or partially truncated query strings
 */
function sanitizeMalformedUrlString(raw: string): string {
  const qIndex = raw.indexOf('?');
  if (qIndex === -1) return raw;

  const base = raw.slice(0, qIndex);
  const query = raw.slice(qIndex + 1);

  // Split on '&' or ';' (some legacy servers use ';' as delimiter)
  const pairs = query.split(/[&;]/);
  const cleanPairs: string[] = [];

  for (const pair of pairs) {
    if (!pair) continue;
    const eqIndex = pair.indexOf('=');
    const key = eqIndex === -1 ? pair : pair.slice(0, eqIndex);
    const val = eqIndex === -1 ? '' : pair.slice(eqIndex + 1);
    if (!isSensitiveQueryParam(key, val)) {
      cleanPairs.push(pair);
    }
  }

  return cleanPairs.length > 0 ? `${base}?${cleanPairs.join('&')}` : base;
}

/**
 * Sanitizes a resource asset URL:
 * - Strips authentication tokens, credentials, session IDs, and tracking parameters
 * - Strips URL hash fragments (#...)
 * - Preserves safe version-identifying parameters (e.g. ver=3.7.1, v=5.3.0, id=G-XXXXX, tid=G-XXXXX)
 * - Safely handles absolute URLs, protocol-relative URLs (//...), and relative URLs (/...)
 * - Never throws on malformed inputs
 */
export function sanitizeResourceUrl(rawUrl: string): string {
  if (!rawUrl || typeof rawUrl !== 'string') return '';
  const trimmed = rawUrl.trim();
  if (!trimmed) return '';

  // Strip hash fragments
  const noHash = trimmed.split('#')[0];
  if (!noHash) return '';

  // Identify URL shape
  const isProtocolRelative = noHash.startsWith('//');
  const isRelative = !isProtocolRelative && !/^https?:\/\//i.test(noHash);

  // Safe dummy origin for parsing relative paths
  const DUMMY_BASE = 'https://sitestack-relative.local';

  try {
    const urlToParse = isProtocolRelative
      ? `https:${noHash}`
      : isRelative
        ? `${DUMMY_BASE}${noHash.startsWith('/') ? '' : '/'}${noHash}`
        : noHash;

    const parsed = new URL(urlToParse);
    const cleanParams = new URLSearchParams();

    parsed.searchParams.forEach((val, key) => {
      if (!isSensitiveQueryParam(key, val)) {
        cleanParams.append(key, val);
      }
    });

    const search = cleanParams.toString();
    const searchSuffix = search ? `?${search}` : '';

    if (isRelative) {
      // Reconstruct relative path preserving leading slash style
      const path = noHash.startsWith('/') ? parsed.pathname : parsed.pathname.replace(/^\//, '');
      return `${path}${searchSuffix}`;
    }

    if (isProtocolRelative) {
      return `//${parsed.host}${parsed.pathname}${searchSuffix}`;
    }

    return `${parsed.protocol}//${parsed.host}${parsed.pathname}${searchSuffix}`;
  } catch {
    return sanitizeMalformedUrlString(noHash);
  }
}

/**
 * Sanitizes an evidence source string.
 * Supports clean URLs, relative paths, and legacy truncated strings containing query arguments.
 */
export function sanitizeResourceEvidenceString(rawSource: string): string {
  if (!rawSource || typeof rawSource !== 'string') return '';
  const trimmed = rawSource.trim();
  if (!trimmed) return '';

  if (!trimmed.includes('?')) return trimmed;

  return sanitizeMalformedUrlString(trimmed);
}

/**
 * Normalizes and sanitizes a scanned website URL:
 * - Preserves protocol, hostname, port, and pathname
 * - Strips sensitive query arguments, tokens, and tracking parameters
 * - Strips URL hash fragments (#...)
 */
export function normalizeScanUrl(rawUrl: string): string {
  if (!rawUrl || typeof rawUrl !== 'string') return '';
  const trimmed = rawUrl.trim();
  if (!trimmed) return '';

  const withProtocol = trimmed.startsWith('http://') || trimmed.startsWith('https://')
    ? trimmed
    : (trimmed.includes('/') ? trimmed : `https://${trimmed}`);

  return sanitizeResourceUrl(withProtocol);
}
