import {
  TechRule,
  HarvestedSignals,
  DetectedTechnology,
  SignalEvidence,
  ConfidenceTier,
  ScanResult,
  SignalType,
} from './types';
import { ALL_RULES, getRuleById } from './rules/registry';
import { getNestedProperty, extractVersion, classifyVersionMaturity } from './version';

/**
 * Score thresholds
 */
export const SCORE_HIGH_THRESHOLD = 80;
export const SCORE_MEDIUM_THRESHOLD = 50;
export const SCORE_MIN_THRESHOLD = 30; // Anything below 30 is discarded as noise

/**
 * Calculates confidence tier from numerical score
 */
export function getConfidenceTier(score: number): ConfidenceTier {
  if (score >= SCORE_HIGH_THRESHOLD) return 'high';
  if (score >= SCORE_MEDIUM_THRESHOLD) return 'medium';
  return 'low';
}

/**
 * Safely serializes matched global values into human-readable strings without placeholder "{...}"
 */
function formatMatchedValue(val: unknown): string {
  if (val === undefined || val === null) return '';
  if (typeof val === 'string') return val.slice(0, 80);
  if (typeof val === 'number' || typeof val === 'boolean') return String(val);
  if (typeof val === 'function') return 'function()';
  try {
    const keys = Object.keys(val as object);
    if (keys.length === 0) return 'present';
    const json = JSON.stringify(val);
    return json.length > 80 ? json.slice(0, 77) + '...' : json;
  } catch {
    return 'present';
  }
}

/**
 * Truncates long resource URLs while preserving hostname, path, and script name
 */
function truncateResourceUrl(url: string, maxLength = 85): string {
  if (url.length <= maxLength) return url;
  try {
    const parsed = new URL(url.startsWith('http') ? url : `https://example.com${url.startsWith('/') ? '' : '/'}${url}`);
    const cleanBase = `${url.startsWith('http') ? parsed.origin : ''}${parsed.pathname}`;
    if (parsed.search && cleanBase.length < maxLength) {
      const remaining = maxLength - cleanBase.length;
      return `${cleanBase}?${parsed.search.slice(1, Math.max(1, remaining - 4))}...`;
    }
    return '...' + url.slice(-(maxLength - 3));
  } catch {
    return '...' + url.slice(-(maxLength - 3));
  }
}

/**
 * Evaluates a single rule against harvested browser signals
 */
export function evaluateRule(
  rule: TechRule,
  signals: HarvestedSignals
): DetectedTechnology | null {
  const matchedEvidence: SignalEvidence[] = [];
  const matchedSignalTypes = new Set<SignalType>();

  // 1. Evaluate Globals (MAIN World)
  if (rule.signals.globals) {
    for (const g of rule.signals.globals) {
      const val = getNestedProperty(signals.globals, g.path);
      if (val !== undefined && val !== null) {
        if (!g.valueRegex || g.valueRegex.test(String(val))) {
          matchedEvidence.push({
            type: 'global',
            source: `window.${g.path}`,
            matchedValue: formatMatchedValue(val),
            weight: g.weight,
          });
          matchedSignalTypes.add('global');
        }
      }
    }
  }

  // 2. Evaluate Meta Tags (DOM)
  if (rule.signals.meta && Array.isArray(signals.meta)) {
    for (const m of rule.signals.meta) {
      for (const harvestedMeta of signals.meta) {
        const nameMatch = m.name && harvestedMeta.name?.toLowerCase() === m.name.toLowerCase();
        const propMatch = m.property && harvestedMeta.property?.toLowerCase() === m.property.toLowerCase();

        if (nameMatch || propMatch) {
          if (!m.contentRegex || m.contentRegex.test(harvestedMeta.content)) {
            matchedEvidence.push({
              type: 'meta',
              source: `<meta ${nameMatch ? `name="${harvestedMeta.name}"` : `property="${harvestedMeta.property}"`}>`,
              matchedValue: harvestedMeta.content.slice(0, 60),
              weight: m.weight,
            });
            matchedSignalTypes.add('meta');
            break; // One match per meta rule is sufficient
          }
        }
      }
    }
  }

  // 3. Evaluate DOM Selectors (DOM)
  if (rule.signals.dom && Array.isArray(signals.dom)) {
    for (const d of rule.signals.dom) {
      for (const harvestedDom of signals.dom) {
        if (harvestedDom.selector === d.selector) {
          if (!d.attribute || harvestedDom.attribute === d.attribute) {
            if (!d.valueRegex || (harvestedDom.value && d.valueRegex.test(harvestedDom.value))) {
              matchedEvidence.push({
                type: 'dom',
                source: `${d.selector}${d.attribute ? `[${d.attribute}]` : ''}`,
                matchedValue: harvestedDom.value ? harvestedDom.value.slice(0, 50) : undefined,
                weight: d.weight,
              });
              matchedSignalTypes.add('dom');
              break;
            }
          }
        }
      }
    }
  }

  // 4. Evaluate Resources (Performance Timing / Script URLs) with Origin Deduplication
  if (rule.signals.resources && Array.isArray(signals.resources)) {
    const seenResourceOrigins = new Set<string>();

    for (const r of rule.signals.resources) {
      for (const url of signals.resources) {
        if (r.urlRegex.test(url)) {
          // Extract origin + base path prefix for deduplication to prevent repeated URLs from the same bundle/CDN from stacking
          let originKey = 'generic';
          try {
            const parsed = new URL(url.startsWith('http') ? url : `https://example.com${url.startsWith('/') ? '' : '/'}${url}`);
            const basePath = parsed.pathname.split('/').slice(0, 3).join('/');
            originKey = `${parsed.hostname}${basePath}`;
          } catch {
            originKey = url.slice(0, 30);
          }

          const isDuplicateOrigin = seenResourceOrigins.has(originKey);
          seenResourceOrigins.add(originKey);

          // Primary resource from an origin gets full weight; secondary matching URLs from same bundle root get supporting weight (max 5pts)
          const effectiveWeight = isDuplicateOrigin ? Math.min(5, Math.round(r.weight * 0.15)) : r.weight;

          matchedEvidence.push({
            type: 'resource',
            source: truncateResourceUrl(url),
            matchedValue: url,
            weight: effectiveWeight,
          });
          matchedSignalTypes.add('resource');
          break; // Avoid multi-matching the same rule signal against 50 identical chunk urls
        }
      }
    }
  }

  // 5. Evaluate Headers
  if (rule.signals.headers && signals.headers) {
    for (const h of rule.signals.headers) {
      const headerVal = signals.headers[h.name.toLowerCase()];
      if (headerVal && h.valueRegex.test(headerVal)) {
        matchedEvidence.push({
          type: 'header',
          source: `header: ${h.name}`,
          matchedValue: headerVal.slice(0, 50),
          weight: h.weight,
        });
        matchedSignalTypes.add('header');
      }
    }
  }

  // If no evidence matched, technology is not detected
  if (matchedEvidence.length === 0) {
    return null;
  }

  // Calculate Base Weight Sum with diminishing returns for correlated signals within the same class
  // The highest signal in a class counts at 100%; subsequent signals in the same class count at 40%
  // Any single signal class is capped at 60 points, ensuring High confidence (>=80) strictly requires
  // independent cross-signal corroboration across at least 2 distinct signal classes.
  const classWeights: Record<SignalType, number[]> = {
    global: [],
    meta: [],
    dom: [],
    resource: [],
    header: [],
    inferred: [],
  };

  for (const ev of matchedEvidence) {
    classWeights[ev.type].push(ev.weight);
  }

  let baseWeightSum = 0;
  for (const [cls, weights] of Object.entries(classWeights)) {
    if (weights.length === 0) continue;
    // Sort descending: primary signal first
    weights.sort((a, b) => b - a);
    const primary = weights[0];
    const secondarySum = weights.slice(1).reduce((s, w) => s + w * 0.4, 0);
    // Resource class alone is capped at 50 to prevent network assets from reaching Medium without corroboration
    const classCap = cls === 'resource' ? 50 : 60;
    const classTotal = Math.min(classCap, Math.round(primary + secondarySum));
    baseWeightSum += classTotal;
  }

  // Cross-Signal Corroboration Bonus
  // Multiplier: 1.0 for 1 signal class, 1.15 for 2 classes, 1.30 for 3+ classes
  const distinctClassCount = matchedSignalTypes.size;
  const corroborationBonus = distinctClassCount > 1 ? 1 + 0.15 * Math.min(2, distinctClassCount - 1) : 1.0;

  const rawScore = Math.round(baseWeightSum * corroborationBonus);
  const confidenceScore = Math.min(100, rawScore);

  // If score is below noise floor (30), suppress it
  if (confidenceScore < SCORE_MIN_THRESHOLD) {
    return null;
  }

  // Version Extraction
  const version = extractVersion(rule.versionExtraction, signals);
  const versionMaturity = version ? classifyVersionMaturity(version) : undefined;
  const confidenceTier = getConfidenceTier(confidenceScore);
  const distinctClasses = Array.from(matchedSignalTypes);

  // Generate explainable justification
  let confidenceReason = '';
  if (confidenceTier === 'high') {
    confidenceReason = `High confidence (Direct): Corroborated across ${distinctClasses.length} independent signal classes (${distinctClasses.join(', ')}). Reliable proof of active execution.`;
  } else if (confidenceTier === 'medium') {
    const primary = matchedEvidence[0]?.source || 'primary signal';
    confidenceReason = `Medium confidence (Direct): Verified by ${primary}, but lacks multi-class corroboration to confirm full installation.`;
  } else {
    const primaryEv = matchedEvidence[0];
    const primary = primaryEv?.source || 'standalone asset';
    let baseLowReason = '';
    if (primaryEv?.type === 'global') {
      baseLowReason = `Low confidence (Direct): Identified via runtime global (${primary}) without corroborating DOM elements or script assets.`;
    } else if (primaryEv?.type === 'dom') {
      baseLowReason = `Low confidence (Direct): Identified via DOM element (${primary}) without corroborating runtime globals or script assets.`;
    } else if (primaryEv?.type === 'meta') {
      baseLowReason = `Low confidence (Direct): Identified via meta tag (${primary}) without corroborating runtime globals or script assets.`;
    } else if (primaryEv?.type === 'header') {
      baseLowReason = `Low confidence (Direct): Identified via response header (${primary}) without corroborating runtime globals or DOM elements.`;
    } else {
      baseLowReason = `Low confidence (Direct): Identified via standalone network asset (${primary}) without corroborating runtime globals or DOM elements.`;
    }

    if (rule.id === 'cloudflare' && matchedEvidence.some((e) => e.source.includes('beacon'))) {
      confidenceReason = `${baseLowReason} Observed Cloudflare Web Analytics beacon script indicates client-side telemetry, not confirmed Cloudflare hosting or DNS infrastructure.`;
    } else if (rule.id === 'vercel' && matchedEvidence.some((e) => e.source.includes('window.si') || e.source.includes('window.va'))) {
      confidenceReason = `${baseLowReason} Observed window.si / window.va indicates Vercel Speed Insights / Analytics telemetry, not confirmed Vercel deployment or cloud hosting.`;
    } else if (rule.category === 'infrastructure') {
      confidenceReason = `${baseLowReason} Indicates client-side telemetry or service integration, not confirmed server infrastructure hosting.`;
    } else if (rule.id === 'shopify') {
      confidenceReason = `${baseLowReason} Observed cdn.shopify.com asset indicates Shopify-hosted asset/CDN, not an active Shopify storefront.`;
    } else {
      confidenceReason = baseLowReason;
    }
  }

  // Next.js version transparency note
  if (rule.id === 'nextjs' && !version) {
    confidenceReason += ' Next.js detected. The production build does not expose a reliable framework version, so SiteStack cannot determine the exact version.';
  }

  return {
    id: rule.id,
    name: rule.name,
    category: rule.category,
    version,
    versionMaturity,
    confidenceScore,
    confidenceTier,
    detectionType: 'direct',
    confidenceReason,
    isInferred: false,
    evidence: matchedEvidence,
    website: rule.website,
    icon: rule.icon,
    description: rule.description,
  };
}

/**
 * Resolves implied technology dependencies (e.g. Next.js implies React, VitePress implies Vue.js)
 * Inferred technologies are explicitly marked with detectionType: 'inferred', isInferred: true,
 * and parentDependency set to the parent technology.
 * An inferred technology does NOT inherit the parent's confidence score. It receives an
 * independently calibrated confidence score reflecting architectural dependency without direct browser evidence.
 */
export function resolveImpliedTechnologies(
  detectedMap: Map<string, DetectedTechnology>,
  allRules: TechRule[] = ALL_RULES
): void {
  for (const detected of Array.from(detectedMap.values())) {
    const rule = allRules.find((r) => r.id === detected.id);
    if (!rule || !rule.implies) continue;

    for (const impliedId of rule.implies) {
      const existing = detectedMap.get(impliedId);
      const impliedRule = getRuleById(impliedId);
      if (!impliedRule) continue;

      // Track dependency relationship on parent technology
      if (!detected.dependentTechnologies) {
        detected.dependentTechnologies = [];
      }
      if (!detected.dependentTechnologies.includes(impliedRule.name)) {
        detected.dependentTechnologies.push(impliedRule.name);
      }

      // Check whether an existing detection has genuinely independent evidence
      // (e.g. for Vue implied by VitePress: scoped CSS alone without window.Vue, window.__VUE__, [data-v-app] or runtime scripts is NOT independent)
      const hasIndependentEvidence = existing && existing.evidence.some((ev) => {
        if (impliedId === 'vue' && detected.id === 'vitepress') {
          return (
            ev.type === 'global' ||
            ev.type === 'resource' ||
            (ev.type === 'dom' && ev.source.includes('[data-v-app]'))
          );
        }
        if (impliedId === 'react' && detected.id === 'nextjs') {
          return (
            (ev.type === 'global' && ev.source === 'window.React') ||
            (ev.type === 'dom' && ev.source.includes('[data-reactroot]'))
          );
        }
        if (impliedId === 'wordpress' && detected.id === 'woocommerce') {
          // If WooCommerce is detected with High confidence (>= 80), WordPress requires independent core proof (>= 50)
          // beyond isolated WooCommerce plugin asset URLs (/wp-content/plugins/woocommerce/)
          if (detected.confidenceScore >= SCORE_HIGH_THRESHOLD) {
            return existing.confidenceScore >= 50;
          }
          return true;
        }
        return ev.type !== 'inferred';
      });

      if (!existing || !hasIndependentEvidence) {
        // Independent confidence calibration for inferred technologies:
        // An inferred dependency does NOT inherit the parent's confidence score.
        // It is separately calibrated:
        // - Parent High (>= 80) -> Inferred calibrated to 75 (Medium, Inferred)
        // - Parent Medium (50-79) -> Inferred calibrated to 50 (Medium, Inferred)
        // - Parent Low (30-49) -> Inferred calibrated to 30 (Low, Inferred)
        let impliedScore: number;
        if (detected.confidenceScore >= SCORE_HIGH_THRESHOLD) {
          impliedScore = 75; // Known foundation of high-confidence parent, but lacks direct browser runtime proof
        } else if (detected.confidenceScore >= SCORE_MEDIUM_THRESHOLD) {
          impliedScore = 50;
        } else {
          impliedScore = 30;
        }

        const tier = getConfidenceTier(impliedScore);

        // Preserve any existing direct evidence as supporting signals
        const preservedDirect = existing ? existing.evidence.filter((e) => e.type !== 'inferred') : [];
        const primaryDirect = preservedDirect[0]?.source;

        let reason = '';
        if (impliedId === 'wordpress' && detected.id === 'woocommerce' && primaryDirect) {
          reason = `Architectural dependency: Inferred with ${tier} confidence (${impliedScore} pts) because WooCommerce is built upon WordPress, supported by observed asset path (${primaryDirect}). Direct WordPress core evidence was below the independent threshold.`;
        } else {
          reason = `Architectural dependency: Inferred with ${tier} confidence (${impliedScore} pts) because ${detected.name} is built upon ${impliedRule.name}. No direct browser runtime globals were exposed.`;
        }

        const combinedEvidence: SignalEvidence[] = [
          {
            type: 'inferred',
            source: `Architectural dependency of ${detected.name} (${detected.name} requires ${impliedRule.name})`,
            weight: impliedScore,
          },
          ...preservedDirect,
        ];

        detectedMap.set(impliedId, {
          id: impliedRule.id,
          name: impliedRule.name,
          category: impliedRule.category,
          version: existing?.version,
          confidenceScore: impliedScore,
          confidenceTier: tier,
          detectionType: 'inferred',
          parentDependency: detected.name,
          confidenceReason: reason,
          isInferred: true,
          evidence: combinedEvidence,
          website: impliedRule.website,
          icon: impliedRule.icon,
          description: impliedRule.description,
        });
      }
    }
  }
}

/**
 * Main evaluation entry point: scans all harvested signals against rule catalog
 */
export function evaluateSignals(
  signals: HarvestedSignals,
  rules: TechRule[] = ALL_RULES
): ScanResult {
  const startTime = performance.now();

  const detectedMap = new Map<string, DetectedTechnology>();

  // Evaluate each rule
  for (const rule of rules) {
    const result = evaluateRule(rule, signals);
    if (result) {
      detectedMap.set(result.id, result);
    }
  }

  // Resolve implied dependencies
  resolveImpliedTechnologies(detectedMap, rules);

  // Convert to sorted array (confidence descending, then name ascending)
  const technologies = Array.from(detectedMap.values()).sort((a, b) => {
    if (b.confidenceScore !== a.confidenceScore) {
      return b.confidenceScore - a.confidenceScore;
    }
    return a.name.localeCompare(b.name);
  });

  // Calculate statistics
  let high = 0;
  let medium = 0;
  let low = 0;

  for (const tech of technologies) {
    if (tech.confidenceTier === 'high') high++;
    else if (tech.confidenceTier === 'medium') medium++;
    else low++;
  }

  const endTime = performance.now();
  const scanDurationMs = Math.round((endTime - startTime) * 100) / 100;

  // Extract domain
  let domain = signals.url;
  try {
    const parsed = new URL(signals.url);
    domain = parsed.hostname;
  } catch {
    // Keep raw string if not a valid URL
  }

  return {
    url: signals.url,
    domain,
    timestamp: Date.now(),
    technologies,
    stats: {
      total: technologies.length,
      high,
      medium,
      low,
    },
    engineEvaluationDurationMs: scanDurationMs,
    scanDurationMs,
  };
}
