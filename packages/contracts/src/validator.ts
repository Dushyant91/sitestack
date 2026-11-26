/**
 * SiteStack Expansion v1 — Schema Validation Engine
 *
 * Lightweight, zero-dependency schema validator ensuring data integrity
 * for local storage, API requests/responses, and export formats.
 */

import {
  WebsiteIdentity,
  ScanSnapshot,
  TechnologyResult,
  EvidenceRecord,
  ComparisonResult,
  ResearchCollection,
  SavedWebsiteItem,
  ReportModel,
  MonitoringProfile,
  TechnologyChangeEvent,
  TechCategory,
  ConfidenceTier,
} from './types';

export interface ValidationSuccess<T> {
  success: true;
  data: T;
  errors?: never;
}

export interface ValidationFailure {
  success: false;
  data?: never;
  errors: string[];
}

export type ValidationResult<T> = ValidationSuccess<T> | ValidationFailure;

const VALID_CATEGORIES: ReadonlySet<TechCategory> = new Set([
  'cms',
  'framework',
  'library',
  'analytics',
  'marketing',
  'ecommerce',
  'payment',
  'infrastructure',
]);

const VALID_TIERS: ReadonlySet<ConfidenceTier> = new Set(['high', 'medium', 'low']);

/**
 * Normalizes a raw URL or domain string to a clean, lowercased domain and root domain.
 */
export function extractDomainParts(rawUrlOrDomain: string): { domain: string; rootDomain: string } {
  if (!rawUrlOrDomain || typeof rawUrlOrDomain !== 'string') {
    return { domain: 'unknown', rootDomain: 'unknown' };
  }
  let domain = rawUrlOrDomain.trim().toLowerCase();
  try {
    const url = new URL(domain.startsWith('http') ? domain : `https://${domain}`);
    domain = url.hostname.toLowerCase();
  } catch {
    domain = domain.replace(/^https?:\/\//, '').split('/')[0].split(':')[0].toLowerCase();
  }

  // Calculate root domain (handles basic two-level TLDs like co.uk, com.au or single TLD)
  const segments = domain.split('.');
  let rootDomain = domain;
  if (segments.length >= 3) {
    const lastTwo = segments.slice(-2).join('.');
    if (['co.uk', 'com.au', 'co.nz', 'co.jp', 'org.uk'].includes(lastTwo)) {
      rootDomain = segments.slice(-3).join('.');
    } else {
      rootDomain = segments.slice(-2).join('.');
    }
  }

  return { domain, rootDomain };
}

/**
 * Validates a WebsiteIdentity record
 */
export function validateWebsiteIdentity(input: unknown): ValidationResult<WebsiteIdentity> {
  const errors: string[] = [];
  if (!input || typeof input !== 'object') {
    return { success: false, errors: ['Input must be a non-null object'] };
  }
  const obj = input as Partial<WebsiteIdentity>;

  if (typeof obj.id !== 'string' || !obj.id.trim()) errors.push('id must be a non-empty string');
  if (typeof obj.domain !== 'string' || !obj.domain.trim()) errors.push('domain must be a non-empty string');
  if (typeof obj.rootDomain !== 'string' || !obj.rootDomain.trim()) errors.push('rootDomain must be a non-empty string');
  if (typeof obj.displayName !== 'string' || !obj.displayName.trim()) errors.push('displayName must be a non-empty string');
  if (typeof obj.canonicalUrl !== 'string' || !obj.canonicalUrl.startsWith('http')) errors.push('canonicalUrl must be a valid HTTP/HTTPS URL');
  if (typeof obj.firstSeenTimestamp !== 'number' || obj.firstSeenTimestamp <= 0) errors.push('firstSeenTimestamp must be a positive number');
  if (typeof obj.lastScannedTimestamp !== 'number' || obj.lastScannedTimestamp <= 0) errors.push('lastScannedTimestamp must be a positive number');

  if (errors.length > 0) return { success: false, errors };
  return { success: true, data: input as WebsiteIdentity };
}

/**
 * Validates an EvidenceRecord
 */
export function validateEvidenceRecord(input: unknown): ValidationResult<EvidenceRecord> {
  const errors: string[] = [];
  if (!input || typeof input !== 'object') {
    return { success: false, errors: ['Evidence record must be a non-null object'] };
  }
  const obj = input as Partial<EvidenceRecord>;

  const validTypes = ['global', 'meta', 'dom', 'resource', 'header', 'inferred'];
  if (!obj.type || !validTypes.includes(obj.type)) errors.push(`type must be one of: ${validTypes.join(', ')}`);
  if (typeof obj.source !== 'string' || !obj.source.trim()) errors.push('source must be a non-empty string');
  if (typeof obj.weight !== 'number') errors.push('weight must be a number');

  if (errors.length > 0) return { success: false, errors };
  return { success: true, data: input as EvidenceRecord };
}

/**
 * Validates a TechnologyResult
 */
export function validateTechnologyResult(input: unknown): ValidationResult<TechnologyResult> {
  const errors: string[] = [];
  if (!input || typeof input !== 'object') {
    return { success: false, errors: ['TechnologyResult must be a non-null object'] };
  }
  const obj = input as Partial<TechnologyResult>;

  if (typeof obj.id !== 'string' || !obj.id.trim()) errors.push('id must be a non-empty string');
  if (typeof obj.name !== 'string' || !obj.name.trim()) errors.push('name must be a non-empty string');
  if (!obj.category || !VALID_CATEGORIES.has(obj.category)) errors.push(`category must be one of: ${Array.from(VALID_CATEGORIES).join(', ')}`);
  if (typeof obj.confidenceScore !== 'number' || obj.confidenceScore < 0 || obj.confidenceScore > 100) errors.push('confidenceScore must be between 0 and 100');
  if (!obj.confidenceTier || !VALID_TIERS.has(obj.confidenceTier)) errors.push(`confidenceTier must be one of: ${Array.from(VALID_TIERS).join(', ')}`);
  if (obj.detectionType !== 'direct' && obj.detectionType !== 'inferred') errors.push("detectionType must be 'direct' or 'inferred'");
  if (!Array.isArray(obj.evidence)) errors.push('evidence must be an array');

  if (errors.length > 0) return { success: false, errors };
  return { success: true, data: input as TechnologyResult };
}

/**
 * Validates a complete ScanSnapshot (Schema v3.0.0)
 */
export function validateScanSnapshot(input: unknown): ValidationResult<ScanSnapshot> {
  const errors: string[] = [];
  if (!input || typeof input !== 'object') {
    return { success: false, errors: ['ScanSnapshot must be a non-null object'] };
  }
  const obj = input as Partial<ScanSnapshot>;

  if (typeof obj.id !== 'string' || !obj.id.trim()) errors.push('id must be a non-empty string');
  if (obj.schemaVersion !== '3.0.0') errors.push("schemaVersion must be '3.0.0'");
  if (typeof obj.timestamp !== 'number' || obj.timestamp <= 0) errors.push('timestamp must be a positive number');

  const targetValidation = validateWebsiteIdentity(obj.target);
  if (!targetValidation.success) {
    errors.push(...targetValidation.errors.map((e) => `target.${e}`));
  }

  if (!Array.isArray(obj.technologies)) {
    errors.push('technologies must be an array');
  } else {
    obj.technologies.forEach((t, i) => {
      const res = validateTechnologyResult(t);
      if (!res.success) {
        errors.push(...res.errors.map((e) => `technologies[${i}].${e}`));
      }
    });
  }

  if (!obj.stats || typeof obj.stats !== 'object') {
    errors.push('stats object is required');
  } else {
    if (typeof obj.stats.total !== 'number') errors.push('stats.total must be a number');
    if (typeof obj.stats.high !== 'number') errors.push('stats.high must be a number');
    if (typeof obj.stats.medium !== 'number') errors.push('stats.medium must be a number');
    if (typeof obj.stats.low !== 'number') errors.push('stats.low must be a number');
  }

  if (errors.length > 0) return { success: false, errors };
  return { success: true, data: input as ScanSnapshot };
}

/**
 * Validates a ComparisonResult
 */
export function validateComparisonResult(input: unknown): ValidationResult<ComparisonResult> {
  const errors: string[] = [];
  if (!input || typeof input !== 'object') {
    return { success: false, errors: ['ComparisonResult must be a non-null object'] };
  }
  const obj = input as Partial<ComparisonResult>;

  if (typeof obj.id !== 'string' || !obj.id.trim()) errors.push('id must be a non-empty string');
  if (typeof obj.baseSnapshotId !== 'string') errors.push('baseSnapshotId is required');
  if (typeof obj.targetSnapshotId !== 'string') errors.push('targetSnapshotId is required');
  if (typeof obj.isCrossDomain !== 'boolean') errors.push('isCrossDomain must be a boolean');
  if (typeof obj.comparedAt !== 'number') errors.push('comparedAt must be a timestamp');
  if (!Array.isArray(obj.technologies)) errors.push('technologies must be an array');
  if (!obj.stats || typeof obj.stats !== 'object') errors.push('stats object is required');

  if (errors.length > 0) return { success: false, errors };
  return { success: true, data: input as ComparisonResult };
}

/**
 * Validates a SavedWebsiteItem
 */
export function validateSavedWebsiteItem(input: unknown): ValidationResult<SavedWebsiteItem> {
  const errors: string[] = [];
  if (!input || typeof input !== 'object') {
    return { success: false, errors: ['SavedWebsiteItem must be a non-null object'] };
  }
  const obj = input as Partial<SavedWebsiteItem>;

  if (typeof obj.id !== 'string' || !obj.id.trim()) errors.push('id must be a non-empty string');
  if (typeof obj.domain !== 'string' || !obj.domain.trim()) errors.push('domain must be a non-empty string');
  if (typeof obj.displayName !== 'string') errors.push('displayName is required');
  if (typeof obj.notes !== 'string') errors.push('notes must be a string');
  if (!Array.isArray(obj.tags)) errors.push('tags must be an array of strings');
  if (typeof obj.isFavorite !== 'boolean') errors.push('isFavorite must be a boolean');

  if (errors.length > 0) return { success: false, errors };
  return { success: true, data: input as SavedWebsiteItem };
}

/**
 * Validates a ResearchCollection
 */
export function validateResearchCollection(input: unknown): ValidationResult<ResearchCollection> {
  const errors: string[] = [];
  if (!input || typeof input !== 'object') {
    return { success: false, errors: ['ResearchCollection must be a non-null object'] };
  }
  const obj = input as Partial<ResearchCollection>;

  if (typeof obj.id !== 'string' || !obj.id.trim()) errors.push('id must be a non-empty string');
  if (typeof obj.name !== 'string' || !obj.name.trim()) errors.push('name must be a non-empty string');
  if (typeof obj.createdAt !== 'number') errors.push('createdAt must be a timestamp');
  if (!Array.isArray(obj.websites)) errors.push('websites must be an array');
  if (!Array.isArray(obj.tags)) errors.push('tags must be an array of strings');

  if (errors.length > 0) return { success: false, errors };
  return { success: true, data: input as ResearchCollection };
}

/**
 * Validates a ReportModel
 */
export function validateReportModel(input: unknown): ValidationResult<ReportModel> {
  const errors: string[] = [];
  if (!input || typeof input !== 'object') {
    return { success: false, errors: ['ReportModel must be a non-null object'] };
  }
  const obj = input as Partial<ReportModel>;

  if (typeof obj.id !== 'string' || !obj.id.trim()) errors.push('id must be a non-empty string');
  if (typeof obj.title !== 'string' || !obj.title.trim()) errors.push('title must be a non-empty string');
  const validReportTypes = ['website_stack', 'technology_inventory', 'architecture_intelligence', 'stack_comparison'];
  if (!obj.type || !validReportTypes.includes(obj.type)) errors.push(`type must be one of: ${validReportTypes.join(', ')}`);
  if (!obj.redactionConfig || typeof obj.redactionConfig !== 'object') errors.push('redactionConfig is required');
  if (!Array.isArray(obj.sections)) errors.push('sections must be an array');

  if (errors.length > 0) return { success: false, errors };
  return { success: true, data: input as ReportModel };
}

/**
 * Validates a MonitoringProfile
 */
export function validateMonitoringProfile(input: unknown): ValidationResult<MonitoringProfile> {
  const errors: string[] = [];
  if (!input || typeof input !== 'object') {
    return { success: false, errors: ['MonitoringProfile must be a non-null object'] };
  }
  const obj = input as Partial<MonitoringProfile>;

  if (typeof obj.id !== 'string' || !obj.id.trim()) errors.push('id must be a non-empty string');
  if (typeof obj.domain !== 'string' || !obj.domain.trim()) errors.push('domain must be a non-empty string');
  if (typeof obj.url !== 'string' || !obj.url.startsWith('http')) errors.push('url must be a valid HTTP URL');
  if (typeof obj.checkIntervalHours !== 'number' || obj.checkIntervalHours <= 0) errors.push('checkIntervalHours must be a positive number');
  if (!obj.status || !['active', 'paused', 'error'].includes(obj.status)) errors.push("status must be 'active', 'paused', or 'error'");
  if (!obj.notificationPreferences || typeof obj.notificationPreferences !== 'object') errors.push('notificationPreferences is required');

  if (errors.length > 0) return { success: false, errors };
  return { success: true, data: input as MonitoringProfile };
}

/**
 * Validates a TechnologyChangeEvent
 */
export function validateTechnologyChangeEvent(input: unknown): ValidationResult<TechnologyChangeEvent> {
  const errors: string[] = [];
  if (!input || typeof input !== 'object') {
    return { success: false, errors: ['TechnologyChangeEvent must be a non-null object'] };
  }
  const obj = input as Partial<TechnologyChangeEvent>;

  if (typeof obj.id !== 'string' || !obj.id.trim()) errors.push('id must be a non-empty string');
  if (typeof obj.profileId !== 'string') errors.push('profileId is required');
  if (typeof obj.domain !== 'string') errors.push('domain is required');
  const validEventTypes = ['technology_added', 'technology_removed', 'version_changed', 'confidence_shifted'];
  if (!obj.type || !validEventTypes.includes(obj.type)) errors.push(`type must be one of: ${validEventTypes.join(', ')}`);
  if (typeof obj.technologyId !== 'string') errors.push('technologyId is required');
  if (typeof obj.technologyName !== 'string') errors.push('technologyName is required');

  if (errors.length > 0) return { success: false, errors };
  return { success: true, data: input as TechnologyChangeEvent };
}
