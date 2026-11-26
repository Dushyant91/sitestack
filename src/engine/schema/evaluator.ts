/**
 * SiteStack Declarative Detection Evaluator
 * Location: src/engine/schema/evaluator.ts
 *
 * Consumes schema-v2 NormalizedEvidence as its authoritative input.
 * Implements claim-scope classification, class diminishing returns,
 * corroboration multipliers, scope ceilings, version extraction, and
 * declarative relationship resolution with 100% behavioral equivalence
 * to the baseline detection engine.
 */

import {
  DetectedTechnology,
  ScanResult,
  SignalEvidence,
  ConfidenceTier,
  SignalType,
  HarvestedSignals,
  TechRule,
} from '../types';
import {
  NormalizedEvidence,
  TechnologyDefinition,
} from './types';
import {
  CANONICAL_TECHNOLOGY_DEFINITIONS,
  DEFINITIONS_BY_ID,
} from './definitions';
import { extractVersion, classifyVersionMaturity, cleanVersion } from '../version';
import { sanitizeResourceUrl, normalizeScanUrl } from '../../shared/url';

export const SCORE_HIGH_THRESHOLD = 80;
export const SCORE_MEDIUM_THRESHOLD = 50;
export const SCORE_MIN_THRESHOLD = 30; // Noise floor

/**
 * Calculates confidence tier from numerical score
 */
export function getConfidenceTier(score: number): ConfidenceTier {
  if (score >= SCORE_HIGH_THRESHOLD) return 'high';
  if (score >= SCORE_MEDIUM_THRESHOLD) return 'medium';
  return 'low';
}

/**
 * Truncates long resource URLs while preserving hostname, path, and script name.
 */
export function truncateResourceUrl(url: string, maxLength = 85): string {
  const clean = sanitizeResourceUrl(url);
  if (clean.length <= maxLength) return clean;
  try {
    const parsed = new URL(
      clean.startsWith('http') ? clean : `https://example.com${clean.startsWith('/') ? '' : '/'}${clean}`
    );
    const cleanBase = `${clean.startsWith('http') ? parsed.origin : ''}${parsed.pathname}`;
    if (parsed.search && cleanBase.length < maxLength) {
      const remaining = maxLength - cleanBase.length;
      return `${cleanBase}?${parsed.search.slice(1, Math.max(1, remaining - 4))}...`;
    }
    return '...' + clean.slice(-(maxLength - 3));
  } catch {
    return '...' + clean.slice(-(maxLength - 3));
  }
}

/**
 * Contextual metadata passed into evaluation
 */
export interface EvaluationContext {
  url?: string;
  signals?: HarvestedSignals;
  legacyRules?: TechRule[];
}

/**
 * Main Declarative Evaluation Engine
 * Consumes NormalizedEvidence[] directly as authoritative input.
 */
export function evaluateNormalizedEvidence(
  evidence: NormalizedEvidence[],
  context: EvaluationContext = {},
  definitions: TechnologyDefinition[] = CANONICAL_TECHNOLOGY_DEFINITIONS
): ScanResult {
  const startTime = performance.now();
  const detectedMap = new Map<string, DetectedTechnology>();

  // 1. Group NormalizedEvidence by Technology ID
  const techEvidenceMap = new Map<string, NormalizedEvidence[]>();

  for (const item of evidence) {
    let techId: string | undefined;

    if (item.fingerprintId) {
      const colonIdx = item.fingerprintId.indexOf(':');
      if (colonIdx > 0) {
        techId = item.fingerprintId.slice(0, colonIdx);
      }
    }

    // Fallback: search definitions if fingerprintId missing
    if (!techId) {
      for (const def of definitions) {
        if (def.fingerprints.some((f) => f.id === item.fingerprintId)) {
          techId = def.id;
          break;
        }
      }
    }

    if (techId) {
      let list = techEvidenceMap.get(techId);
      if (!list) {
        list = [];
        techEvidenceMap.set(techId, list);
      }
      list.push(item);
    }
  }

  // 2. Evaluate Each Technology Definition
  for (const def of definitions) {
    const rawEvidenceList = techEvidenceMap.get(def.id);
    if (!rawEvidenceList || rawEvidenceList.length === 0) {
      continue;
    }

    // Deduplicate identical fingerprints within this technology
    const seenFingerprintIds = new Set<string>();
    const matchedEvidence: NormalizedEvidence[] = [];

    for (const ev of rawEvidenceList) {
      const dedupKey = ev.fingerprintId || `${ev.type}:${ev.source}`;
      if (seenFingerprintIds.has(dedupKey)) {
        continue;
      }
      seenFingerprintIds.add(dedupKey);
      matchedEvidence.push(ev);
    }

    if (matchedEvidence.length === 0) {
      continue;
    }

    const matchedSignalTypes = new Set<SignalType>();

    // Apply Resource Origin Deduplication
    const seenResourceOrigins = new Set<string>();
    for (const ev of matchedEvidence) {
      if (ev.type === 'resource') {
        let originKey = 'generic';
        try {
          const urlStr = ev.matchedValue || ev.source;
          const parsed = new URL(
            urlStr.startsWith('http') ? urlStr : `https://example.com${urlStr.startsWith('/') ? '' : '/'}${urlStr}`
          );
          const basePath = parsed.pathname.split('/').slice(0, 3).join('/');
          originKey = `${parsed.hostname}${basePath}`;
        } catch {
          originKey = (ev.matchedValue || ev.source).slice(0, 30);
        }

        const isDuplicateOrigin = seenResourceOrigins.has(originKey);
        seenResourceOrigins.add(originKey);

        ev.effectiveWeight = isDuplicateOrigin
          ? Math.min(5, Math.round(ev.baseWeight * 0.15))
          : ev.baseWeight;
      } else {
        ev.effectiveWeight = ev.baseWeight;
      }

      matchedSignalTypes.add(ev.type);
    }

    // Calculate Base Weight Sum with diminishing returns per signal class
    const classWeights: Record<SignalType, number[]> = {
      global: [],
      meta: [],
      dom: [],
      resource: [],
      header: [],
      inferred: [],
    };

    for (const ev of matchedEvidence) {
      classWeights[ev.type].push(ev.effectiveWeight ?? ev.baseWeight);
    }

    let baseWeightSum = 0;
    for (const [cls, weights] of Object.entries(classWeights)) {
      if (weights.length === 0) continue;
      weights.sort((a, b) => b - a);
      const primary = weights[0];
      const secondarySum = weights.slice(1).reduce((s, w) => s + w * 0.4, 0);
      const classCap = cls === 'resource' ? 50 : 60;
      const classTotal = Math.min(classCap, Math.round(primary + secondarySum));
      baseWeightSum += classTotal;
    }

    // Cross-Signal Corroboration Bonus
    const distinctClassCount = matchedSignalTypes.size;
    const corroborationBonus =
      distinctClassCount > 1 ? 1 + 0.15 * Math.min(2, distinctClassCount - 1) : 1.0;

    const rawScore = Math.round(baseWeightSum * corroborationBonus);
    let confidenceScore = Math.min(100, rawScore);

    // Apply rule-level score ceiling if specified and no server header corroboration is present
    if (
      typeof def.scoringPolicy.maxConfidenceScore === 'number' &&
      confidenceScore > def.scoringPolicy.maxConfidenceScore
    ) {
      const hasServerCorroboration = matchedEvidence.some((e) => e.type === 'header');
      if (!hasServerCorroboration) {
        confidenceScore = def.scoringPolicy.maxConfidenceScore;
      }
    }

    // If score is below noise floor (30), suppress it
    if (confidenceScore < SCORE_MIN_THRESHOLD) {
      continue;
    }

    // Version Extraction
    let version: string | undefined;

    // A. Extract from versionPolicy steps
    if (def.versionPolicy?.steps) {
      for (const step of def.versionPolicy.steps) {
        const matchingEv = matchedEvidence.find((e) => e.fingerprintId === step.fingerprintId);
        if (matchingEv?.matchedValue) {
          if (step.regex) {
            const m = matchingEv.matchedValue.match(new RegExp(step.regex.pattern, step.regex.flags));
            if (m && m[1]) {
              version = cleanVersion(m[1]);
            }
          } else {
            version = cleanVersion(matchingEv.matchedValue);
          }
          if (version) break;
        }
      }
    }

    // B. Fallback to legacy signals extractor if signals and legacyRules are present in context
    if (!version && context.signals && context.legacyRules) {
      const rule = context.legacyRules.find((r) => r.id === def.id);
      if (rule?.versionExtraction) {
        version = extractVersion(rule.versionExtraction, context.signals);
      }
    }

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

      // Structured claim-scope restriction evaluation
      const hasTelemetryScope = matchedEvidence.some(
        (e) => e.claimScope === 'telemetry_integration'
      );
      const hasNonAuthoritativeAssetScope = matchedEvidence.some(
        (e) =>
          e.claimScope === 'asset_delivery' &&
          def.scoringPolicy.authoritativeScope === 'runtime_execution'
      );

      if (
        def.scoringPolicy?.scopeRestrictionReason &&
        (hasTelemetryScope || hasNonAuthoritativeAssetScope)
      ) {
        confidenceReason = `${baseLowReason} ${def.scoringPolicy.scopeRestrictionReason}`;
      } else if (def.category === 'infrastructure') {
        confidenceReason = `${baseLowReason} Indicates client-side telemetry or service integration, not confirmed server infrastructure hosting.`;
      } else {
        confidenceReason = baseLowReason;
      }
    }

    // Next.js version transparency note
    if (def.id === 'nextjs' && !version) {
      confidenceReason +=
        def.versionPolicy?.missingVersionNote ||
        ' Next.js detected. The production build does not expose a reliable framework version, so SiteStack cannot determine the exact version.';
    }

    // Convert to output SignalEvidence
    const outputEvidence: SignalEvidence[] = matchedEvidence.map((ev) => ({
      type: ev.type,
      source: ev.source,
      matchedValue: ev.matchedValue,
      weight: ev.effectiveWeight ?? ev.baseWeight,
    }));

    detectedMap.set(def.id, {
      id: def.id,
      name: def.name,
      category: def.category,
      version,
      versionMaturity,
      confidenceScore,
      confidenceTier,
      detectionType: 'direct',
      confidenceReason,
      isInferred: false,
      evidence: outputEvidence,
      website: def.website,
      icon: def.icon,
      description: def.description,
    });
  }

  // 3. Declarative Relationship Resolution
  resolveRelationships(detectedMap, definitions);

  // 4. Sort technologies: confidence score descending, then name ascending
  const technologies = Array.from(detectedMap.values()).sort((a, b) => {
    if (b.confidenceScore !== a.confidenceScore) {
      return b.confidenceScore - a.confidenceScore;
    }
    return a.name.localeCompare(b.name);
  });

  // 5. Calculate statistics
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

  const targetUrl = context.url || (context.signals?.url ?? '');
  let domain = targetUrl;
  try {
    const parsed = new URL(targetUrl);
    domain = parsed.hostname;
  } catch {
    // Keep raw string if invalid URL
  }

  return {
    url: normalizeScanUrl(targetUrl),
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

/**
 * Resolves implied technology dependencies based on declarative relationships
 */
export function resolveRelationships(
  detectedMap: Map<string, DetectedTechnology>,
  definitions: TechnologyDefinition[] = CANONICAL_TECHNOLOGY_DEFINITIONS
): void {
  for (const detected of Array.from(detectedMap.values())) {
    const def = definitions.find((d) => d.id === detected.id) || DEFINITIONS_BY_ID.get(detected.id);
    if (!def || !def.relationships) continue;

    for (const rel of def.relationships) {
      const impliedId = rel.targetTechnologyId;
      const targetDef = definitions.find((d) => d.id === impliedId) || DEFINITIONS_BY_ID.get(impliedId);
      if (!targetDef) continue;

      // Track dependency relationship on parent technology
      if (!detected.dependentTechnologies) {
        detected.dependentTechnologies = [];
      }
      if (!detected.dependentTechnologies.includes(targetDef.name)) {
        detected.dependentTechnologies.push(targetDef.name);
      }

      const existing = detectedMap.get(impliedId);

      // Evaluate independent proof criteria
      const hasIndependentEvidence =
        existing &&
        existing.evidence.some((ev) => {
          if (impliedId === 'vue' && (detected.id === 'vitepress' || detected.id === 'nuxt')) {
            return (
              ev.type === 'global' ||
              ev.type === 'resource' ||
              (ev.type === 'dom' && ev.source.includes('[data-v-app]'))
            );
          }
          if (impliedId === 'react' && (detected.id === 'nextjs' || detected.id === 'remix' || detected.id === 'docusaurus')) {
            return (
              (ev.type === 'global' && ev.source === 'window.React') ||
              (ev.type === 'dom' && ev.source.includes('[data-reactroot]'))
            );
          }
          if (impliedId === 'svelte' && detected.id === 'sveltekit') {
            return (
              ev.type === 'global' ||
              ev.type === 'resource' ||
              (ev.type === 'dom' && (ev.source.includes('svelte-') || (ev.matchedValue && ev.matchedValue.includes('svelte-'))))
            );
          }
          if (impliedId === 'wordpress' && detected.id === 'woocommerce') {
            if (detected.confidenceScore >= SCORE_HIGH_THRESHOLD) {
              return existing.confidenceScore >= (rel.independentProof.minScoreThreshold ?? 50);
            }
            return true;
          }
          if (impliedId === 'solidjs' && detected.id === 'solidstart') {
            return (
              (ev.type === 'global' && (ev.source.includes('_$HY') || ev.source.includes('SOLID'))) ||
              (ev.type === 'resource' && ev.source.includes('solid'))
            );
          }
          if (impliedId === 'qwik' && detected.id === 'qwik-city') {
            return (
              ev.source.includes('[q:container]') ||
              ev.source.includes('[q:version]') ||
              ev.source.includes('/build/q-')
            );
          }
          return ev.type !== 'inferred';
        });

      if (!existing || !hasIndependentEvidence) {
        let impliedScore: number;
        if (detected.confidenceScore >= rel.calibration.parentHighThreshold) {
          impliedScore = rel.calibration.parentHighInferredScore;
        } else if (detected.confidenceScore >= rel.calibration.parentMediumThreshold) {
          impliedScore = rel.calibration.parentMediumInferredScore;
        } else {
          impliedScore = rel.calibration.parentLowInferredScore;
        }

        const tier = getConfidenceTier(impliedScore);
        const preservedDirect = existing ? existing.evidence.filter((e) => e.type !== 'inferred') : [];
        const primaryDirect = preservedDirect[0]?.source;

        let reason = '';
        if (primaryDirect && rel.reasonTemplates.inferredWithSupportingDirect) {
          reason = rel.reasonTemplates.inferredWithSupportingDirect
            .replace('{tier}', tier)
            .replace('{score}', String(impliedScore))
            .replace('{primaryDirect}', primaryDirect);
        } else {
          reason = rel.reasonTemplates.purelyInferred
            .replace('{tier}', tier)
            .replace('{score}', String(impliedScore));
        }

        const combinedEvidence: SignalEvidence[] = [
          {
            type: 'inferred',
            source: `Architectural dependency of ${detected.name} (${detected.name} requires ${targetDef.name})`,
            weight: impliedScore,
          },
          ...preservedDirect,
        ];

        detectedMap.set(impliedId, {
          id: targetDef.id,
          name: targetDef.name,
          category: targetDef.category,
          version: existing?.version,
          confidenceScore: impliedScore,
          confidenceTier: tier,
          detectionType: 'inferred',
          parentDependency: detected.name,
          confidenceReason: reason,
          isInferred: true,
          evidence: combinedEvidence,
          website: targetDef.website,
          icon: targetDef.icon,
          description: targetDef.description,
        });
      }
    }
  }
}
