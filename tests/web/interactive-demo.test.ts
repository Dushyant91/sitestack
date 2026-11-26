/**
 * SiteStack Interactive Product Demo — Canonical Verification & Unit Test Suite
 */

import { describe, it, expect } from 'vitest';
import { DEMO_ARCHETYPES } from '../../packages/web/src/demo/demo-data';
import { renderDemoGraphSvg } from '../../packages/web/src/demo/demo-graph-svg';
import { renderDemoWidgetHtml, renderDemoScript } from '../../packages/web/src/demo/demo-widget';
import { CANONICAL_TECHNOLOGY_DEFINITIONS } from '../../src/engine/schema/definitions';
import { CANONICAL_ARCHITECTURE_ONTOLOGY } from '../../src/engine/architecture/ontology';
import { SITESTACK_ICON_128_DATA_URI } from '../../src/shared/logo-assets';

describe('Interactive Product Demo — Rigorous Verification Suite', () => {
  const canonicalTechMap = new Map(
    CANONICAL_TECHNOLOGY_DEFINITIONS.map((t) => [t.id, t])
  );

  const canonicalRelSet = new Set(
    CANONICAL_ARCHITECTURE_ONTOLOGY.relationships.map(
      (r) => `${r.sourceId}::${r.targetId}::${r.type}`
    )
  );

  // =========================================================================
  // 1. CANONICAL TECHNOLOGY DEFINITION AUDIT
  // =========================================================================
  describe('1. Canonical Technology Definition Audit', () => {
    it('1.1. provides exactly 4 archetypes covering diverse web architectures', () => {
      expect(DEMO_ARCHETYPES).toHaveLength(4);
      const ids = DEMO_ARCHETYPES.map((a) => a.id);
      expect(ids).toContain('saas');
      expect(ids).toContain('ecommerce');
      expect(ids).toContain('editorial');
      expect(ids).toContain('docs');
    });

    it('1.2. uses only existing canonical technology IDs across all archetypes', () => {
      for (const archetype of DEMO_ARCHETYPES) {
        for (const tech of archetype.technologies) {
          const canonical = canonicalTechMap.get(tech.id);
          expect(canonical).toBeDefined();
          expect(canonical?.name).toBe(tech.name);
          expect(canonical?.category).toBe(tech.category);
        }
      }
    });

    it('1.3. verifies evidence signals against canonical engine rules', () => {
      for (const archetype of DEMO_ARCHETYPES) {
        for (const tech of archetype.technologies) {
          expect(tech.signals.length).toBeGreaterThan(0);
          for (const sig of tech.signals) {
            expect(['global', 'dom_selector', 'resource_url', 'meta', 'header']).toContain(sig.type);
            expect(sig.label.length).toBeGreaterThan(0);
            expect(sig.source.length).toBeGreaterThan(0);
            expect(sig.description.length).toBeGreaterThan(0);
          }
        }
      }
    });

    it('1.4. contains no arbitrary precision percentages or fake latencies', () => {
      for (const archetype of DEMO_ARCHETYPES) {
        for (const tech of archetype.technologies) {
          // Confidence tier must be High or Medium, not 98% or 88%
          expect(['High', 'Medium']).toContain(tech.confidenceTier);
          // Confidence explanation must be explanatory, not numeric percentage
          expect(tech.confidenceExplanation).not.toMatch(/\b\d{1,3}%\b/);
        }
      }
    });
  });

  // =========================================================================
  // 2. CANONICAL ARCHITECTURE ONTOLOGY AUDIT
  // =========================================================================
  describe('2. Canonical Architecture Ontology Audit', () => {
    it('2.1. all relationships match canonical ontology edges exactly', () => {
      for (const archetype of DEMO_ARCHETYPES) {
        for (const rel of archetype.relationships) {
          const key = `${rel.sourceId}::${rel.targetId}::${rel.type}`;
          const existsInOntology = canonicalRelSet.has(key);
          expect(
            existsInOntology,
            `Relationship ${key} in archetype ${archetype.id} must exist in canonical ontology`
          ).toBe(true);
        }
      }
    });

    it('2.2. relationship endpoints exist within the same archetype', () => {
      for (const archetype of DEMO_ARCHETYPES) {
        const archetypeTechIds = new Set(archetype.technologies.map((t) => t.id));
        for (const rel of archetype.relationships) {
          expect(archetypeTechIds.has(rel.sourceId)).toBe(true);
          expect(archetypeTechIds.has(rel.targetId)).toBe(true);
        }
      }
    });
  });

  // =========================================================================
  // 3. VECTOR SVG GRAPH GENERATION
  // =========================================================================
  describe('3. Vector SVG Graph Generation', () => {
    it('3.1. generates responsive, valid SVG elements for each archetype', () => {
      for (const archetype of DEMO_ARCHETYPES) {
        const svg = renderDemoGraphSvg(archetype);
        expect(svg).toContain('<svg');
        expect(svg).toContain('viewBox="0 0 840 400"');
        expect(svg).toContain('demo-graph-grid');
        expect(svg).toContain('demo-arrow-marker');
        expect(svg).toContain('</svg>');

        // Contains all technology nodes
        for (const tech of archetype.technologies) {
          expect(svg).toContain(`data-node-id="${tech.id}"`);
        }

        // Contains relationship paths
        expect(svg).toContain('<path');
      }
    });
  });

  // =========================================================================
  // 4. DEMO WIDGET MARKUP & SCRIPT
  // =========================================================================
  describe('4. Demo Widget Markup & Script Generation', () => {
    it('4.1. renders demo widget with accessible tabs, view switches, and notice', () => {
      const html = renderDemoWidgetHtml();
      expect(html).toContain('id="demo"');
      expect(html).toContain('Simulated Product Demo • 100% Deterministic Local Data');
      expect(html).toContain('role="tablist"');
      expect(html).toContain('demo-archetype-tab');
      expect(html).toContain('demo-view-toggle');
      expect(html).toContain('data-view="stack"');
      expect(html).toContain('data-view="graph"');
      expect(html).toContain('data-view="report"');
      expect(html).toContain('demo-download-json-btn');
      expect(html).toContain('demo-download-svg-btn');
    });

    it('4.2. embeds official icon-128 brand mark in conversion footer', () => {
      const html = renderDemoWidgetHtml();
      expect(html).toContain(SITESTACK_ICON_128_DATA_URI);
      expect(html).toContain('Add to Chrome — Free');
    });

    it('4.3. renders client controller script with valid JSON payload', () => {
      const script = renderDemoScript();
      expect(script).toContain('<script>');
      expect(script).toContain('var archetypes =');
      expect(script).toContain('function updateArchetype(id)');
      expect(script).toContain('function setView(view)');
      expect(script).toContain('sitestack-demo-report-');
      expect(script).toContain('sitestack-demo-graph-');
      expect(script).toContain('</script>');
    });
  });
});
