/**
 * SiteStack Schema Validator
 * Location: src/engine/schema/validator.ts
 *
 * Implements strict registration-time validation of TechnologyDefinitions
 * and full registry integrity checks (unique IDs, relationship DAG cycles,
 * collector compatibility, and authoritative header references).
 */

import {
  TechnologyDefinition,
  FingerprintDefinition,
  CollectorId,
  FingerprintKind,
  ClaimScope,
  EvidenceRole,
  StringMatchOperator,
  SchemaValidationError,
} from './types';
import { validateSerializableRegex } from './regex';

export { SchemaValidationError };

/** Permitted categories from v1.1.1 TechCategory */
const VALID_CATEGORIES = new Set([
  'cms',
  'framework',
  'library',
  'analytics',
  'marketing',
  'ecommerce',
  'payment',
  'infrastructure',
]);

/** Permitted claim scopes */
const VALID_CLAIM_SCOPES = new Set<ClaimScope>([
  'runtime_execution',
  'dom_structure',
  'hosting_infrastructure',
  'telemetry_integration',
  'asset_delivery',
]);

/** Permitted evidence roles */
const VALID_ROLES = new Set<EvidenceRole>([
  'direct',
  'supporting',
  'telemetry',
  'subordinate',
]);

/** Permitted string match operators */
const VALID_OPERATORS = new Set<StringMatchOperator>([
  'exists',
  'equals',
  'contains',
  'starts_with',
  'ends_with',
  'regex',
]);

/** Strict 1:1 mapping between FingerprintKind and CollectorId */
const KIND_TO_COLLECTOR: Record<FingerprintKind, CollectorId> = {
  global: 'collector:main:global',
  meta: 'collector:isolated:meta',
  dom_selector: 'collector:isolated:dom',
  dom_attribute: 'collector:isolated:dom',
  custom_element: 'collector:isolated:custom_element',
  css_property: 'collector:isolated:css_property',
  html_signature: 'collector:isolated:html_signature',
  resource_url: 'collector:isolated:resource',
  header: 'collector:background:header',
};

export interface ValidationReport {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface RegistryValidationResult extends ValidationReport {
  validDefinitions: TechnologyDefinition[];
  rejectedDefinitionIds: string[];
}

/**
 * Validates a single TechnologyDefinition.
 */
export function validateTechnologyDefinition(tech: TechnologyDefinition): ValidationReport {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!tech || typeof tech !== 'object') {
    return { valid: false, errors: ['Technology definition must be a valid object'], warnings: [] };
  }

  // 1. Schema Version
  if (tech.schemaVersion !== '2.0.0') {
    errors.push(`Invalid schemaVersion: expected "2.0.0", got "${tech.schemaVersion}"`);
  }

  // 2. Identity
  if (!tech.id || typeof tech.id !== 'string') {
    errors.push('Technology definition requires a non-empty string "id"');
  } else if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(tech.id)) {
    errors.push(`Technology id "${tech.id}" must be in kebab-case format (lowercase letters, numbers, hyphens)`);
  }

  if (!tech.name || typeof tech.name !== 'string' || tech.name.trim() === '') {
    errors.push(`Technology ${tech.id || 'unknown'} requires a non-empty string "name"`);
  }

  if (!tech.category || !VALID_CATEGORIES.has(tech.category)) {
    errors.push(
      `Technology ${tech.id}: Invalid category "${tech.category}". Must be one of: ${Array.from(VALID_CATEGORIES).join(', ')}`
    );
  }

  if (!tech.website || typeof tech.website !== 'string' || !/^https?:\/\/.+/.test(tech.website)) {
    errors.push(`Technology ${tech.id}: Invalid website URL "${tech.website}". Must begin with http:// or https://`);
  }

  if (!tech.icon || typeof tech.icon !== 'string' || tech.icon.trim() === '') {
    errors.push(`Technology ${tech.id}: Requires a non-empty icon path`);
  }

  if (!tech.description || typeof tech.description !== 'string' || tech.description.trim() === '') {
    errors.push(`Technology ${tech.id}: Requires a non-empty description`);
  }

  // 3. Fingerprints
  if (!Array.isArray(tech.fingerprints) || tech.fingerprints.length === 0) {
    errors.push(`Technology ${tech.id}: Must define at least one fingerprint`);
  } else {
    const seenFpIds = new Set<string>();

    for (let i = 0; i < tech.fingerprints.length; i++) {
      const fp = tech.fingerprints[i];
      const fpRef = fp?.id || `fingerprints[${i}]`;

      if (!fp || typeof fp !== 'object') {
        errors.push(`Technology ${tech.id}: ${fpRef} must be an object`);
        continue;
      }

      // Check ID
      if (!fp.id || typeof fp.id !== 'string') {
        errors.push(`Technology ${tech.id}: Fingerprint at index ${i} is missing a valid string "id"`);
      } else {
        if (!/^[a-z0-9-]+:[a-z0-9-_:]+$/.test(fp.id)) {
          errors.push(
            `Technology ${tech.id}: Fingerprint id "${fp.id}" must match pattern "\${techId}:\${name}"`
          );
        }
        if (seenFpIds.has(fp.id)) {
          errors.push(`Technology ${tech.id}: Duplicate fingerprint id detected within definition: "${fp.id}"`);
        } else {
          seenFpIds.add(fp.id);
        }
      }

      // Check Kind & Collector
      const expectedCollector = KIND_TO_COLLECTOR[fp.kind];
      if (!expectedCollector) {
        errors.push(`Technology ${tech.id}: Fingerprint ${fpRef} has invalid kind "${fp.kind}"`);
      } else if (fp.collectorId !== expectedCollector) {
        errors.push(
          `Technology ${tech.id}: Fingerprint ${fpRef} of kind "${fp.kind}" must use collector "${expectedCollector}", got "${fp.collectorId}"`
        );
      }

      // Check Weight
      if (typeof fp.weight !== 'number' || !Number.isInteger(fp.weight) || fp.weight < 1 || fp.weight > 100) {
        errors.push(`Technology ${tech.id}: Fingerprint ${fpRef} weight must be an integer between 1 and 100 (got ${fp.weight})`);
      }

      // Check Role
      if (!fp.role || !VALID_ROLES.has(fp.role)) {
        errors.push(`Technology ${tech.id}: Fingerprint ${fpRef} has invalid role "${fp.role}"`);
      }

      // Check ClaimScope
      if (!fp.claimScope || !VALID_CLAIM_SCOPES.has(fp.claimScope)) {
        errors.push(`Technology ${tech.id}: Fingerprint ${fpRef} has invalid claimScope "${fp.claimScope}"`);
      }

      // Validate Kind-Specific Constraints
      validateFingerprintKindSpecifics(tech.id, fp, errors);
    }
  }

  // 4. Scoring Policy
  if (!tech.scoringPolicy || typeof tech.scoringPolicy !== 'object') {
    errors.push(`Technology ${tech.id}: Missing required scoringPolicy`);
  } else {
    const sp = tech.scoringPolicy;
    if (!sp.authoritativeScope || !VALID_CLAIM_SCOPES.has(sp.authoritativeScope)) {
      errors.push(`Technology ${tech.id}: scoringPolicy.authoritativeScope "${sp.authoritativeScope}" is invalid`);
    }

    if (typeof sp.minAuthoritativeScoreForHigh !== 'number' || sp.minAuthoritativeScoreForHigh < 1 || sp.minAuthoritativeScoreForHigh > 100) {
      errors.push(`Technology ${tech.id}: scoringPolicy.minAuthoritativeScoreForHigh must be between 1 and 100`);
    }

    if (typeof sp.unverifiedScopeCeiling !== 'number' || sp.unverifiedScopeCeiling < 1 || sp.unverifiedScopeCeiling > 100) {
      errors.push(`Technology ${tech.id}: scoringPolicy.unverifiedScopeCeiling must be between 1 and 100`);
    }

    if (typeof sp.weakAuthoritativeCeiling !== 'number' || sp.weakAuthoritativeCeiling < 1 || sp.weakAuthoritativeCeiling > 100) {
      errors.push(`Technology ${tech.id}: scoringPolicy.weakAuthoritativeCeiling must be between 1 and 100`);
    }

    if (!sp.scopeRestrictionReason || typeof sp.scopeRestrictionReason !== 'string' || sp.scopeRestrictionReason.trim() === '') {
      errors.push(`Technology ${tech.id}: scoringPolicy.scopeRestrictionReason must be a non-empty string`);
    }

    if (sp.maxConfidenceScore !== undefined) {
      if (typeof sp.maxConfidenceScore !== 'number' || sp.maxConfidenceScore < 1 || sp.maxConfidenceScore > 100) {
        errors.push(`Technology ${tech.id}: scoringPolicy.maxConfidenceScore must be between 1 and 100`);
      }
    }

    // Authoritative Header Fingerprint References
    if (sp.authoritativeHeaderFingerprintIds) {
      if (!Array.isArray(sp.authoritativeHeaderFingerprintIds)) {
        errors.push(`Technology ${tech.id}: scoringPolicy.authoritativeHeaderFingerprintIds must be an array`);
      } else {
        const headerFps = (tech.fingerprints || []).filter((f) => f.kind === 'header');
        for (const authHeaderId of sp.authoritativeHeaderFingerprintIds) {
          const targetFp = headerFps.find((f) => f.id === authHeaderId);
          if (!targetFp) {
            errors.push(
              `Technology ${tech.id}: scoringPolicy.authoritativeHeaderFingerprintIds references non-existent or non-header fingerprint "${authHeaderId}"`
            );
          } else if (targetFp.kind === 'header' && targetFp.isAuthoritativeInfrastructure !== true) {
            errors.push(
              `Technology ${tech.id}: Header fingerprint "${authHeaderId}" referenced in authoritativeHeaderFingerprintIds must have isAuthoritativeInfrastructure: true`
            );
          }
        }
      }
    }
  }

  // 5. Version Policy
  if (tech.versionPolicy) {
    if (!Array.isArray(tech.versionPolicy.steps)) {
      errors.push(`Technology ${tech.id}: versionPolicy.steps must be an array`);
    } else {
      const definedFpIds = new Set((tech.fingerprints || []).map((f) => f.id));
      for (let sIdx = 0; sIdx < tech.versionPolicy.steps.length; sIdx++) {
        const step = tech.versionPolicy.steps[sIdx];
        if (!step || typeof step !== 'object') {
          errors.push(`Technology ${tech.id}: versionPolicy.steps[${sIdx}] must be an object`);
          continue;
        }
        if (!definedFpIds.has(step.fingerprintId)) {
          errors.push(
            `Technology ${tech.id}: versionPolicy.steps[${sIdx}] references undefined fingerprintId "${step.fingerprintId}"`
          );
        }
        if (step.regex) {
          try {
            validateSerializableRegex(step.regex);
            // Check that regex contains a capture group
            if (!/\([^?].*?\)/.test(step.regex.pattern)) {
              errors.push(
                `Technology ${tech.id}: versionPolicy.steps[${sIdx}] regex pattern "${step.regex.pattern}" must contain at least one capture group ()`
              );
            }
          } catch (rErr) {
            errors.push(
              `Technology ${tech.id}: versionPolicy.steps[${sIdx}] regex error: ${(rErr as Error).message}`
            );
          }
        }
      }
    }
  }

  // 6. Relationships (intra-definition validation)
  if (tech.relationships) {
    if (!Array.isArray(tech.relationships)) {
      errors.push(`Technology ${tech.id}: relationships must be an array`);
    } else {
      for (let rIdx = 0; rIdx < tech.relationships.length; rIdx++) {
        const rel = tech.relationships[rIdx];
        if (!rel || typeof rel !== 'object') {
          errors.push(`Technology ${tech.id}: relationships[${rIdx}] must be an object`);
          continue;
        }

        if (!rel.targetTechnologyId || typeof rel.targetTechnologyId !== 'string') {
          errors.push(`Technology ${tech.id}: relationships[${rIdx}] requires targetTechnologyId`);
        } else if (rel.targetTechnologyId === tech.id) {
          errors.push(`Technology ${tech.id}: Self-referential relationship detected (cannot target itself)`);
        }

        if (rel.relationshipType !== 'implies' && rel.relationshipType !== 'requires' && rel.relationshipType !== 'extends') {
          errors.push(`Technology ${tech.id}: relationships[${rIdx}] invalid relationshipType "${rel.relationshipType}"`);
        }

        if (!rel.calibration || typeof rel.calibration !== 'object') {
          errors.push(`Technology ${tech.id}: relationships[${rIdx}] missing calibration`);
        } else {
          const cal = rel.calibration;
          if (typeof cal.parentHighThreshold !== 'number' || cal.parentHighThreshold < 1 || cal.parentHighThreshold > 100) {
            errors.push(`Technology ${tech.id}: relationships[${rIdx}] invalid calibration.parentHighThreshold`);
          }
          if (typeof cal.parentHighInferredScore !== 'number' || cal.parentHighInferredScore < 1 || cal.parentHighInferredScore > 100) {
            errors.push(`Technology ${tech.id}: relationships[${rIdx}] invalid calibration.parentHighInferredScore`);
          }
        }

        if (!rel.reasonTemplates || typeof rel.reasonTemplates !== 'object') {
          errors.push(`Technology ${tech.id}: relationships[${rIdx}] missing reasonTemplates`);
        } else {
          if (!rel.reasonTemplates.purelyInferred || typeof rel.reasonTemplates.purelyInferred !== 'string') {
            errors.push(`Technology ${tech.id}: relationships[${rIdx}] requires reasonTemplates.purelyInferred`);
          }
          if (!rel.reasonTemplates.inferredWithSupportingDirect || typeof rel.reasonTemplates.inferredWithSupportingDirect !== 'string') {
            errors.push(`Technology ${tech.id}: relationships[${rIdx}] requires reasonTemplates.inferredWithSupportingDirect`);
          }
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validates kind-specific fields on a FingerprintDefinition.
 */
function validateFingerprintKindSpecifics(
  techId: string,
  fp: FingerprintDefinition,
  errors: string[]
): void {
  const fpRef = fp.id || fp.kind;

  switch (fp.kind) {
    case 'global': {
      if (!fp.target || typeof fp.target !== 'string' || fp.target.trim() === '') {
        errors.push(`Technology ${techId}: Global fingerprint ${fpRef} requires a non-empty target`);
      } else {
        const segments = fp.target.split('.');
        if (segments.length > 3) {
          errors.push(
            `Technology ${techId}: Global fingerprint ${fpRef} target "${fp.target}" exceeds max traversal depth of 3`
          );
        }
        for (const seg of segments) {
          if (!/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(seg)) {
            errors.push(
              `Technology ${techId}: Global fingerprint ${fpRef} target "${fp.target}" contains invalid identifier segment "${seg}"`
            );
          }
        }
      }

      if (fp.operator !== 'exists' && fp.operator !== 'equals' && fp.operator !== 'regex') {
        errors.push(`Technology ${techId}: Global fingerprint ${fpRef} invalid operator "${fp.operator}"`);
      }

      if (fp.operator === 'regex') {
        if (!fp.regex) {
          errors.push(`Technology ${techId}: Global fingerprint ${fpRef} operator is "regex" but no regex provided`);
        } else {
          try {
            validateSerializableRegex(fp.regex);
          } catch (rErr) {
            errors.push(`Technology ${techId}: Global fingerprint ${fpRef} regex error: ${(rErr as Error).message}`);
          }
        }
      }
      break;
    }

    case 'meta': {
      if (!fp.metaName && !fp.metaProperty) {
        errors.push(`Technology ${techId}: Meta fingerprint ${fpRef} requires either metaName or metaProperty`);
      }
      if (!VALID_OPERATORS.has(fp.operator)) {
        errors.push(`Technology ${techId}: Meta fingerprint ${fpRef} invalid operator "${fp.operator}"`);
      }
      if (fp.operator === 'regex') {
        if (!fp.regex) {
          errors.push(`Technology ${techId}: Meta fingerprint ${fpRef} operator is "regex" but no regex provided`);
        } else {
          try {
            validateSerializableRegex(fp.regex);
          } catch (rErr) {
            errors.push(`Technology ${techId}: Meta fingerprint ${fpRef} regex error: ${(rErr as Error).message}`);
          }
        }
      }
      break;
    }

    case 'dom_selector': {
      if (!fp.selector || typeof fp.selector !== 'string' || fp.selector.trim() === '') {
        errors.push(`Technology ${techId}: DomSelector fingerprint ${fpRef} requires a non-empty selector`);
      } else if (!isValidCssSelector(fp.selector)) {
        errors.push(`Technology ${techId}: DomSelector fingerprint ${fpRef} has invalid selector "${fp.selector}"`);
      }
      break;
    }

    case 'dom_attribute': {
      if (!fp.selector || typeof fp.selector !== 'string' || fp.selector.trim() === '') {
        errors.push(`Technology ${techId}: DomAttribute fingerprint ${fpRef} requires a non-empty selector`);
      } else if (!isValidCssSelector(fp.selector)) {
        errors.push(`Technology ${techId}: DomAttribute fingerprint ${fpRef} has invalid selector "${fp.selector}"`);
      }
      if (!fp.attributeName || typeof fp.attributeName !== 'string' || !/^[a-zA-Z0-9_:-]+$/.test(fp.attributeName)) {
        errors.push(`Technology ${techId}: DomAttribute fingerprint ${fpRef} has invalid attributeName "${fp.attributeName}"`);
      }
      if (!VALID_OPERATORS.has(fp.operator)) {
        errors.push(`Technology ${techId}: DomAttribute fingerprint ${fpRef} invalid operator "${fp.operator}"`);
      }
      if (fp.operator === 'regex') {
        if (!fp.regex) {
          errors.push(`Technology ${techId}: DomAttribute fingerprint ${fpRef} operator is "regex" but no regex provided`);
        } else {
          try {
            validateSerializableRegex(fp.regex);
          } catch (rErr) {
            errors.push(`Technology ${techId}: DomAttribute fingerprint ${fpRef} regex error: ${(rErr as Error).message}`);
          }
        }
      }
      break;
    }

    case 'custom_element': {
      if (!fp.tagName || typeof fp.tagName !== 'string' || !/^[a-z][a-z0-9_-]*$/.test(fp.tagName)) {
        errors.push(`Technology ${techId}: CustomElement fingerprint ${fpRef} has invalid tagName "${fp.tagName}"`);
      }
      break;
    }

    case 'resource_url': {
      if (fp.operator !== 'contains' && fp.operator !== 'starts_with' && fp.operator !== 'regex') {
        errors.push(`Technology ${techId}: ResourceUrl fingerprint ${fpRef} invalid operator "${fp.operator}"`);
      }
      if (fp.operator === 'regex') {
        if (!fp.regex) {
          errors.push(`Technology ${techId}: ResourceUrl fingerprint ${fpRef} operator is "regex" but no regex provided`);
        } else {
          try {
            validateSerializableRegex(fp.regex);
          } catch (rErr) {
            errors.push(`Technology ${techId}: ResourceUrl fingerprint ${fpRef} regex error: ${(rErr as Error).message}`);
          }
        }
      } else {
        if (!fp.urlPattern || typeof fp.urlPattern !== 'string' || fp.urlPattern.trim() === '') {
          errors.push(`Technology ${techId}: ResourceUrl fingerprint ${fpRef} requires a non-empty urlPattern`);
        }
      }
      break;
    }

    case 'css_property': {
      if (!fp.needle || typeof fp.needle !== 'string' || fp.needle.trim() === '') {
        errors.push(`Technology ${techId}: CssProperty fingerprint ${fpRef} requires a non-empty needle`);
      }
      break;
    }

    case 'html_signature': {
      if (fp.signatureId !== 'tailwind-utilities') {
        errors.push(`Technology ${techId}: HtmlSignature fingerprint ${fpRef} unsupported signatureId "${fp.signatureId}"`);
      }
      break;
    }

    case 'header': {
      if (!fp.headerName || typeof fp.headerName !== 'string' || !/^[a-z0-9_-]+$/.test(fp.headerName)) {
        errors.push(`Technology ${techId}: Header fingerprint ${fpRef} headerName must be lowercase alphanumeric`);
      }
      if (!VALID_OPERATORS.has(fp.operator)) {
        errors.push(`Technology ${techId}: Header fingerprint ${fpRef} invalid operator "${fp.operator}"`);
      }
      if (fp.operator === 'regex') {
        if (!fp.regex) {
          errors.push(`Technology ${techId}: Header fingerprint ${fpRef} operator is "regex" but no regex provided`);
        } else {
          try {
            validateSerializableRegex(fp.regex);
          } catch (rErr) {
            errors.push(`Technology ${techId}: Header fingerprint ${fpRef} regex error: ${(rErr as Error).message}`);
          }
        }
      }
      break;
    }
  }
}

/**
 * Checks CSS selector validity using structural inspection and DOM parser if available.
 */
function isValidCssSelector(selector: string): boolean {
  if (!selector || typeof selector !== 'string' || selector.trim() === '') {
    return false;
  }

  const trimmed = selector.trim();

  // 1. Structural checks
  // Cannot start or end with a combinator (>, +, ~)
  if (/^[>+~]/.test(trimmed) || /[>+~]$/.test(trimmed)) {
    return false;
  }

  // Cannot contain consecutive combinators (e.g. '> >', '+ +', '> +')
  if (/[>+~]\s*[>+~]/.test(trimmed)) {
    return false;
  }

  // Cannot have dangling class or ID identifiers (e.g. 'div.' or 'div#')
  if (/[.#]$|[.#]\s/.test(trimmed)) {
    return false;
  }

  // Cannot have invalid pseudo-classes or pseudo-elements
  if (/:::[a-zA-Z]/.test(trimmed)) {
    return false;
  }

  // Balanced brackets and quotes check
  let openBrackets = 0;
  let inSingleQuote = false;
  let inDoubleQuote = false;

  for (let i = 0; i < trimmed.length; i++) {
    const char = trimmed[i];
    if (char === '\\') {
      i++;
      continue;
    }
    if (char === "'" && !inDoubleQuote) inSingleQuote = !inSingleQuote;
    else if (char === '"' && !inSingleQuote) inDoubleQuote = !inDoubleQuote;
    else if (!inSingleQuote && !inDoubleQuote) {
      if (char === '[') openBrackets++;
      else if (char === ']') openBrackets--;
      if (openBrackets < 0) return false;
    }
  }
  if (openBrackets !== 0 || inSingleQuote || inDoubleQuote) return false;

  // Attribute selector syntax validation: reject empty brackets '[]' or malformed assignments
  const attrRegex = /\[([^\]]*)\]/g;
  let match: RegExpExecArray | null;
  while ((match = attrRegex.exec(trimmed)) !== null) {
    const inner = match[1].trim();
    if (!inner) return false; // '[]'
    if (/^[=~|^$*]/.test(inner)) return false; // '[=val]'
    if (/[=~|^$*]$/.test(inner)) return false; // '[attr=]'
  }

  // 2. Browser / jsdom native parser verification if DOM is available
  if (typeof document !== 'undefined' && typeof document.createDocumentFragment === 'function') {
    try {
      document.createDocumentFragment().querySelector(trimmed);
      return true;
    } catch {
      return false;
    }
  }

  return true;
}

/**
 * Validates an entire registry of TechnologyDefinitions.
 * Verifies global uniqueness of technology IDs, registry-wide uniqueness of
 * fingerprint IDs, inter-technology relationship references, and cycle detection.
 */
export function validateTechnologyRegistry(
  defs: TechnologyDefinition[],
  options: { throwOnError?: boolean } = {}
): RegistryValidationResult {
  const allErrors: string[] = [];
  const allWarnings: string[] = [];
  const validDefs: TechnologyDefinition[] = [];
  const rejectedIds: string[] = [];

  const defMap = new Map<string, TechnologyDefinition>();
  const allFingerprintIds = new Map<string, string>(); // fpId -> techId

  // 1. Validate each definition independently
  for (const def of defs) {
    const report = validateTechnologyDefinition(def);
    if (!report.valid) {
      allErrors.push(...report.errors);
      if (def?.id) rejectedIds.push(def.id);
      continue;
    }

    // Check technology ID uniqueness
    if (defMap.has(def.id)) {
      allErrors.push(`Duplicate technology id detected in registry: "${def.id}"`);
      rejectedIds.push(def.id);
      continue;
    }
    defMap.set(def.id, def);

    // Check registry-wide fingerprint ID uniqueness
    let hasDuplicateFp = false;
    for (const fp of def.fingerprints) {
      const existingOwner = allFingerprintIds.get(fp.id);
      if (existingOwner) {
        allErrors.push(
          `Registry-wide duplicate fingerprint id detected: "${fp.id}" is defined in both "${existingOwner}" and "${def.id}"`
        );
        hasDuplicateFp = true;
      } else {
        allFingerprintIds.set(fp.id, def.id);
      }
    }

    if (!hasDuplicateFp) {
      validDefs.push(def);
    } else {
      rejectedIds.push(def.id);
    }
  }

  // 2. Validate Relationship Targets and Proof Fingerprints across Registry
  for (const def of validDefs) {
    if (!def.relationships) continue;

    for (const rel of def.relationships) {
      const targetTech = defMap.get(rel.targetTechnologyId);
      if (!targetTech) {
        allErrors.push(
          `Technology "${def.id}": Relationship targets non-existent technology id "${rel.targetTechnologyId}"`
        );
        continue;
      }

      const targetFpIds = new Set(targetTech.fingerprints.map((f) => f.id));
      const seenQualifying = new Set<string>();

      if (rel.independentProof.qualifyingFingerprintIds) {
        for (const qId of rel.independentProof.qualifyingFingerprintIds) {
          if (seenQualifying.has(qId)) {
            allErrors.push(
              `Technology "${def.id}": Duplicate fingerprint id "${qId}" in independentProof.qualifyingFingerprintIds`
            );
          }
          seenQualifying.add(qId);
          if (!targetFpIds.has(qId)) {
            allErrors.push(
              `Technology "${def.id}": Relationship independentProof.qualifyingFingerprintIds references non-existent target fingerprint "${qId}" on technology "${targetTech.id}"`
            );
          }
        }
      }

      if (rel.independentProof.excludedFingerprintIds) {
        const seenExcluded = new Set<string>();
        for (const exId of rel.independentProof.excludedFingerprintIds) {
          if (seenExcluded.has(exId)) {
            allErrors.push(
              `Technology "${def.id}": Duplicate fingerprint id "${exId}" in independentProof.excludedFingerprintIds`
            );
          }
          seenExcluded.add(exId);
          if (!targetFpIds.has(exId)) {
            allErrors.push(
              `Technology "${def.id}": Relationship independentProof.excludedFingerprintIds references non-existent target fingerprint "${exId}" on technology "${targetTech.id}"`
            );
          }
          // Contradiction Check: Fingerprint cannot be both qualifying and excluded!
          if (seenQualifying.has(exId)) {
            allErrors.push(
              `Technology "${def.id}": Contradictory relationship proof: Fingerprint "${exId}" is declared in both qualifyingFingerprintIds and excludedFingerprintIds`
            );
          }
        }
      }
    }
  }

  // 3. Cycle Detection in Relationships
  const cycles = detectRelationshipCycles(validDefs);
  for (const cycle of cycles) {
    allErrors.push(`Circular relationship dependency detected: ${cycle.join(' -> ')}`);
  }

  const isValid = allErrors.length === 0;

  if (!isValid && options.throwOnError) {
    throw new SchemaValidationError(
      `Technology registry validation failed with ${allErrors.length} errors:\n- ${allErrors.join('\n- ')}`,
      allErrors
    );
  }

  if (!isValid && !options.throwOnError) {
    // Structured error logging for production environments
    console.error(`[SiteStack Schema] Registry validation failed: ${allErrors.length} errors found`, {
      errors: allErrors,
      rejectedDefinitionIds: rejectedIds,
    });
  }

  return {
    valid: isValid,
    errors: allErrors,
    warnings: allWarnings,
    validDefinitions: isValid ? validDefs : validDefs.filter((d) => !rejectedIds.includes(d.id)),
    rejectedDefinitionIds: rejectedIds,
  };
}

/**
 * Asserts registry validity or throws immediately.
 */
export function assertValidTechnologyRegistry(defs: TechnologyDefinition[]): void {
  validateTechnologyRegistry(defs, { throwOnError: true });
}

/**
 * Detects cycles in technology relationship dependencies using DFS.
 */
function detectRelationshipCycles(defs: TechnologyDefinition[]): string[][] {
  const defMap = new Map<string, TechnologyDefinition>();
  for (const def of defs) defMap.set(def.id, def);

  const cycles: string[][] = [];
  const visited = new Set<string>();
  const recursionStack = new Set<string>();
  const currentPath: string[] = [];

  function dfs(techId: string) {
    visited.add(techId);
    recursionStack.add(techId);
    currentPath.push(techId);

    const def = defMap.get(techId);
    if (def?.relationships) {
      for (const rel of def.relationships) {
        const target = rel.targetTechnologyId;
        if (!visited.has(target)) {
          dfs(target);
        } else if (recursionStack.has(target)) {
          const cycleStartIndex = currentPath.indexOf(target);
          if (cycleStartIndex !== -1) {
            const cyclePath = currentPath.slice(cycleStartIndex).concat(target);
            cycles.push(cyclePath);
          }
        }
      }
    }

    currentPath.pop();
    recursionStack.delete(techId);
  }

  for (const def of defs) {
    if (!visited.has(def.id)) {
      dfs(def.id);
    }
  }

  return cycles;
}
