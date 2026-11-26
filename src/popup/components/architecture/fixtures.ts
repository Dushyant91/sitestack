/**
 * SiteStack Architecture Flow - Test & Visual Fixtures
 * Location: src/popup/components/architecture/fixtures.ts
 */

import { buildArchitectureGraph } from '../../../engine/architecture/graph';
import { ArchitectureGraph } from '../../../engine/architecture/graph/types';
import { DetectedTechnology } from '../../../engine/types';
import { CANONICAL_TECHNOLOGY_DEFINITIONS } from '../../../engine/schema/definitions';

function makeDetectedTech(
  id: string,
  overrides?: Partial<DetectedTechnology>
): DetectedTechnology {
  const canonical = CANONICAL_TECHNOLOGY_DEFINITIONS.find((t) => t.id === id);
  return {
    id,
    name: canonical?.name || id,
    category: canonical?.category || 'library',
    confidenceScore: 85,
    confidenceTier: 'high',
    detectionType: 'direct',
    website: canonical?.website || `https://${id}.org`,
    icon: canonical?.icon || `${id}.png`,
    description: canonical?.description || `${id} description`,
    evidence: [{ type: 'global', source: `window.${id}`, weight: 50 }],
    confidenceReason: `Direct signal from window.${id}`,
    ...overrides,
  };
}

/** 1. Empty Graph (0 nodes, 0 edges) */
export const emptyGraphFixture: ArchitectureGraph = buildArchitectureGraph({
  detectedTechnologies: [],
  timestamp: 1000000000000,
});

/** 2. Single Isolated Technology (0 dependencies, 1 node) */
export const singleIsolatedFixture: ArchitectureGraph = buildArchitectureGraph({
  detectedTechnologies: [
    makeDetectedTech('docker' as any, {
      name: 'Docker',
      category: 'infrastructure' as any,
      description: 'Container virtualization runtime for packaging and shipping web software.',
    }),
  ],
  timestamp: 1000000000000,
});

/** 3. Single Direct Dependency (Next.js -> React directly observed) */
export const directDependencyFixture: ArchitectureGraph = buildArchitectureGraph({
  detectedTechnologies: [
    makeDetectedTech('nextjs', { confidenceScore: 95, version: '14.2.3' }),
    makeDetectedTech('react', { confidenceScore: 90, version: '18.3.1' }),
  ],
  timestamp: 1000000000000,
});

/** 4. Inferred Dependency (React synthesized via Next.js implies rule) */
export const inferredDependencyFixture: ArchitectureGraph = buildArchitectureGraph({
  detectedTechnologies: [
    makeDetectedTech('nextjs', { confidenceScore: 95, version: '14.2.3' }),
    makeDetectedTech('react', {
      confidenceScore: 85,
      detectionType: 'inferred',
      parentDependency: 'Next.js',
      confidenceReason: 'Inferred via Next.js framework parent dependency rule.',
    }),
  ],
  timestamp: 1000000000000,
});

/** 5. Multiple Independent Stacks (Next.js+React & WooCommerce+WordPress) */
export const multipleStacksFixture: ArchitectureGraph = buildArchitectureGraph({
  detectedTechnologies: [
    makeDetectedTech('nextjs', { version: '14.2.0' }),
    makeDetectedTech('react', { version: '18.3.0' }),
    makeDetectedTech('wordpress', { version: '6.5.2' }),
    makeDetectedTech('woocommerce', { version: '8.8.1' }),
  ],
  timestamp: 1000000000000,
});

/** 6. Contextual Co-Detection Only (Shopify + PayPal + Stripe) */
export const contextualCoDetectionFixture: ArchitectureGraph = buildArchitectureGraph({
  detectedTechnologies: [
    makeDetectedTech('shopify'),
    makeDetectedTech('paypal'),
    makeDetectedTech('stripe'),
  ],
  timestamp: 1000000000000,
});

/** 7. Mixed Verified and Unverified (Next.js+React + Tailwind + Vercel + Stripe) */
export const mixedVerifiedAndUnverifiedFixture: ArchitectureGraph = buildArchitectureGraph({
  detectedTechnologies: [
    makeDetectedTech('nextjs', { version: '14.2.3' }),
    makeDetectedTech('react', { version: '18.3.1' }),
    makeDetectedTech('tailwindcss', { version: '3.4.1' }),
    makeDetectedTech('vercel'),
    makeDetectedTech('stripe'),
    makeDetectedTech('google-analytics'),
  ],
  timestamp: 1000000000000,
});

/** 8. Full 60 Canonical Catalog Stress Fixture */
export const large60CatalogFixture: ArchitectureGraph = buildArchitectureGraph({
  detectedTechnologies: CANONICAL_TECHNOLOGY_DEFINITIONS.map((def) =>
    makeDetectedTech(def.id)
  ),
  timestamp: 1000000000000,
});

/** 9. Long Technology Name & Missing Metadata Fixture */
export const longNameTechFixture: ArchitectureGraph = buildArchitectureGraph({
  detectedTechnologies: [
    makeDetectedTech('google-tag-manager', {
      name: 'Google Tag Manager Enterprise Container Infrastructure (Long Name Edition)',
      description: undefined,
      website: undefined,
      version: undefined,
    }),
    makeDetectedTech('google-analytics', {
      name: 'Google Analytics 4 Measurement Protocol Service Telemetry Engine',
      description: '',
      website: '',
    }),
  ],
  timestamp: 1000000000000,
});
