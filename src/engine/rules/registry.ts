import { TechRule, TechCategory } from '../types';
import { cmsRules } from './cms';
import { frameworkRules } from './frameworks';
import { libraryRules } from './libraries';
import { analyticsRules } from './analytics';
import { marketingRules } from './marketing';
import { ecommerceRules } from './ecommerce';
import { paymentRules } from './payments';
import { infrastructureRules } from './infrastructure';

/**
 * Master catalog of all built-in technology rules
 */
export const ALL_RULES: TechRule[] = [
  ...cmsRules,
  ...frameworkRules,
  ...libraryRules,
  ...analyticsRules,
  ...marketingRules,
  ...ecommerceRules,
  ...paymentRules,
  ...infrastructureRules,
];

/**
 * Validates that all registered rules conform to strict integrity standards
 */
export function validateRuleRegistry(rules: TechRule[] = ALL_RULES): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const seenIds = new Set<string>();

  for (const rule of rules) {
    if (!rule.id || typeof rule.id !== 'string') {
      errors.push(`Rule missing valid id: ${JSON.stringify(rule)}`);
    } else if (seenIds.has(rule.id)) {
      errors.push(`Duplicate rule id detected: "${rule.id}"`);
    } else {
      seenIds.add(rule.id);
    }

    if (!rule.name) errors.push(`Rule ${rule.id} missing name`);
    if (!rule.category) errors.push(`Rule ${rule.id} missing category`);
    if (!rule.website) errors.push(`Rule ${rule.id} missing website URL`);
    if (!rule.icon) errors.push(`Rule ${rule.id} missing icon`);

    // Ensure at least one signal is defined
    const hasSignals =
      (rule.signals.meta && rule.signals.meta.length > 0) ||
      (rule.signals.dom && rule.signals.dom.length > 0) ||
      (rule.signals.globals && rule.signals.globals.length > 0) ||
      (rule.signals.resources && rule.signals.resources.length > 0) ||
      (rule.signals.headers && rule.signals.headers.length > 0);

    if (!hasSignals) {
      errors.push(`Rule ${rule.id} has no defined signals`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function getRuleById(id: string): TechRule | undefined {
  return ALL_RULES.find((r) => r.id === id);
}

export function getRulesByCategory(category: TechCategory): TechRule[] {
  return ALL_RULES.filter((r) => r.category === category);
}
