/**
 * SiteStack Expansion v1 — Report Redaction & Sanitization Engine
 *
 * Enforces enterprise-grade data privacy and confidentiality rules:
 * - Query token and secret stripping
 * - Optional private hostname masking
 * - Low-confidence signal filtering
 * - Deep asset URL redaction
 */

import {
  ScanSnapshot,
  ReportRedactionConfig,
  TechnologyResult,
  EvidenceRecord,
  WebsiteIdentity,
} from '../../contracts/src/types';
import { sanitizeResourceUrl, sanitizeResourceEvidenceString } from '../../../src/shared/url';

export const DEFAULT_REDACTION_CONFIG: ReportRedactionConfig = {
  maskQueryTokens: true,
  maskHostnames: false,
  hideLowConfidence: false,
  redactAssetUrls: false,
};

/**
 * Applies redaction policies to a ScanSnapshot according to the provided config.
 */
export function redactSnapshot(
  snapshot: ScanSnapshot,
  config: Partial<ReportRedactionConfig> = {}
): ScanSnapshot {
  const cfg: ReportRedactionConfig = { ...DEFAULT_REDACTION_CONFIG, ...config };

  // 1. Target URL & Hostname Redaction
  const redactedTarget: WebsiteIdentity = {
    ...snapshot.target,
    domain: cfg.maskHostnames ? maskDomain(snapshot.target.domain) : snapshot.target.domain,
    rootDomain: cfg.maskHostnames ? maskDomain(snapshot.target.rootDomain) : snapshot.target.rootDomain,
    displayName: cfg.maskHostnames ? 'Redacted Host' : snapshot.target.displayName,
    canonicalUrl: cfg.maskHostnames
      ? `https://${maskDomain(snapshot.target.domain)}/`
      : cfg.maskQueryTokens
      ? sanitizeResourceUrl(snapshot.target.canonicalUrl)
      : snapshot.target.canonicalUrl,
  };

  // 2. Technology Filtering & Redaction
  let technologies = [...snapshot.technologies];

  if (cfg.hideLowConfidence) {
    technologies = technologies.filter((t) => t.confidenceTier !== 'low' && t.confidenceScore >= 40);
  }

  technologies = technologies.map((t) => redactTechnology(t, cfg));

  // 3. Re-evaluate stats after filtering
  const stats = {
    total: technologies.length,
    high: technologies.filter((t) => t.confidenceTier === 'high').length,
    medium: technologies.filter((t) => t.confidenceTier === 'medium').length,
    low: technologies.filter((t) => t.confidenceTier === 'low').length,
    inferred: technologies.filter((t) => t.detectionType === 'inferred').length,
  };

  return {
    ...snapshot,
    target: redactedTarget,
    technologies,
    stats,
    metadata: snapshot.metadata
      ? {
          ...snapshot.metadata,
          sanitizedUrl: cfg.maskHostnames
            ? `https://${maskDomain(snapshot.target.domain)}/`
            : cfg.maskQueryTokens
            ? sanitizeResourceUrl(snapshot.metadata.sanitizedUrl)
            : snapshot.metadata.sanitizedUrl,
        }
      : undefined,
  };
}

/**
 * Redacts evidence and asset strings within a single TechnologyResult.
 */
export function redactTechnology(
  tech: TechnologyResult,
  cfg: ReportRedactionConfig
): TechnologyResult {
  const evidence: EvidenceRecord[] = tech.evidence.map((ev) => {
    let source = ev.source;
    let matchedValue = ev.matchedValue;

    if (cfg.maskQueryTokens) {
      source = sanitizeResourceEvidenceString(source);
      if (matchedValue) {
        matchedValue = sanitizeResourceEvidenceString(matchedValue);
      }
    }

    if (cfg.redactAssetUrls && ev.type === 'resource') {
      source = '[Redacted Asset URL]';
      if (matchedValue) matchedValue = '[Redacted]';
    }

    return {
      ...ev,
      source,
      matchedValue,
    };
  });

  return {
    ...tech,
    evidence,
  };
}

/**
 * Mask internal or private domain names for executive/anonymized distribution.
 */
export function maskDomain(domain: string): string {
  if (!domain) return 'redacted.local';
  const parts = domain.split('.');
  if (parts.length <= 1) return 'redacted.local';
  const tld = parts[parts.length - 1];
  return `redacted-${parts[0].substring(0, 3)}***.${tld}`;
}
