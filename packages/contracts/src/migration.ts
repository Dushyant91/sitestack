/**
 * SiteStack Expansion v1 — Schema Migration & Hydration Engine
 *
 * Provides backward-compatible conversion from legacy v1 and v2 scan records
 * (e.g. from chrome.storage.local) into Schema v3.0.0 canonical ScanSnapshot instances.
 */

import { ScanResult, DetectedTechnology } from '../../../src/engine/types';
import { normalizeScanUrl, sanitizeResourceUrl, sanitizeResourceEvidenceString } from '../../../src/shared/url';
import { ScanSnapshot, TechnologyResult, EvidenceRecord, WebsiteIdentity, ArchitectureRelationshipResult } from './types';
import { extractDomainParts, validateScanSnapshot } from './validator';

/**
 * Strips known authentication and sensitive parameters from any arbitrary URL string.
 */
export function sanitizeUrlStrict(rawUrl: string): string {
  if (!rawUrl || typeof rawUrl !== 'string') return '';
  return sanitizeResourceUrl(rawUrl);
}

/**
 * Creates a normalized WebsiteIdentity from a URL or domain.
 */
export function createWebsiteIdentity(urlOrDomain: string, timestamp = Date.now(), customDisplayName?: string): WebsiteIdentity {
  const { domain, rootDomain } = extractDomainParts(urlOrDomain);
  const normalized = normalizeScanUrl(urlOrDomain);
  const cleanUrl = normalized || (urlOrDomain.startsWith('http')
    ? sanitizeResourceUrl(urlOrDomain)
    : `https://${domain}`);

  // Generate readable title: capitalize root domain name
  const rawName = domain.replace(/^www\./, '').split('.')[0];
  const displayName = customDisplayName || (rawName.charAt(0).toUpperCase() + rawName.slice(1));

  return {
    id: `site_${domain.replace(/[^a-z0-9]/g, '_')}`,
    domain,
    rootDomain,
    displayName,
    canonicalUrl: cleanUrl,
    firstSeenTimestamp: timestamp,
    lastScannedTimestamp: timestamp,
  };
}

/**
 * Converts a legacy DetectedTechnology or v2 technology result into canonical TechnologyResult.
 */
export function migrateTechnologyResult(raw: DetectedTechnology | any): TechnologyResult {
  const id = raw.id || (raw.name ? raw.name.toLowerCase().replace(/[^a-z0-9]/g, '') : 'unknown');
  const confidenceScore = typeof raw.confidenceScore === 'number'
    ? raw.confidenceScore
    : (String(raw.confidence).toLowerCase() === 'high' ? 85 : String(raw.confidence).toLowerCase() === 'medium' ? 60 : 35);
  const confidenceTier: 'high' | 'medium' | 'low' = (
    raw.confidenceTier
      ? String(raw.confidenceTier).toLowerCase()
      : (raw.confidence
          ? String(raw.confidence).toLowerCase()
          : (confidenceScore >= 70 ? 'high' : confidenceScore >= 40 ? 'medium' : 'low'))
  ) as 'high' | 'medium' | 'low';

  const evidence: EvidenceRecord[] = (raw.evidence || []).map((ev: any) => ({
    type: ev.type,
    source: sanitizeResourceEvidenceString(ev.source),
    matchedValue: ev.matchedValue ? sanitizeResourceEvidenceString(ev.matchedValue) : undefined,
    weight: ev.weight || 0,
    claimScope: ev.type === 'global' ? 'runtime_execution' : (ev.type === 'dom' ? 'dom_structure' : 'asset_delivery'),
  }));

  const detectionType: 'direct' | 'inferred' = raw.detectionType || (raw.isInferred ? 'inferred' : 'direct');

  return {
    id,
    name: raw.name || id,
    category: raw.category || 'library',
    version: raw.version,
    versionMaturity: raw.versionMaturity || 'stable',
    confidenceScore,
    confidenceTier,
    detectionType,
    parentDependency: raw.parentDependency,
    confidenceReason: raw.confidenceReason || `${confidenceTier.toUpperCase()} confidence (${detectionType}) based on observed signals.`,
    evidence,
    website: raw.website || '',
    icon: raw.icon || '',
    description: raw.description || '',
  };
}

/**
 * Migrates any legacy ScanResult (v1.0.0 through v1.1.2) into a Schema v3.0.0 ScanSnapshot.
 */
export function migrateToScanSnapshot(legacy: ScanResult | Record<string, unknown>, scope: ScanSnapshot['scope'] = 'extension_popup'): ScanSnapshot {
  const rawUrl = typeof legacy.url === 'string' ? legacy.url : '';
  const rawDomain = typeof legacy.domain === 'string' ? legacy.domain : (rawUrl || 'unknown');
  const timestamp = typeof legacy.timestamp === 'number' && legacy.timestamp > 0 ? legacy.timestamp : Date.now();

  const target = createWebsiteIdentity(rawUrl || rawDomain, timestamp);

  const rawTechs = Array.isArray(legacy.technologies) ? (legacy.technologies as DetectedTechnology[]) : [];
  const technologies: TechnologyResult[] = rawTechs.map(migrateTechnologyResult);

  // Derive stats if missing or incomplete
  let high = 0;
  let medium = 0;
  let low = 0;
  let inferred = 0;

  for (const t of technologies) {
    if (t.confidenceTier === 'high') high++;
    else if (t.confidenceTier === 'medium') medium++;
    else if (t.confidenceTier === 'low') low++;

    if (t.detectionType === 'inferred') inferred++;
  }

  const stats = {
    total: technologies.length,
    high,
    medium,
    low,
    inferred,
  };

  const timing = {
    engineDurationMs: typeof legacy.engineEvaluationDurationMs === 'number'
      ? legacy.engineEvaluationDurationMs
      : (typeof legacy.scanDurationMs === 'number' ? legacy.scanDurationMs : 0),
    totalDurationMs: typeof legacy.scanDurationMs === 'number' ? legacy.scanDurationMs : undefined,
  };

  const relationships: ArchitectureRelationshipResult[] = [];
  // Build relationships from inferred parentDependencies
  for (const t of technologies) {
    if (t.parentDependency) {
      const parent = technologies.find((p) => p.id === t.parentDependency || p.name.toLowerCase() === t.parentDependency?.toLowerCase());
      if (parent) {
        relationships.push({
          id: `${parent.id}->${t.id}`,
          sourceId: parent.id,
          targetId: t.id,
          relationshipType: 'hard_dependency',
          description: `${parent.name} directly utilizes ${t.name}`,
          confidence: Math.min(parent.confidenceScore, t.confidenceScore),
        });
      }
    }
  }

  const snapshotId = typeof legacy.id === 'string' && legacy.id.trim()
    ? legacy.id.trim()
    : `scan_${target.domain.replace(/[^a-z0-9]/g, '_')}_${timestamp}`;

  const snapshot: ScanSnapshot = {
    id: snapshotId,
    schemaVersion: '3.0.0',
    target,
    timestamp,
    scope,
    technologies,
    relationships,
    stats,
    timing,
    metadata: {
      sanitizedUrl: target.canonicalUrl,
    },
  };

  const validated = validateScanSnapshot(snapshot);
  if (!validated.success) {
    throw new Error(`Migration produced invalid ScanSnapshot: ${validated.errors.join(', ')}`);
  }

  return snapshot;
}
