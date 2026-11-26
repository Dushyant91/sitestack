/**
 * SiteStack Regex Security & AST Validator
 * Location: src/engine/schema/regex.ts
 *
 * Implements static validation of serialized regular expressions to prevent
 * ReDoS vulnerabilities (exponential and polynomial catastrophic backtracking)
 * and enforce catalog-wide regex hygiene.
 */

import { SerializableRegex } from './types';

export class RegexSecurityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RegexSecurityError';
  }
}

/** Maximum permitted length for any regex pattern string */
export const MAX_REGEX_PATTERN_LENGTH = 200;

/** Permitted standard ECMAScript regex flags */
const VALID_FLAGS_SET = new Set(['g', 'i', 'm', 's', 'u', 'y', 'v']);

interface QuantifierInfo {
  min: number;
  max?: number;
  lazy: boolean;
}

type AstNode =
  | { type: 'literal'; value: string }
  | { type: 'char_class'; content: string; negated: boolean }
  | { type: 'anchor'; value: string }
  | { type: 'backreference'; index: number }
  | { type: 'quantified'; element: AstNode; quantifier: QuantifierInfo }
  | { type: 'group'; capturing: boolean; alternatives: AstNode[][] };

/**
 * Validates a SerializableRegex pattern and its flags.
 * Throws RegexSecurityError if the pattern is invalid, exceeds length bounds,
 * contains backreferences, or contains ReDoS-prone nested quantifiers.
 */
export function validateSerializableRegex(regex: SerializableRegex): void {
  if (!regex || typeof regex !== 'object') {
    throw new RegexSecurityError('Regex definition must be an object with a pattern property');
  }

  const { pattern, flags = '' } = regex;

  if (typeof pattern !== 'string' || pattern.length === 0) {
    throw new RegexSecurityError('Regex pattern must be a non-empty string');
  }

  if (pattern.length > MAX_REGEX_PATTERN_LENGTH) {
    throw new RegexSecurityError(
      `Regex pattern exceeds maximum allowed length of ${MAX_REGEX_PATTERN_LENGTH} characters (got ${pattern.length})`
    );
  }

  // Validate flags
  const seenFlags = new Set<string>();
  for (const flag of flags) {
    if (!VALID_FLAGS_SET.has(flag)) {
      throw new RegexSecurityError(`Invalid regex flag: "${flag}"`);
    }
    if (seenFlags.has(flag)) {
      throw new RegexSecurityError(`Duplicate regex flag: "${flag}"`);
    }
    seenFlags.add(flag);
  }

  // Validate native ECMAScript compilation
  try {
    new RegExp(pattern, flags);
  } catch (err) {
    throw new RegexSecurityError(
      `Invalid regular expression syntax: ${(err as Error).message}`
    );
  }

  // Parse into AST and inspect for security hazards
  const ast = parseRegexToAst(pattern);
  inspectAstSecurity(ast);
}

/**
 * Tokenizes and parses a regex pattern string into an AST.
 */
function parseRegexToAst(pattern: string): AstNode {
  let pos = 0;

  function parseAlternatives(): AstNode[][] {
    const alternatives: AstNode[][] = [];
    let currentAlt: AstNode[] = [];

    while (pos < pattern.length && pattern[pos] !== ')') {
      if (pattern[pos] === '|') {
        pos++;
        alternatives.push(currentAlt);
        currentAlt = [];
        continue;
      }

      const node = parseElement();
      if (node) {
        currentAlt.push(node);
      }
    }

    alternatives.push(currentAlt);
    return alternatives;
  }

  function parseElement(): AstNode | null {
    if (pos >= pattern.length || pattern[pos] === ')' || pattern[pos] === '|') {
      return null;
    }

    let element: AstNode;
    const char = pattern[pos];

    if (char === '\\') {
      pos++;
      if (pos >= pattern.length) {
        throw new RegexSecurityError('Dangling backslash at end of pattern');
      }
      const escaped = pattern[pos++];

      // Backreferences: \1 through \9
      if (/^[1-9]$/.test(escaped)) {
        element = { type: 'backreference', index: Number(escaped) };
      } else if (escaped === 'b' || escaped === 'B') {
        element = { type: 'anchor', value: '\\' + escaped };
      } else {
        element = { type: 'literal', value: '\\' + escaped };
      }
    } else if (char === '[') {
      pos++;
      let negated = false;
      if (pattern[pos] === '^') {
        negated = true;
        pos++;
      }
      let content = '';
      while (pos < pattern.length) {
        if (pattern[pos] === '\\') {
          content += '\\' + (pattern[pos + 1] || '');
          pos += 2;
        } else if (pattern[pos] === ']') {
          pos++;
          break;
        } else {
          content += pattern[pos++];
        }
      }
      element = { type: 'char_class', content, negated };
    } else if (char === '(') {
      pos++;
      let capturing = true;
      if (pattern.startsWith('?:', pos)) {
        capturing = false;
        pos += 2;
      } else if (
        pattern.startsWith('?=', pos) ||
        pattern.startsWith('?!', pos) ||
        pattern.startsWith('?<=', pos) ||
        pattern.startsWith('?<!', pos)
      ) {
        capturing = false;
        pos += 2;
        if (pattern[pos - 1] === '<') pos++;
      }

      const alternatives = parseAlternatives();
      if (pattern[pos] === ')') {
        pos++;
      }
      element = { type: 'group', capturing, alternatives };
    } else if (char === '^' || char === '$') {
      element = { type: 'anchor', value: char };
      pos++;
    } else if (char === '.') {
      element = { type: 'char_class', content: '.', negated: false };
      pos++;
    } else {
      element = { type: 'literal', value: char };
      pos++;
    }

    // Check for quantifier following element
    if (pos < pattern.length) {
      const qChar = pattern[pos];
      let quantifier: QuantifierInfo | null = null;

      if (qChar === '*') {
        pos++;
        quantifier = { min: 0, lazy: false };
      } else if (qChar === '+') {
        pos++;
        quantifier = { min: 1, lazy: false };
      } else if (qChar === '?') {
        pos++;
        quantifier = { min: 0, max: 1, lazy: false };
      } else if (qChar === '{') {
        const braceEnd = pattern.indexOf('}', pos);
        if (braceEnd !== -1) {
          const rangeStr = pattern.slice(pos + 1, braceEnd);
          const parts = rangeStr.split(',').map((s) => s.trim());
          const min = Number(parts[0]);
          let max: number | undefined;
          if (parts.length > 1) {
            max = parts[1] !== '' ? Number(parts[1]) : undefined;
          } else {
            max = min;
          }

          if (!isNaN(min)) {
            quantifier = { min, max, lazy: false };
            pos = braceEnd + 1;
          }
        }
      }

      if (quantifier) {
        if (pos < pattern.length && pattern[pos] === '?') {
          quantifier.lazy = true;
          pos++;
        }
        return { type: 'quantified', element, quantifier };
      }
    }

    return element;
  }

  const rootAlternatives = parseAlternatives();
  return { type: 'group', capturing: false, alternatives: rootAlternatives };
}

/**
 * Unwraps unquantified grouping parentheses to inspect effective elements.
 */
function flattenEffectiveNodes(nodes: AstNode[]): AstNode[] {
  const result: AstNode[] = [];
  for (const node of nodes) {
    if (node.type === 'group' && node.alternatives.length === 1) {
      result.push(...flattenEffectiveNodes(node.alternatives[0]));
    } else {
      result.push(node);
    }
  }
  return result;
}

/**
 * Extracts a representation of the initial token of an alternative for overlap detection.
 */
function getInitialToken(nodes: AstNode[]): string | null {
  const flattened = flattenEffectiveNodes(nodes);
  if (flattened.length === 0) return null;
  const first = flattened[0];
  if (first.type === 'literal') return 'lit:' + first.value;
  if (first.type === 'char_class') return 'class:' + first.content;
  if (first.type === 'quantified') return getInitialToken([first.element]);
  if (first.type === 'group' && first.alternatives.length > 0) {
    return getInitialToken(first.alternatives[0]);
  }
  return null;
}

/**
 * Inspects AST nodes for backreferences, adjacent wildcards, and ReDoS nested quantifiers.
 */
function inspectAstSecurity(node: AstNode): void {
  function walk(current: AstNode): void {
    if (current.type === 'backreference') {
      throw new RegexSecurityError(
        `Regex contains prohibited backreference (\\${current.index}). Backreferences can trigger exponential matching time.`
      );
    }

    if (current.type === 'quantified') {
      const isRepeating = current.quantifier.max === undefined || current.quantifier.max > 1;

      if (isRepeating) {
        // Direct nested quantifier: e.g. a++ or (a+)+ where inner element is quantified
        if (
          current.element.type === 'quantified' &&
          (current.element.quantifier.max === undefined || current.element.quantifier.max > 1)
        ) {
          throw new RegexSecurityError(
            'ReDoS vulnerability detected: Direct nested quantifiers are prohibited.'
          );
        }

        // Group with inner quantifiers or overlapping alternatives
        if (current.element.type === 'group') {
          // Check for overlapping alternatives: (a|aa)+, (a|a)+
          if (current.element.alternatives.length > 1) {
            const seenTokens = new Set<string>();
            for (const alt of current.element.alternatives) {
              const token = getInitialToken(alt);
              if (token) {
                if (seenTokens.has(token)) {
                  throw new RegexSecurityError(
                    `ReDoS vulnerability detected: Quantified group contains overlapping alternatives with identical initial token "${token}".`
                  );
                }
                seenTokens.add(token);
              }
            }
          }

          for (const rawAlt of current.element.alternatives) {
            const alt = flattenEffectiveNodes(rawAlt);

            // Find all repeating quantifiers in this alternative
            const innerQuantifiedIndices: number[] = [];
            for (let i = 0; i < alt.length; i++) {
              const item = alt[i];
              if (
                item.type === 'quantified' &&
                (item.quantifier.max === undefined || item.quantifier.max > 1)
              ) {
                innerQuantifiedIndices.push(i);
              }
            }

            for (const idx of innerQuantifiedIndices) {
              // 1. Group alternative consists purely of a single quantified element: (a+)+, ((a+))+, ([0-9]+)+
              if (alt.length === 1) {
                throw new RegexSecurityError(
                  'ReDoS vulnerability detected: Quantified group wraps a directly quantified element.'
                );
              }

              // 2. Inner quantifier is at index 0 (un-anchored leading quantifier): (a+b)+, (a|b+)+
              if (idx === 0) {
                throw new RegexSecurityError(
                  'ReDoS vulnerability detected: Quantified group contains leading un-anchored inner quantifier.'
                );
              }

              // 3. Inner quantifier is preceded by another quantified element: (x+x+)+
              const prev = alt[idx - 1];
              if (prev.type === 'quantified') {
                throw new RegexSecurityError(
                  'ReDoS vulnerability detected: Adjacent repeating quantifiers inside quantified group.'
                );
              }

              // 4. If preceded by a token, verify it is a fixed literal delimiter (e.g. \., \/, -, _)
              if (prev.type !== 'literal') {
                throw new RegexSecurityError(
                  'ReDoS vulnerability detected: Inner quantifier lacks fixed literal delimiter.'
                );
              }
            }
          }
        }
      }

      walk(current.element);
      return;
    }

    if (current.type === 'group') {
      for (const alt of current.alternatives) {
        // Check for adjacent wildcards: .*.*
        for (let i = 0; i < alt.length - 1; i++) {
          const a = alt[i];
          const b = alt[i + 1];
          if (
            a.type === 'quantified' && a.element.type === 'char_class' && a.element.content === '.' &&
            b.type === 'quantified' && b.element.type === 'char_class' && b.element.content === '.'
          ) {
            throw new RegexSecurityError(
              'ReDoS vulnerability detected: Adjacent unbounded wildcards are prohibited.'
            );
          }
        }

        for (const el of alt) {
          walk(el);
        }
      }
    }
  }

  walk(node);
}
