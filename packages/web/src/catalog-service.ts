/**
 * SiteStack Expansion v1 — Public Technology Catalog Service
 *
 * Exposes the complete 80-technology catalog and 41 architectural relationships
 * with metadata, category filtering, search, and dependency mappings.
 */

import { CANONICAL_TECHNOLOGY_DEFINITIONS } from '../../../src/engine/schema/definitions';
import { CANONICAL_ARCHITECTURE_ONTOLOGY } from '../../../src/engine/architecture/ontology';
import { TechCategory } from '../../../src/engine/types';

export type { TechCategory };

export interface PublicTechnologySummary {
  id: string;
  name: string;
  category: TechCategory;
  website: string;
  icon: string;
  description: string;
  fingerprintCount: number;
  supportedSignalTypes: string[];
  maxConfidenceCeiling?: number;
}

export interface PublicTechnologyDetail extends PublicTechnologySummary {
  semanticRoles: string[];
  primaryRole?: string;
  relationships: {
    dependencies: { targetId: string; type: string; description: string }[];
    dependents: { sourceId: string; type: string; description: string }[];
  };
}

export interface CategorySummary {
  category: TechCategory;
  displayName: string;
  count: number;
  description: string;
}

export interface PublicRelationshipSummary {
  sourceId: string;
  sourceName: string;
  targetId: string;
  targetName: string;
  type: string;
  description: string;
}

const CATEGORY_METADATA: Record<TechCategory, { displayName: string; description: string }> = {
  cms: {
    displayName: 'Content Management Systems',
    description: 'Platforms and engines for managing digital web content, blogs, and editorial portals.',
  },
  framework: {
    displayName: 'Frontend & Fullstack Frameworks',
    description: 'Component-driven application frameworks, meta-frameworks, and routing runtimes.',
  },
  library: {
    displayName: 'JavaScript & UI Libraries',
    description: 'Utility libraries, state containers, animation engines, and UI primitives.',
  },
  analytics: {
    displayName: 'Analytics & Product Telemetry',
    description: 'Behavioral analytics, product measurement, heatmaps, and event tracking.',
  },
  marketing: {
    displayName: 'Marketing & Tag Management',
    description: 'Tag managers, conversion pixels, customer relationship platforms, and marketing beacons.',
  },
  ecommerce: {
    displayName: 'E-commerce & Storefronts',
    description: 'Online store engines, shopping carts, headless checkout, and merchant platforms.',
  },
  payment: {
    displayName: 'Payment Gateways & Processors',
    description: 'Payment checkouts, tokenization scripts, and merchant transaction processing.',
  },
  infrastructure: {
    displayName: 'Hosting, CDN & Infrastructure',
    description: 'Edge networks, reverse proxies, cloud storage, web application firewalls, and hosting.',
  },
};

export class CatalogService {
  private technologies: PublicTechnologySummary[];
  private detailsMap = new Map<string, PublicTechnologyDetail>();

  constructor() {
    this.technologies = CANONICAL_TECHNOLOGY_DEFINITIONS.map((def) => {
      const signalTypes = Array.from(new Set(def.fingerprints.map((fp) => fp.kind))).sort();
      return {
        id: def.id,
        name: def.name,
        category: def.category,
        website: def.website,
        icon: def.icon,
        description: def.description,
        fingerprintCount: def.fingerprints.length,
        supportedSignalTypes: signalTypes,
        maxConfidenceCeiling: def.scoringPolicy?.maxConfidenceScore,
      };
    }).sort((a, b) => a.name.localeCompare(b.name));

    // Build details map with ontology relationships
    const ontology = CANONICAL_ARCHITECTURE_ONTOLOGY;
    for (const tech of this.technologies) {
      const profile = ontology.profiles.find((p) => p.technologyId === tech.id);
      const dependencies = ontology.relationships
        .filter((r) => r.sourceId === tech.id)
        .map((r) => ({ targetId: r.targetId, type: r.type, description: r.description }));

      const dependents = ontology.relationships
        .filter((r) => r.targetId === tech.id)
        .map((r) => ({ sourceId: r.sourceId, type: r.type, description: r.description }));

      this.detailsMap.set(tech.id, {
        ...tech,
        semanticRoles: profile ? [...profile.roles] : [],
        primaryRole: profile?.primaryRole,
        relationships: {
          dependencies,
          dependents,
        },
      });
    }
  }

  /**
   * Returns all catalog technologies.
   */
  getAllTechnologies(): PublicTechnologySummary[] {
    return this.technologies;
  }

  /**
   * Returns summary counts by category.
   */
  getCategories(): CategorySummary[] {
    const counts = new Map<TechCategory, number>();
    for (const t of this.technologies) {
      counts.set(t.category, (counts.get(t.category) || 0) + 1);
    }

    const categories: TechCategory[] = [
      'framework',
      'library',
      'cms',
      'ecommerce',
      'analytics',
      'marketing',
      'payment',
      'infrastructure',
    ];

    return categories.map((cat) => ({
      category: cat,
      displayName: CATEGORY_METADATA[cat]?.displayName || cat,
      description: CATEGORY_METADATA[cat]?.description || '',
      count: counts.get(cat) || 0,
    }));
  }

  /**
   * Returns detailed technology intelligence for a single technology ID.
   */
  getTechnologyById(id: string): PublicTechnologyDetail | undefined {
    return this.detailsMap.get(id);
  }

  /**
   * Returns all 41 architectural ontology relationships with resolved names.
   */
  getAllRelationships(): PublicRelationshipSummary[] {
    const ontology = CANONICAL_ARCHITECTURE_ONTOLOGY;
    const nameMap = new Map<string, string>();
    for (const t of this.technologies) {
      nameMap.set(t.id, t.name);
    }

    return ontology.relationships.map((rel) => ({
      sourceId: rel.sourceId,
      sourceName: nameMap.get(rel.sourceId) || rel.sourceId,
      targetId: rel.targetId,
      targetName: nameMap.get(rel.targetId) || rel.targetId,
      type: rel.type,
      description: rel.description,
    }));
  }

  /**
   * Returns technologies belonging to a specific category.
   */
  getTechnologiesByCategory(category: TechCategory): PublicTechnologySummary[] {
    return this.technologies.filter((t) => t.category === category);
  }

  /**
   * Returns category display metadata.
   */
  getCategoryMetadata(category: TechCategory): { displayName: string; description: string } {
    return CATEGORY_METADATA[category] || { displayName: category, description: '' };
  }

  /**
   * Searches and filters technologies by query string and/or category.
   */
  search(query?: string, category?: TechCategory): PublicTechnologySummary[] {
    return this.technologies.filter((tech) => {
      if (category && tech.category !== category) {
        return false;
      }
      if (query && query.trim()) {
        const q = query.toLowerCase().trim();
        const matchesName = tech.name.toLowerCase().includes(q);
        const matchesId = tech.id.toLowerCase().includes(q);
        const matchesDesc = tech.description.toLowerCase().includes(q);
        if (!matchesName && !matchesId && !matchesDesc) {
          return false;
        }
      }
      return true;
    });
  }
}
