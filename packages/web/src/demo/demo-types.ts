/**
 * SiteStack Interactive Product Demo — Type Contracts
 *
 * Defines contracts for simulated website scans, technology evidence,
 * architectural relationship mappings, and exportable demo artifacts.
 */

import { TechCategory } from '../../../../src/engine/types';

export interface DemoEvidenceSignal {
  type: 'global' | 'dom_selector' | 'resource_url' | 'meta' | 'header';
  label: string;
  source: string;
  description: string;
}

export interface DemoTechnology {
  id: string;
  name: string;
  category: TechCategory;
  categoryLabel: string;
  version?: string;
  confidenceTier: 'High' | 'Medium';
  detectionType: 'direct' | 'inferred';
  summary: string;
  website: string;
  signals: DemoEvidenceSignal[];
  confidenceExplanation: string;
  dependencies: { targetId: string; targetName: string; type: string; description: string }[];
  dependents: { sourceId: string; sourceName: string; type: string; description: string }[];
}

export interface DemoRelationship {
  sourceId: string;
  sourceName: string;
  targetId: string;
  targetName: string;
  type: 'depends_on' | 'extends' | 'hosted_on' | 'content_source' | 'integrates' | 'styled_with';
  typeLabel: string;
  description: string;
}

export interface DemoWebsiteArchetype {
  id: 'saas' | 'ecommerce' | 'editorial' | 'docs';
  name: string;
  archetypeLabel: string;
  displayUrl: string;
  description: string;
  technologies: DemoTechnology[];
  relationships: DemoRelationship[];
  executiveSummary: string;
}
