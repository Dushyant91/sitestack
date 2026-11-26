/**
 * SiteStack Probe Plan Compiler
 * Location: src/engine/schema/compiler.ts
 *
 * Compiles validated TechnologyDefinition[] or legacy TechRule[] into a
 * deterministic, deduplicated ProbeExecutionPlan.
 *
 * Guarantees:
 * 1. Collection targets are deduplicated (e.g. selectors queried once, global roots grouped).
 * 2. Every fingerprint ID and its matching criteria are preserved on the shared targets.
 * 3. Execution plan is strictly JSON-serializable (plain objects, arrays, primitives)
 *    so it can be passed via chrome.scripting.executeScript({ args: [plan] }).
 * 4. Deterministic output: all arrays are sorted alphabetically regardless of input order.
 * 5. Respects collector-specific budgets (max 350 resources, depth 3 globals, length 100 strings).
 */

import { TechRule, HarvestedSignals } from '../types';
import { sanitizeResourceUrl } from '../../shared/url';
import { truncateResourceUrl } from './evaluator';
import {
  TechnologyDefinition,
  EvidenceRole,
  ClaimScope,
  CollectorId,
  StringMatchOperator,
  SerializableRegex,
  NormalizedEvidence,
  SchemaValidationError,
} from './types';

// ---------------------------------------------------------------------------
// 1. Probe Execution Plan Interfaces
// ---------------------------------------------------------------------------

function sortAsc(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

export interface CompiledGlobalFingerprint {
  fingerprintId: string;
  target: string;
  operator: 'exists' | 'equals' | 'regex';
  expectedValue?: string | number | boolean;
  regex?: SerializableRegex;
  baseWeight: number;
  role: EvidenceRole;
  claimScope: ClaimScope;
  collectorId: CollectorId;
  extractVersion?: boolean;
}

export interface CompiledGlobalTarget {
  root: string;
  nestedPaths: string[];
  captureRootExistence: boolean;
  fingerprints: CompiledGlobalFingerprint[];
}

export interface CompiledDomFingerprint {
  fingerprintId: string;
  kind: 'dom_selector' | 'dom_attribute';
  attributeName?: string;
  operator?: StringMatchOperator;
  expectedValue?: string;
  regex?: SerializableRegex;
  baseWeight: number;
  role: EvidenceRole;
  claimScope: ClaimScope;
  collectorId: CollectorId;
  extractVersion?: boolean;
}

export interface CompiledDomTarget {
  selector: string;
  captureExistence: boolean;
  attributes: string[];
  fingerprints: CompiledDomFingerprint[];
}

export interface CompiledMetaFingerprint {
  fingerprintId: string;
  metaName?: string;
  metaProperty?: string;
  operator: StringMatchOperator;
  expectedContent?: string;
  regex?: SerializableRegex;
  baseWeight: number;
  role: EvidenceRole;
  claimScope: ClaimScope;
  collectorId: CollectorId;
  extractVersion?: boolean;
}

export interface CompiledMetaTarget {
  key: string;
  name?: string;
  property?: string;
  fingerprints: CompiledMetaFingerprint[];
}

export interface CompiledCustomElementTarget {
  tagName: string;
  fingerprints: Array<{
    fingerprintId: string;
    baseWeight: number;
    role: EvidenceRole;
    claimScope: ClaimScope;
    collectorId: CollectorId;
  }>;
}

export interface CompiledCssTarget {
  needle: string;
  fingerprints: Array<{
    fingerprintId: string;
    baseWeight: number;
    role: EvidenceRole;
    claimScope: ClaimScope;
    collectorId: CollectorId;
  }>;
}

export interface CompiledSignatureTarget {
  signatureId: 'tailwind-utilities';
  fingerprints: Array<{
    fingerprintId: string;
    baseWeight: number;
    role: EvidenceRole;
    claimScope: ClaimScope;
    collectorId: CollectorId;
  }>;
}

export interface CompiledResourceFingerprint {
  fingerprintId: string;
  operator: 'contains' | 'starts_with' | 'regex';
  urlPattern?: string;
  regex?: SerializableRegex;
  baseWeight: number;
  role: EvidenceRole;
  claimScope: ClaimScope;
  collectorId: CollectorId;
  extractVersion?: boolean;
}

export interface CompiledResourceTarget {
  maxLimit: number;
  fingerprints: CompiledResourceFingerprint[];
  /** Inverted index mapping lowercase token -> list of fingerprint indices in fingerprints[] */
  tokenIndex?: Record<string, number[]>;
  /** Indices of fingerprints that cannot be safely tokenized and must always be evaluated */
  unindexedIndices?: number[];
}

export interface CompiledHeaderFingerprint {
  fingerprintId: string;
  headerName: string;
  operator: StringMatchOperator;
  expectedValue?: string;
  regex?: SerializableRegex;
  baseWeight: number;
  role: EvidenceRole;
  claimScope: ClaimScope;
  collectorId: CollectorId;
}

export interface CompiledHeaderTarget {
  headerName: string;
  fingerprints: CompiledHeaderFingerprint[];
}

export interface ProbeExecutionPlan {
  globals: CompiledGlobalTarget[];
  domTargets: CompiledDomTarget[];
  metaTargets: CompiledMetaTarget[];
  customElements: CompiledCustomElementTarget[];
  cssNeedles: CompiledCssTarget[];
  htmlSignatures: CompiledSignatureTarget[];
  resources: CompiledResourceTarget;
  maxResourceLimit: number;
  headers?: CompiledHeaderTarget[];
}

// ---------------------------------------------------------------------------
// 2. Resource Token Indexing Helpers
// ---------------------------------------------------------------------------

const GENERIC_STOPWORDS = new Set([
  'http', 'https', 'static', 'assets', 'vendor', 'script', 'bundle',
  'chunks', 'files', 'public', 'dist', 'index', 'core', 'main'
]);

/**
 * Safely extracts a necessary lowercase literal token (length >= 4) from a resource fingerprint.
 * Returns null if no guaranteed necessary token exists (meaning the fingerprint must be evaluated in fallback).
 * 
 * Correctness Contract:
 * 1. Rejects patterns with top-level alternatives (| at parenDepth === 0).
 * 2. Collects literal runs strictly at parenDepth === 0 and !inCharClass.
 * 3. Trims characters quantified by ?, *, or {0,.
 * 4. Discards escape sequences (\d, \w, \s, etc.).
 * 5. Deprioritizes generic stopwords in favor of distinctive technology tokens.
 */
export function extractResourceToken(fp: CompiledResourceFingerprint): string | null {
  if ((fp.operator === 'contains' || fp.operator === 'starts_with') && fp.urlPattern) {
    const pattern = fp.urlPattern.toLowerCase();
    const matches = pattern.match(/[a-z0-9_-]{4,}/g);
    if (!matches || matches.length === 0) return null;
    
    // Sort: non-stopwords first, then longer length
    matches.sort((a, b) => {
      const aStop = GENERIC_STOPWORDS.has(a) ? 1 : 0;
      const bStop = GENERIC_STOPWORDS.has(b) ? 1 : 0;
      if (aStop !== bStop) return aStop - bStop;
      return b.length - a.length;
    });
    return matches[0].replace(/[-_]+$/, '');
  }

  if (fp.operator === 'regex' && fp.regex?.pattern) {
    const p = fp.regex.pattern.toLowerCase();
    
    // 1. Scan pattern to track paren depth, char class, and top-level pipes
    let parenDepth = 0;
    let inCharClass = false;
    let topLevelPipes = 0;
    
    for (let i = 0; i < p.length; i++) {
      const c = p[i];
      if (c === '\\') {
        i++; // Skip escaped char
        continue;
      }
      if (c === '[' && !inCharClass) {
        inCharClass = true;
      } else if (c === ']' && inCharClass) {
        inCharClass = false;
      } else if (!inCharClass) {
        if (c === '(') {
          parenDepth++;
        } else if (c === ')' && parenDepth > 0) {
          parenDepth--;
        } else if (c === '|' && parenDepth === 0) {
          topLevelPipes++;
        }
      }
    }

    // If there are top-level alternatives, no single token is mandatory across all branches
    if (topLevelPipes > 0) {
      return null;
    }

    // 2. Identify literal runs strictly at parenDepth === 0 and !inCharClass
    parenDepth = 0;
    inCharClass = false;
    const candidateRuns: string[] = [];
    let currentRun = '';

    for (let i = 0; i < p.length; i++) {
      const c = p[i];
      
      // Escaped characters
      if (c === '\\') {
        const next = p[i + 1] || '';
        i++;
        // If escaped delimiter that represents literal (e.g. \., \-, \/)
        if (next === '.' || next === '-' || next === '/' || next === '_') {
          if (parenDepth === 0 && !inCharClass) {
            if (next === '-' || next === '_') {
              currentRun += next;
            } else {
              // Delimiter ends current literal run
              if (currentRun.length > 0) {
                candidateRuns.push(currentRun);
                currentRun = '';
              }
            }
          }
        } else {
          // Escaped character class like \d, \w, \s ends literal run
          if (currentRun.length > 0) {
            candidateRuns.push(currentRun);
            currentRun = '';
          }
        }
        continue;
      }

      if (c === '[' && !inCharClass) {
        inCharClass = true;
        if (currentRun.length > 0) {
          candidateRuns.push(currentRun);
          currentRun = '';
        }
        continue;
      }

      if (c === ']' && inCharClass) {
        inCharClass = false;
        continue;
      }

      if (!inCharClass) {
        if (c === '(') {
          parenDepth++;
          if (currentRun.length > 0) {
            candidateRuns.push(currentRun);
            currentRun = '';
          }
          continue;
        }

        if (c === ')' && parenDepth > 0) {
          parenDepth--;
          continue;
        }

        if (parenDepth === 0) {
          // Check for quantifiers that apply to previous character
          if (c === '?' || c === '*' || c === '{') {
            // Last character of currentRun was quantified! Strip it
            if (currentRun.length > 0) {
              currentRun = currentRun.slice(0, -1);
              if (currentRun.length > 0) {
                candidateRuns.push(currentRun);
                currentRun = '';
              }
            }
            continue;
          }

          // Check if alphanumeric or hyphen/underscore
          if (/[a-z0-9_-]/.test(c)) {
            currentRun += c;
          } else {
            // Delimiter (slash, dot, caret, dollar, plus, etc.) ends current run
            if (currentRun.length > 0) {
              candidateRuns.push(currentRun);
              currentRun = '';
            }
          }
        }
      }
    }

    if (currentRun.length > 0) {
      candidateRuns.push(currentRun);
    }

    // Filter runs of length >= 4 with only a-z0-9_-
    const validRuns = candidateRuns
      .flatMap((r) => r.split(/[-_]+/)) // split by internal hyphens/underscores for clean tokens
      .concat(candidateRuns) // also keep hyphenated if valid
      .map((t) => t.replace(/[-_]+$/, '')) // trim trailing delimiters
      .filter((t) => /^[a-z0-9_-]{4,}$/.test(t));

    if (validRuns.length === 0) return null;

    // Deduplicate
    const distinct = Array.from(new Set(validRuns));

    // Sort: non-stopwords first, then longer length
    distinct.sort((a, b) => {
      const aStop = GENERIC_STOPWORDS.has(a) ? 1 : 0;
      const bStop = GENERIC_STOPWORDS.has(b) ? 1 : 0;
      if (aStop !== bStop) return aStop - bStop;
      return b.length - a.length;
    });

    return distinct[0];
  }

  return null;
}

/**
 * Builds deterministic inverted token index and unindexed fallback indices from compiled resource fingerprints.
 */
export function buildResourceTokenIndex(fingerprints: CompiledResourceFingerprint[]): {
  tokenIndex: Record<string, number[]>;
  unindexedIndices: number[];
} {
  const tokenIndex: Record<string, number[]> = {};
  const unindexedIndices: number[] = [];

  for (let i = 0; i < fingerprints.length; i++) {
    const fp = fingerprints[i];
    const token = extractResourceToken(fp);
    if (token) {
      if (!tokenIndex[token]) {
        tokenIndex[token] = [];
      }
      tokenIndex[token].push(i);
    } else {
      unindexedIndices.push(i);
    }
  }

  return { tokenIndex, unindexedIndices };
}

// ---------------------------------------------------------------------------
// 3. Compilation from TechnologyDefinition[] (Schema v2.0)
// ---------------------------------------------------------------------------

/**
 * Compiles validated TechnologyDefinition[] into a deduplicated, deterministic ProbeExecutionPlan.
 * Validates all definitions and rejects invalid or unsupported fingerprints.
 */
export function compileProbeExecutionPlan(
  definitions: TechnologyDefinition[],
  options?: { skipValidation?: boolean }
): ProbeExecutionPlan {
  if (!Array.isArray(definitions)) {
    throw new SchemaValidationError('compileProbeExecutionPlan expects an array of TechnologyDefinition');
  }

  // 1. Validate all definitions structure unless explicitly skipped
  if (!options?.skipValidation) {
    const allErrors: string[] = [];
    for (const def of definitions) {
      if (!def || typeof def !== 'object') {
        allErrors.push('Definition must be an object');
        continue;
      }
      if (!def.id || !/^[a-z0-9-]+$/.test(def.id)) {
        allErrors.push(`Technology id "${def?.id}" must match /^[a-z0-9-]+$/`);
      }
      if (!def.name || typeof def.name !== 'string') {
        allErrors.push(`Technology "${def?.id}": missing name`);
      }
      if (!def.category || typeof def.category !== 'string') {
        allErrors.push(`Technology "${def?.id}": missing category`);
      }
      if (!Array.isArray(def.fingerprints)) {
        allErrors.push(`Technology "${def?.id}": fingerprints must be an array`);
      }
    }
    if (allErrors.length > 0) {
      throw new SchemaValidationError(
        `Cannot compile ProbeExecutionPlan: ${allErrors.length} validation errors found.`,
        allErrors
      );
    }
  }

  // 2. Accumulators for deduplicated targets
  const globalsMap = new Map<string, {
    nestedPaths: Set<string>;
    captureRoot: boolean;
    fingerprints: CompiledGlobalFingerprint[];
  }>();

  const domMap = new Map<string, {
    captureExistence: boolean;
    attributes: Set<string>;
    fingerprints: CompiledDomFingerprint[];
  }>();

  const metaMap = new Map<string, {
    name?: string;
    property?: string;
    fingerprints: CompiledMetaFingerprint[];
  }>();

  const customElementsMap = new Map<string, Array<{
    fingerprintId: string;
    baseWeight: number;
    role: EvidenceRole;
    claimScope: ClaimScope;
    collectorId: CollectorId;
  }>>();

  const cssNeedlesMap = new Map<string, Array<{
    fingerprintId: string;
    baseWeight: number;
    role: EvidenceRole;
    claimScope: ClaimScope;
    collectorId: CollectorId;
  }>>();

  const signaturesMap = new Map<'tailwind-utilities', Array<{
    fingerprintId: string;
    baseWeight: number;
    role: EvidenceRole;
    claimScope: ClaimScope;
    collectorId: CollectorId;
  }>>();

  const resourceFingerprints: CompiledResourceFingerprint[] = [];

  // 3. Process each technology definition and fingerprint
  for (const def of definitions) {
    for (const fp of def.fingerprints) {
      switch (fp.kind) {
        case 'global': {
          const parts = fp.target.split('.');
          const root = parts[0];
          let entry = globalsMap.get(root);
          if (!entry) {
            entry = {
              nestedPaths: new Set<string>(),
              captureRoot: false,
              fingerprints: [],
            };
            globalsMap.set(root, entry);
          }
          if (fp.target === root) {
            entry.captureRoot = true;
          } else {
            entry.nestedPaths.add(fp.target);
          }
          entry.fingerprints.push({
            fingerprintId: fp.id,
            target: fp.target,
            operator: fp.operator,
            expectedValue: fp.expectedValue,
            regex: fp.regex,
            baseWeight: fp.weight,
            role: fp.role,
            claimScope: fp.claimScope,
            collectorId: fp.collectorId,
            extractVersion: fp.extractVersion,
          });
          break;
        }

        case 'dom_selector': {
          let entry = domMap.get(fp.selector);
          if (!entry) {
            entry = {
              captureExistence: true,
              attributes: new Set<string>(),
              fingerprints: [],
            };
            domMap.set(fp.selector, entry);
          } else {
            entry.captureExistence = true;
          }
          entry.fingerprints.push({
            fingerprintId: fp.id,
            kind: 'dom_selector',
            baseWeight: fp.weight,
            role: fp.role,
            claimScope: fp.claimScope,
            collectorId: fp.collectorId,
          });
          break;
        }

        case 'dom_attribute': {
          let entry = domMap.get(fp.selector);
          if (!entry) {
            entry = {
              captureExistence: false,
              attributes: new Set<string>(),
              fingerprints: [],
            };
            domMap.set(fp.selector, entry);
          }
          entry.attributes.add(fp.attributeName);
          entry.fingerprints.push({
            fingerprintId: fp.id,
            kind: 'dom_attribute',
            attributeName: fp.attributeName,
            operator: fp.operator,
            expectedValue: fp.expectedValue,
            regex: fp.regex,
            baseWeight: fp.weight,
            role: fp.role,
            claimScope: fp.claimScope,
            collectorId: fp.collectorId,
            extractVersion: fp.extractVersion,
          });
          break;
        }

        case 'meta': {
          const key = `name:${(fp.metaName || '').toLowerCase()}|prop:${(fp.metaProperty || '').toLowerCase()}`;
          let entry = metaMap.get(key);
          if (!entry) {
            entry = {
              name: fp.metaName ? fp.metaName.toLowerCase() : undefined,
              property: fp.metaProperty ? fp.metaProperty.toLowerCase() : undefined,
              fingerprints: [],
            };
            metaMap.set(key, entry);
          }
          entry.fingerprints.push({
            fingerprintId: fp.id,
            metaName: fp.metaName,
            metaProperty: fp.metaProperty,
            operator: fp.operator,
            expectedContent: fp.expectedContent,
            regex: fp.regex,
            baseWeight: fp.weight,
            role: fp.role,
            claimScope: fp.claimScope,
            collectorId: fp.collectorId,
            extractVersion: fp.extractVersion,
          });
          break;
        }

        case 'custom_element': {
          const tag = fp.tagName.toLowerCase();
          let entry = customElementsMap.get(tag);
          if (!entry) {
            entry = [];
            customElementsMap.set(tag, entry);
          }
          entry.push({
            fingerprintId: fp.id,
            baseWeight: fp.weight,
            role: fp.role,
            claimScope: fp.claimScope,
            collectorId: fp.collectorId,
          });
          break;
        }

        case 'css_property': {
          let entry = cssNeedlesMap.get(fp.needle);
          if (!entry) {
            entry = [];
            cssNeedlesMap.set(fp.needle, entry);
          }
          entry.push({
            fingerprintId: fp.id,
            baseWeight: fp.weight,
            role: fp.role,
            claimScope: fp.claimScope,
            collectorId: fp.collectorId,
          });
          break;
        }

        case 'html_signature': {
          let entry = signaturesMap.get(fp.signatureId);
          if (!entry) {
            entry = [];
            signaturesMap.set(fp.signatureId, entry);
          }
          entry.push({
            fingerprintId: fp.id,
            baseWeight: fp.weight,
            role: fp.role,
            claimScope: fp.claimScope,
            collectorId: fp.collectorId,
          });
          break;
        }

        case 'resource_url': {
          resourceFingerprints.push({
            fingerprintId: fp.id,
            operator: fp.operator,
            urlPattern: fp.urlPattern,
            regex: fp.regex,
            baseWeight: fp.weight,
            role: fp.role,
            claimScope: fp.claimScope,
            collectorId: fp.collectorId,
            extractVersion: fp.extractVersion,
          });
          break;
        }

        case 'header': {
          // Dormant in v1.1.1 runtime
          break;
        }
      }
    }
  }

  // 4. Construct deterministic, sorted arrays
  const compiledGlobals: CompiledGlobalTarget[] = Array.from(globalsMap.entries())
    .map(([root, data]) => ({
      root,
      nestedPaths: Array.from(data.nestedPaths).sort(sortAsc),
      captureRootExistence: data.captureRoot,
      fingerprints: data.fingerprints.sort((a, b) => sortAsc(a.fingerprintId, b.fingerprintId)),
    }))
    .sort((a, b) => sortAsc(a.root, b.root));

  const compiledDom: CompiledDomTarget[] = Array.from(domMap.entries())
    .map(([selector, data]) => ({
      selector,
      captureExistence: data.captureExistence,
      attributes: Array.from(data.attributes).sort(sortAsc),
      fingerprints: data.fingerprints.sort((a, b) => sortAsc(a.fingerprintId, b.fingerprintId)),
    }))
    .sort((a, b) => sortAsc(a.selector, b.selector));

  const compiledMeta: CompiledMetaTarget[] = Array.from(metaMap.entries())
    .map(([key, data]) => ({
      key,
      name: data.name,
      property: data.property,
      fingerprints: data.fingerprints.sort((a, b) => sortAsc(a.fingerprintId, b.fingerprintId)),
    }))
    .sort((a, b) => sortAsc(a.key, b.key));

  const compiledCustomElements: CompiledCustomElementTarget[] = Array.from(customElementsMap.entries())
    .map(([tagName, fps]) => ({
      tagName,
      fingerprints: fps.sort((a, b) => sortAsc(a.fingerprintId, b.fingerprintId)),
    }))
    .sort((a, b) => sortAsc(a.tagName, b.tagName));

  const compiledCssNeedles: CompiledCssTarget[] = Array.from(cssNeedlesMap.entries())
    .map(([needle, fps]) => ({
      needle,
      fingerprints: fps.sort((a, b) => sortAsc(a.fingerprintId, b.fingerprintId)),
    }))
    .sort((a, b) => sortAsc(a.needle, b.needle));

  const compiledSignatures: CompiledSignatureTarget[] = Array.from(signaturesMap.entries())
    .map(([signatureId, fps]) => ({
      signatureId,
      fingerprints: fps.sort((a, b) => sortAsc(a.fingerprintId, b.fingerprintId)),
    }))
    .sort((a, b) => sortAsc(a.signatureId, b.signatureId));

  const sortedResourceFingerprints = resourceFingerprints.sort((a, b) =>
    sortAsc(a.fingerprintId, b.fingerprintId)
  );

  const { tokenIndex, unindexedIndices } = buildResourceTokenIndex(sortedResourceFingerprints);

  return {
    globals: compiledGlobals,
    domTargets: compiledDom,
    metaTargets: compiledMeta,
    customElements: compiledCustomElements,
    cssNeedles: compiledCssNeedles,
    htmlSignatures: compiledSignatures,
    resources: {
      maxLimit: 350,
      fingerprints: sortedResourceFingerprints,
      tokenIndex,
      unindexedIndices,
    },
    maxResourceLimit: 350,
  };
}

// ---------------------------------------------------------------------------
// 3. Compilation from Legacy TechRule[] (Backward Compatibility Bridge)
// ---------------------------------------------------------------------------

/**
 * Compiles existing v1.1.1 TechRule[] into a deterministic ProbeExecutionPlan.
 * Enables the generic collectors to execute all existing 24 technology rules
 * with zero code changes or regression.
 */
export function compileLegacyProbeExecutionPlan(rules: TechRule[]): ProbeExecutionPlan {
  const globalsMap = new Map<string, {
    nestedPaths: Set<string>;
    captureRoot: boolean;
    fingerprints: CompiledGlobalFingerprint[];
  }>();

  const domMap = new Map<string, {
    captureExistence: boolean;
    attributes: Set<string>;
    fingerprints: CompiledDomFingerprint[];
  }>();

  const metaMap = new Map<string, {
    name?: string;
    property?: string;
    fingerprints: CompiledMetaFingerprint[];
  }>();

  const customElementsMap = new Map<string, Array<{
    fingerprintId: string;
    baseWeight: number;
    role: EvidenceRole;
    claimScope: ClaimScope;
    collectorId: CollectorId;
  }>>();

  const cssNeedlesMap = new Map<string, Array<{
    fingerprintId: string;
    baseWeight: number;
    role: EvidenceRole;
    claimScope: ClaimScope;
    collectorId: CollectorId;
  }>>();

  const signaturesMap = new Map<'tailwind-utilities', Array<{
    fingerprintId: string;
    baseWeight: number;
    role: EvidenceRole;
    claimScope: ClaimScope;
    collectorId: CollectorId;
  }>>();

  const resourceFingerprints: CompiledResourceFingerprint[] = [];

  for (const rule of rules) {
    // 1. Globals
    if (rule.signals.globals) {
      for (const g of rule.signals.globals) {
        const parts = g.path.split('.');
        const root = parts[0];
        let entry = globalsMap.get(root);
        if (!entry) {
          entry = {
            nestedPaths: new Set<string>(),
            captureRoot: false,
            fingerprints: [],
          };
          globalsMap.set(root, entry);
        }
        if (g.path === root) {
          entry.captureRoot = true;
        } else {
          entry.nestedPaths.add(g.path);
        }
        entry.fingerprints.push({
          fingerprintId: `${rule.id}:global:${g.path}`,
          target: g.path,
          operator: g.valueRegex ? 'regex' : 'exists',
          regex: g.valueRegex ? { pattern: g.valueRegex.source, flags: g.valueRegex.flags } : undefined,
          baseWeight: g.weight,
          role: 'direct',
          claimScope: 'runtime_execution',
          collectorId: 'collector:main:global',
        });
      }
    }

    // 2. DOM, Custom Elements, CSS Needles, Signatures
    if (rule.signals.dom) {
      for (const d of rule.signals.dom) {
        if (d.selector === 'dom:tailwind-utilities') {
          let entry = signaturesMap.get('tailwind-utilities');
          if (!entry) {
            entry = [];
            signaturesMap.set('tailwind-utilities', entry);
          }
          entry.push({
            fingerprintId: `${rule.id}:signature:tailwind-utilities`,
            baseWeight: d.weight,
            role: 'direct',
            claimScope: 'dom_structure',
            collectorId: 'collector:isolated:html_signature',
          });
        } else if (d.selector.startsWith('style:has-text(')) {
          // Extract needle: style:has-text(--tw-) -> --tw-
          const needle = d.selector.slice(15, -1);
          let entry = cssNeedlesMap.get(needle);
          if (!entry) {
            entry = [];
            cssNeedlesMap.set(needle, entry);
          }
          entry.push({
            fingerprintId: `${rule.id}:css:${needle}`,
            baseWeight: d.weight,
            role: 'direct',
            claimScope: 'dom_structure',
            collectorId: 'collector:isolated:css_property',
          });
        } else if (d.selector === 'app-root' || d.selector === 'adev-root') {
          // Known custom element tags
          let entry = customElementsMap.get(d.selector);
          if (!entry) {
            entry = [];
            customElementsMap.set(d.selector, entry);
          }
          entry.push({
            fingerprintId: `${rule.id}:element:${d.selector}`,
            baseWeight: d.weight,
            role: 'direct',
            claimScope: 'dom_structure',
            collectorId: 'collector:isolated:custom_element',
          });
          // Also record in domMap for legacy querySelector compatibility
          let domEntry = domMap.get(d.selector);
          if (!domEntry) {
            domEntry = {
              captureExistence: true,
              attributes: new Set<string>(),
              fingerprints: [],
            };
            domMap.set(d.selector, domEntry);
          }
        } else {
          // Standard DOM selector or attribute
          let entry = domMap.get(d.selector);
          if (!entry) {
            entry = {
              captureExistence: !d.attribute,
              attributes: new Set<string>(),
              fingerprints: [],
            };
            domMap.set(d.selector, entry);
          }
          if (d.attribute) {
            entry.attributes.add(d.attribute);
            entry.fingerprints.push({
              fingerprintId: `${rule.id}:dom:${d.selector}:${d.attribute}`,
              kind: 'dom_attribute',
              attributeName: d.attribute,
              operator: d.valueRegex ? 'regex' : 'exists',
              regex: d.valueRegex ? { pattern: d.valueRegex.source, flags: d.valueRegex.flags } : undefined,
              baseWeight: d.weight,
              role: 'direct',
              claimScope: 'dom_structure',
              collectorId: 'collector:isolated:dom',
            });
          } else {
            entry.captureExistence = true;
            entry.fingerprints.push({
              fingerprintId: `${rule.id}:dom:${d.selector}`,
              kind: 'dom_selector',
              baseWeight: d.weight,
              role: 'direct',
              claimScope: 'dom_structure',
              collectorId: 'collector:isolated:dom',
            });
          }
        }
      }
    }

    // 3. Meta Tags
    if (rule.signals.meta) {
      for (const m of rule.signals.meta) {
        const key = `name:${(m.name || '').toLowerCase()}|prop:${(m.property || '').toLowerCase()}`;
        let entry = metaMap.get(key);
        if (!entry) {
          entry = {
            name: m.name ? m.name.toLowerCase() : undefined,
            property: m.property ? m.property.toLowerCase() : undefined,
            fingerprints: [],
          };
          metaMap.set(key, entry);
        }
        entry.fingerprints.push({
          fingerprintId: `${rule.id}:meta:${m.name || m.property || 'gen'}`,
          metaName: m.name,
          metaProperty: m.property,
          operator: m.contentRegex ? 'regex' : 'exists',
          regex: m.contentRegex ? { pattern: m.contentRegex.source, flags: m.contentRegex.flags } : undefined,
          baseWeight: m.weight,
          role: 'direct',
          claimScope: 'dom_structure',
          collectorId: 'collector:isolated:meta',
        });
      }
    }

    // 4. Resources
    if (rule.signals.resources) {
      for (const r of rule.signals.resources) {
        const isTelemetry =
          rule.id === 'cloudflare' && r.urlRegex.source.includes('beacon');
        resourceFingerprints.push({
          fingerprintId: `${rule.id}:resource:${r.urlRegex.source}`,
          operator: 'regex',
          regex: { pattern: r.urlRegex.source, flags: r.urlRegex.flags },
          baseWeight: r.weight,
          role: isTelemetry ? 'telemetry' : 'direct',
          claimScope: isTelemetry ? 'telemetry_integration' : 'asset_delivery',
          collectorId: 'collector:isolated:resource',
        });
      }
    }
  }

  // Deterministically sort everything
  const compiledGlobals: CompiledGlobalTarget[] = Array.from(globalsMap.entries())
    .map(([root, data]) => ({
      root,
      nestedPaths: Array.from(data.nestedPaths).sort(sortAsc),
      captureRootExistence: data.captureRoot,
      fingerprints: data.fingerprints.sort((a, b) => sortAsc(a.fingerprintId, b.fingerprintId)),
    }))
    .sort((a, b) => sortAsc(a.root, b.root));

  const compiledDom: CompiledDomTarget[] = Array.from(domMap.entries())
    .map(([selector, data]) => ({
      selector,
      captureExistence: data.captureExistence,
      attributes: Array.from(data.attributes).sort(sortAsc),
      fingerprints: data.fingerprints.sort((a, b) => sortAsc(a.fingerprintId, b.fingerprintId)),
    }))
    .sort((a, b) => sortAsc(a.selector, b.selector));

  const compiledMeta: CompiledMetaTarget[] = Array.from(metaMap.entries())
    .map(([key, data]) => ({
      key,
      name: data.name,
      property: data.property,
      fingerprints: data.fingerprints.sort((a, b) => sortAsc(a.fingerprintId, b.fingerprintId)),
    }))
    .sort((a, b) => sortAsc(a.key, b.key));

  const compiledCustomElements: CompiledCustomElementTarget[] = Array.from(customElementsMap.entries())
    .map(([tagName, fps]) => ({
      tagName,
      fingerprints: fps.sort((a, b) => sortAsc(a.fingerprintId, b.fingerprintId)),
    }))
    .sort((a, b) => sortAsc(a.tagName, b.tagName));

  const compiledCssNeedles: CompiledCssTarget[] = Array.from(cssNeedlesMap.entries())
    .map(([needle, fps]) => ({
      needle,
      fingerprints: fps.sort((a, b) => sortAsc(a.fingerprintId, b.fingerprintId)),
    }))
    .sort((a, b) => sortAsc(a.needle, b.needle));

  const compiledSignatures: CompiledSignatureTarget[] = Array.from(signaturesMap.entries())
    .map(([signatureId, fps]) => ({
      signatureId,
      fingerprints: fps.sort((a, b) => sortAsc(a.fingerprintId, b.fingerprintId)),
    }))
    .sort((a, b) => sortAsc(a.signatureId, b.signatureId));

  const sortedResourceFingerprints = resourceFingerprints.sort((a, b) =>
    sortAsc(a.fingerprintId, b.fingerprintId)
  );

  const { tokenIndex, unindexedIndices } = buildResourceTokenIndex(sortedResourceFingerprints);

  return {
    globals: compiledGlobals,
    domTargets: compiledDom,
    metaTargets: compiledMeta,
    customElements: compiledCustomElements,
    cssNeedles: compiledCssNeedles,
    htmlSignatures: compiledSignatures,
    resources: {
      maxLimit: 350,
      fingerprints: sortedResourceFingerprints,
      tokenIndex,
      unindexedIndices,
    },
    maxResourceLimit: 350,
  };
}

// ---------------------------------------------------------------------------
// 4. Standalone Signal-to-NormalizedEvidence Matcher
// ---------------------------------------------------------------------------

/**
 * Matches HarvestedSignals against a ProbeExecutionPlan to produce NormalizedEvidence[].
 * Does NOT compute final confidence scores. Preserves exact provenance and metadata.
 */
export function matchHarvestedSignalsToNormalizedEvidence(
  plan: ProbeExecutionPlan,
  signals: HarvestedSignals
): NormalizedEvidence[] {
  const evidence: NormalizedEvidence[] = [];
  const matchedFingerprintIds = new Set<string>();

  function recordNormalizedEvidence(item: NormalizedEvidence) {
    if (item.fingerprintId) {
      if (matchedFingerprintIds.has(item.fingerprintId)) return;
      matchedFingerprintIds.add(item.fingerprintId);
    }
    evidence.push(item);
  }

  // Helper: test string match
  function matchesString(
    val: string,
    operator: StringMatchOperator,
    expected?: string,
    regex?: SerializableRegex
  ): boolean {
    switch (operator) {
      case 'exists':
        return val.length > 0;
      case 'equals':
        return val === (expected || '');
      case 'contains':
        return val.includes(expected || '');
      case 'starts_with':
        return val.startsWith(expected || '');
      case 'ends_with':
        return val.endsWith(expected || '');
      case 'regex':
        if (!regex) return true;
        try {
          return new RegExp(regex.pattern, regex.flags).test(val);
        } catch {
          return false;
        }
      default:
        return false;
    }
  }

  function formatMatchedGlobalValue(val: unknown): string {
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

  // Helper: get nested property
  function getNested(obj: unknown, path: string): unknown {
    if (!obj || typeof obj !== 'object') return undefined;
    const parts = path.startsWith('window.') ? path.slice(7).split('.') : path.split('.');
    let cur: unknown = obj;
    for (const p of parts) {
      if (cur && typeof cur === 'object' && p in (cur as Record<string, unknown>)) {
        cur = (cur as Record<string, unknown>)[p];
      } else {
        return undefined;
      }
    }
    return cur;
  }

  // 1. Globals
  for (const g of plan.globals) {
    for (const fp of g.fingerprints) {
      const val = getNested(signals.globals, fp.target);
      if (val !== undefined && val !== null) {
        let matched = false;
        if (fp.operator === 'exists') {
          matched = true;
        } else if (fp.operator === 'equals') {
          matched = String(val) === String(fp.expectedValue);
        } else if (fp.operator === 'regex' && fp.regex) {
          try {
            matched = new RegExp(fp.regex.pattern, fp.regex.flags).test(String(val));
          } catch {
            matched = false;
          }
        }
        if (matched) {
          recordNormalizedEvidence({
            fingerprintId: fp.fingerprintId,
            type: 'global',
            source: `window.${fp.target}`,
            matchedValue: formatMatchedGlobalValue(val),
            baseWeight: fp.baseWeight,
            role: fp.role,
            claimScope: fp.claimScope,
            collectorId: fp.collectorId,
          });
        }
      }
    }
  }

  // 2. Metas
  if (Array.isArray(signals.meta)) {
    for (const m of signals.meta) {
      const metaName = m.name?.toLowerCase();
      const metaProp = m.property?.toLowerCase();

      for (const target of plan.metaTargets) {
        const matchesName = target.name && target.name === metaName;
        const matchesProp = target.property && target.property === metaProp;
        if (matchesName || matchesProp) {
          for (const fp of target.fingerprints) {
            if (matchesString(m.content, fp.operator, fp.expectedContent, fp.regex)) {
              recordNormalizedEvidence({
                fingerprintId: fp.fingerprintId,
                type: 'meta',
                source: `<meta ${matchesName ? `name="${m.name}"` : `property="${m.property}"`}>`,
                matchedValue: m.content.slice(0, 60),
                baseWeight: fp.baseWeight,
                role: fp.role,
                claimScope: fp.claimScope,
                collectorId: fp.collectorId,
              });
            }
          }
        }
      }
    }
  }

  // 3. DOM Elements
  if (Array.isArray(signals.dom)) {
    const harvestedDomMap = new Map<string, Array<{ attribute?: string; value?: string }>>();
    for (const d of signals.dom) {
      let list = harvestedDomMap.get(d.selector);
      if (!list) {
        list = [];
        harvestedDomMap.set(d.selector, list);
      }
      list.push({ attribute: d.attribute, value: d.value });
    }

    // DOM targets
    for (const target of plan.domTargets) {
      const items = harvestedDomMap.get(target.selector);
      if (items && items.length > 0) {
        for (const fp of target.fingerprints) {
          if (fp.kind === 'dom_selector') {
            recordNormalizedEvidence({
              fingerprintId: fp.fingerprintId,
              type: 'dom',
              source: target.selector,
              matchedValue: target.selector,
              baseWeight: fp.baseWeight,
              role: fp.role,
              claimScope: fp.claimScope,
              collectorId: fp.collectorId,
            });
          } else if (fp.kind === 'dom_attribute') {
            const attrItem = items.find((it) => it.attribute === fp.attributeName);
            if (attrItem && attrItem.value !== undefined) {
              if (matchesString(attrItem.value, fp.operator || 'exists', fp.expectedValue, fp.regex)) {
                recordNormalizedEvidence({
                  fingerprintId: fp.fingerprintId,
                  type: 'dom',
                  source: `${target.selector}[${fp.attributeName}]`,
                  matchedValue: attrItem.value.slice(0, 80),
                  baseWeight: fp.baseWeight,
                  role: fp.role,
                  claimScope: fp.claimScope,
                  collectorId: fp.collectorId,
                });
              }
            }
          }
        }
      }
    }

    // Custom Elements
    for (const ce of plan.customElements) {
      if (harvestedDomMap.has(ce.tagName)) {
        for (const fp of ce.fingerprints) {
          recordNormalizedEvidence({
            fingerprintId: fp.fingerprintId,
            type: 'dom',
            source: ce.tagName,
            matchedValue: ce.tagName,
            baseWeight: fp.baseWeight,
            role: fp.role,
            claimScope: fp.claimScope,
            collectorId: fp.collectorId,
          });
        }
      }
    }

    // CSS Needles
    for (const css of plan.cssNeedles) {
      const needleSel = `style:has-text(${css.needle})`;
      if (harvestedDomMap.has(needleSel)) {
        for (const fp of css.fingerprints) {
          recordNormalizedEvidence({
            fingerprintId: fp.fingerprintId,
            type: 'dom',
            source: needleSel,
            matchedValue: css.needle,
            baseWeight: fp.baseWeight,
            role: fp.role,
            claimScope: fp.claimScope,
            collectorId: fp.collectorId,
          });
        }
      }
    }

    // HTML Signatures
    for (const sig of plan.htmlSignatures) {
      const sigSel = `dom:${sig.signatureId}`;
      if (harvestedDomMap.has(sigSel)) {
        for (const fp of sig.fingerprints) {
          recordNormalizedEvidence({
            fingerprintId: fp.fingerprintId,
            type: 'dom',
            source: sigSel,
            matchedValue: sig.signatureId,
            baseWeight: fp.baseWeight,
            role: fp.role,
            claimScope: fp.claimScope,
            collectorId: fp.collectorId,
          });
        }
      }
    }
  }

  // 4. Resources (with Token Candidate Selection)
  if (Array.isArray(signals.resources)) {
    const allFps = plan.resources.fingerprints;
    const tokenIdx = plan.resources.tokenIndex;
    const unindexed = plan.resources.unindexedIndices;

    for (const res of signals.resources) {
      const candidateIndices: number[] = [];

      if (tokenIdx) {
        const resLower = res.toLowerCase();
        // 1. Guaranteed unindexed fallback
        if (Array.isArray(unindexed)) {
          for (let u = 0; u < unindexed.length; u++) {
            candidateIndices.push(unindexed[u]);
          }
        }
        // 2. Token candidate matches
        for (const token in tokenIdx) {
          if (resLower.includes(token)) {
            const list = tokenIdx[token];
            for (let l = 0; l < list.length; l++) {
              candidateIndices.push(list[l]);
            }
          }
        }
      } else {
        // Fallback: evaluate all fingerprints
        for (let f = 0; f < allFps.length; f++) {
          candidateIndices.push(f);
        }
      }

      // Sort and deduplicate candidate indices so evaluation order matches linear index order
      candidateIndices.sort((a, b) => a - b);
      const seenCandidate = new Set<number>();

      for (let c = 0; c < candidateIndices.length; c++) {
        const idx = candidateIndices[c];
        if (seenCandidate.has(idx)) continue;
        seenCandidate.add(idx);

        const fp = allFps[idx];
        if (!fp) continue;

        let matched = false;
        if (fp.operator === 'contains' && fp.urlPattern) {
          matched = res.includes(fp.urlPattern);
        } else if (fp.operator === 'starts_with' && fp.urlPattern) {
          matched = res.startsWith(fp.urlPattern);
        } else if (fp.operator === 'regex' && fp.regex) {
          try {
            matched = new RegExp(fp.regex.pattern, fp.regex.flags).test(res);
          } catch {
            matched = false;
          }
        }

        if (matched) {
          const sanitized = sanitizeResourceUrl(res);
          recordNormalizedEvidence({
            fingerprintId: fp.fingerprintId,
            type: 'resource',
            source: truncateResourceUrl(sanitized),
            matchedValue: sanitized,
            baseWeight: fp.baseWeight,
            role: fp.role,
            claimScope: fp.claimScope,
            collectorId: fp.collectorId,
          });
        }
      }
    }
  }

  // 5. Headers
  if (signals.headers) {
    for (const [headerName, headerVal] of Object.entries(signals.headers)) {
      if (typeof headerVal === 'string') {
        const lowerName = headerName.toLowerCase();
        // Check any header fingerprints if present
        if (plan.headers) {
          for (const target of plan.headers) {
            if (target.headerName.toLowerCase() === lowerName) {
              for (const fp of target.fingerprints) {
                if (matchesString(headerVal, fp.operator, fp.expectedValue, fp.regex)) {
                  recordNormalizedEvidence({
                    fingerprintId: fp.fingerprintId,
                    type: 'header',
                    source: `header: ${headerName}`,
                    matchedValue: headerVal.slice(0, 50),
                    baseWeight: fp.baseWeight,
                    role: fp.role,
                    claimScope: fp.claimScope,
                    collectorId: fp.collectorId,
                  });
                }
              }
            }
          }
        }
      }
    }
  }

  return evidence;
}

/**
 * Original linear reference matching implementation kept strictly for differential verification tests.
 */
export function matchHarvestedResourcesLinearReference(
  fingerprints: CompiledResourceFingerprint[],
  resources: string[]
): { fingerprintId: string; url: string }[] {
  const matches: { fingerprintId: string; url: string }[] = [];
  for (const res of resources) {
    for (const fp of fingerprints) {
      let matched = false;
      if (fp.operator === 'contains' && fp.urlPattern) {
        matched = res.includes(fp.urlPattern);
      } else if (fp.operator === 'starts_with' && fp.urlPattern) {
        matched = res.startsWith(fp.urlPattern);
      } else if (fp.operator === 'regex' && fp.regex) {
        try {
          matched = new RegExp(fp.regex.pattern, fp.regex.flags).test(res);
        } catch {
          matched = false;
        }
      }
      if (matched) {
        matches.push({ fingerprintId: fp.fingerprintId, url: res });
      }
    }
  }
  return matches;
}

/**
 * Optimized token candidate resource matching implementation.
 */
export function matchHarvestedResourcesTokenOptimized(
  target: CompiledResourceTarget,
  resources: string[]
): { fingerprintId: string; url: string }[] {
  const matches: { fingerprintId: string; url: string }[] = [];
  const allFps = target.fingerprints;
  const tokenIdx = target.tokenIndex;
  const unindexed = target.unindexedIndices;

  for (const res of resources) {
    const candidateIndices: number[] = [];

    if (tokenIdx) {
      const resLower = res.toLowerCase();
      if (Array.isArray(unindexed)) {
        for (let u = 0; u < unindexed.length; u++) {
          candidateIndices.push(unindexed[u]);
        }
      }
      for (const token in tokenIdx) {
        if (resLower.includes(token)) {
          const list = tokenIdx[token];
          for (let l = 0; l < list.length; l++) {
            candidateIndices.push(list[l]);
          }
        }
      }
    } else {
      for (let f = 0; f < allFps.length; f++) {
        candidateIndices.push(f);
      }
    }

    // Sort and deduplicate candidate indices so evaluation order matches linear index order
    candidateIndices.sort((a, b) => a - b);
    const seen = new Set<number>();
    for (let c = 0; c < candidateIndices.length; c++) {
      const idx = candidateIndices[c];
      if (seen.has(idx)) continue;
      seen.add(idx);

      const fp = allFps[idx];
      if (!fp) continue;

      let matched = false;
      if (fp.operator === 'contains' && fp.urlPattern) {
        matched = res.includes(fp.urlPattern);
      } else if (fp.operator === 'starts_with' && fp.urlPattern) {
        matched = res.startsWith(fp.urlPattern);
      } else if (fp.operator === 'regex' && fp.regex) {
        try {
          matched = new RegExp(fp.regex.pattern, fp.regex.flags).test(res);
        } catch {
          matched = false;
        }
      }

      if (matched) {
        matches.push({ fingerprintId: fp.fingerprintId, url: res });
      }
    }
  }

  return matches;
}
