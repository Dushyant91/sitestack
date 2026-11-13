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
import { getNestedProperty, extractVersion } from './version';

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
            matchedValue: typeof val === 'object' ? '{...}' : String(val).slice(0, 50),
            weight: g.weight,
          });
          matchedSignalTypes.add('global');
        }
      }
    }
  }

  // 2. Evaluate Meta Tags (DOM)
  if (rule.signals.meta) {
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
  if (rule.signals.dom) {
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

  // 4. Evaluate Resources (Performance Timing / Script URLs)
  if (rule.signals.resources) {
    for (const r of rule.signals.resources) {
      for (const url of signals.resources) {
        if (r.urlRegex.test(url)) {
          matchedEvidence.push({
            type: 'resource',
            source: url.length > 70 ? '...' + url.slice(-67) : url,
            matchedValue: url,
            weight: r.weight,
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

  // Calculate Base Weight Sum
  const baseWeightSum = matchedEvidence.reduce((sum, ev) => sum + ev.weight, 0);

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

  return {
    id: rule.id,
    name: rule.name,
    category: rule.category,
    version,
    confidenceScore,
    confidenceTier: getConfidenceTier(confidenceScore),
    detectionType: 'direct',
    isInferred: false,
    evidence: matchedEvidence,
    website: rule.website,
    icon: rule.icon,
    description: rule.description,
  };
}

/**
 * Resolves implied technology dependencies (e.g. Next.js implies React)
 * Inferred technologies are explicitly marked with detectionType: 'inferred', isInferred: true,
 * and parentDependency set to the parent technology.
 * An inferred technology strictly inherits or is bounded by the parent's confidence score,
 * and NEVER contains direct DOM or runtime evidence.
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
      const parentRule = getRuleById(impliedId);
      if (!parentRule) continue;

      if (!existing) {
        // An inferred dependency's score is derived directly from and bounded by the parent's score.
        // It never exceeds the parent's score (e.g., if parent is 40 Low, inferred is 40 Low).
        const impliedScore = detected.confidenceScore;
        detectedMap.set(impliedId, {
          id: parentRule.id,
          name: parentRule.name,
          category: parentRule.category,
          confidenceScore: impliedScore,
          confidenceTier: detected.confidenceTier,
          detectionType: 'inferred',
          parentDependency: detected.name,
          isInferred: true,
          evidence: [
            {
              type: 'inferred',
              source: `Architectural dependency of ${detected.name} (${detected.name} is built upon ${parentRule.name})`,
              weight: impliedScore,
            },
          ],
          website: parentRule.website,
          icon: parentRule.icon,
          description: parentRule.description,
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
    scanDurationMs,
  };
}
