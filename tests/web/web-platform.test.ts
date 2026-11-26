import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import {
  CatalogService,
  renderLandingPage,
  renderCatalogPage,
  renderTechnologyDetailPage,
  renderCategoriesPage,
  renderDocsPage,
  generateSitemapXml,
  generateRobotsTxt,
  CHROME_WEB_STORE_EXTENSION_ID,
  CHROME_WEB_STORE_URL,
} from '../../packages/web/src';
import { buildStaticWebsite } from '../../packages/web/src/build';

describe('SiteStack Stage 4.3: Public Web Platform & Catalog Suite', () => {
  const service = new CatalogService();

  // =========================================================================
  // 1. CATALOG SERVICE & ONTOLOGY
  // =========================================================================
  describe('1. Catalog Service & Ontology Integration', () => {
    it('1.1. indexes the full canonical catalog of exactly 80 technologies', () => {
      const allTechs = service.getAllTechnologies();
      expect(allTechs.length).toBe(80);
    });

    it('1.2. groups technologies across the 8 official categories', () => {
      const categories = service.getCategories();
      expect(categories).toHaveLength(8);

      const categoryNames = categories.map((c) => c.category);
      expect(categoryNames).toContain('cms');
      expect(categoryNames).toContain('framework');
      expect(categoryNames).toContain('library');
      expect(categoryNames).toContain('analytics');
      expect(categoryNames).toContain('marketing');
      expect(categoryNames).toContain('ecommerce');
      expect(categoryNames).toContain('payment');
      expect(categoryNames).toContain('infrastructure');

      for (const cat of categories) {
        expect(cat.count).toBeGreaterThan(0);
      }
    });

    it('1.3. exposes all 41 architectural ontology relationships with resolved names', () => {
      const relationships = service.getAllRelationships();
      expect(relationships.length).toBe(41);

      // Verify a known key relationship (Next.js -> React)
      const nextReactRel = relationships.find(
        (r) => r.sourceId === 'nextjs' && r.targetId === 'react'
      );
      expect(nextReactRel).toBeDefined();
      expect(nextReactRel?.sourceName).toBe('Next.js');
      expect(nextReactRel?.targetName).toBe('React');
      expect(nextReactRel?.type).toBe('depends_on');
    });

    it('1.4. filters and searches catalog by keyword, ID, and category', () => {
      const cmsResults = service.search(undefined, 'cms');
      expect(cmsResults.length).toBeGreaterThan(0);
      for (const t of cmsResults) {
        expect(t.category).toBe('cms');
      }

      const reactSearch = service.search('react');
      expect(reactSearch.length).toBeGreaterThan(0);
      expect(reactSearch.some((t) => t.id === 'react')).toBe(true);
    });

    it('1.5. returns category metadata and technologies for each category', () => {
      const meta = service.getCategoryMetadata('framework');
      expect(meta.displayName).toContain('Framework');

      const frameworks = service.getTechnologiesByCategory('framework');
      expect(frameworks.length).toBeGreaterThan(0);
      expect(frameworks.every((f) => f.category === 'framework')).toBe(true);
    });
  });

  // =========================================================================
  // 2. PAGE RENDERERS & RESPONSIVE DESIGN
  // =========================================================================
  describe('2. Public Web Page Renderers', () => {
    it('2.1. renders landing page with 80 technologies, interactive product demo, and local stylesheet', () => {
      const html = renderLandingPage();
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('SiteStack');
      expect(html).toContain('80 Technologies');
      expect(html).toContain('41 Relationships');
      expect(html).toContain('Zero Telemetry');
      expect(html).toContain('/assets/style.css');
      expect(html).not.toContain('cdn.tailwindcss.com');
      expect(html).toContain('id="demo"');
      expect(html).toContain('Simulated Product Demo');
      expect(html).toContain('demo-archetype-tab');
      expect(html).toContain('demo-download-json-btn');
      expect(html).toContain('demo-download-svg-btn');
      expect(html).toContain('<meta name="google-site-verification" content="h_pXt4YWPMGFCMNaTUXurP0CTFodp0TsijyukfYjaRo" />');
    });

    it('2.2. renders catalog directory page with filter tabs and all 80 cards', () => {
      const html = renderCatalogPage();
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('Verified Technology Catalog');
      expect(html).toContain('catalog-search');
      expect(html).toContain('category-filter-btn');
      expect(html).toContain('Frameworks (');
      expect(html).toContain('Libraries (');
      expect(html).toContain('CMS (');
      expect(html).toContain('data-id="react"');
      expect(html).toContain('data-id="nextjs"');
      expect(html).toContain('data-id="wordpress"');
      expect(html).toContain('/assets/style.css');
      expect(html).not.toContain('cdn.tailwindcss.com');
    });

    it('2.3. renders technology detail page with architectural dependencies & JSON-LD', () => {
      const html = renderTechnologyDetailPage('nextjs');
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('Next.js');
      expect(html).toContain('Upstream Dependencies &amp; Integrations');
      expect(html).toContain('react');
      expect(html).toContain('https://nextjs.org');
      expect(html).toContain('application/ld+json');
      expect(html).toContain('SoftwareApplication');
      expect(html).toContain('/assets/style.css');
    });

    it('2.4. renders all 80 canonical technology detail pages without error', () => {
      const allTechs = service.getAllTechnologies();
      for (const tech of allTechs) {
        const pageHtml = renderTechnologyDetailPage(tech.id);
        expect(pageHtml).toContain(tech.name);
        expect(pageHtml).toContain(tech.category);
        expect(pageHtml).toContain('/assets/style.css');
      }
    });

    it('2.5. handles non-existent technology gracefully with 404 page', () => {
      const html = renderTechnologyDetailPage('non-existent-tech-xyz');
      expect(html).toContain('Technology Not Found');
      expect(html).toContain('non-existent-tech-xyz');
    });

    it('2.6. renders categories & architecture ontology explorer with all 41 relationships', () => {
      const html = renderCategoriesPage();
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('Architecture Layers &amp; Ontology');
      expect(html).toContain('41 Architectural Graph Relationships');
      expect(html).toContain('relationships-tbody');
      expect(html).toContain('ontology-search');
      expect(html).toContain('Next.js');
      expect(html).toContain('React');
    });

    it('2.7. renders documentation & FAQ page with privacy model and API specification preview', () => {
      const html = renderDocsPage();
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('Detection Methodology');
      expect(html).toContain('Local-First Guarantee');
      expect(html).toContain('Zero Telemetry');
      expect(html).not.toContain('cf-ray');
      expect(html).toContain('Specification Preview');
      expect(html).toContain('DeclarativeEvaluator');
      expect(html).toContain('Frequently Asked Questions');
    });
  });

  // =========================================================================
  // 3. SITEMAP & ROBOTS GENERATION
  // =========================================================================
  describe('3. SEO Sitemap & Robots Generation', () => {
    it('3.1. generates sitemap.xml covering all 84 pages (4 main + 80 technologies)', () => {
      const sitemap = generateSitemapXml();
      expect(sitemap).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(sitemap).toContain('<urlset');
      expect(sitemap).toContain('<loc>https://sitestack.dev/</loc>');
      expect(sitemap).toContain('<loc>https://sitestack.dev/catalog</loc>');
      expect(sitemap).toContain('<loc>https://sitestack.dev/categories</loc>');
      expect(sitemap).toContain('<loc>https://sitestack.dev/docs</loc>');
      expect(sitemap).toContain('<loc>https://sitestack.dev/technologies/react</loc>');
      expect(sitemap).toContain('<loc>https://sitestack.dev/technologies/wordpress</loc>');

      const urlCount = (sitemap.match(/<url>/g) || []).length;
      expect(urlCount).toBe(84);
    });

    it('3.2. generates robots.txt referencing sitemap', () => {
      const robots = generateRobotsTxt();
      expect(robots).toContain('User-agent: *');
      expect(robots).toContain('Allow: /');
      expect(robots).toContain('Sitemap: https://sitestack.dev/sitemap.xml');
    });
  });

  // =========================================================================
  // 4. STATIC SITE BUILDER EXECUTION
  // =========================================================================
  describe('4. Static Site Generator Build Process', () => {
    it('4.1. builds complete static website to target output directory', () => {
      const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sitestack-web-build-'));
      try {
        const summary = buildStaticWebsite(tempDir);
        expect(summary.totalPages).toBe(84);
        expect(summary.technologyPages).toBe(80);
        expect(summary.sitemapGenerated).toBe(true);
        expect(summary.robotsGenerated).toBe(true);

        // Verify key files exist on disk
        expect(fs.existsSync(path.join(tempDir, 'index.html'))).toBe(true);
        expect(fs.existsSync(path.join(tempDir, 'catalog', 'index.html'))).toBe(true);
        expect(fs.existsSync(path.join(tempDir, 'categories', 'index.html'))).toBe(true);
        expect(fs.existsSync(path.join(tempDir, 'docs', 'index.html'))).toBe(true);
        expect(fs.existsSync(path.join(tempDir, 'sitemap.xml'))).toBe(true);
        expect(fs.existsSync(path.join(tempDir, 'robots.txt'))).toBe(true);
        expect(fs.existsSync(path.join(tempDir, 'technologies', 'react', 'index.html'))).toBe(true);
        expect(fs.existsSync(path.join(tempDir, 'technologies', 'nextjs', 'index.html'))).toBe(true);
      } finally {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    });
  });

  // =========================================================================
  // 5. CHROME WEB STORE CTA INTEGRATION
  // =========================================================================
  describe('5. Chrome Web Store CTA & Extension Listing Integrity', () => {
    it('5.1. exports canonical Chrome Web Store extension ID and listing URL', () => {
      expect(CHROME_WEB_STORE_EXTENSION_ID).toBe('ldbjgbplogpoejlbcmkmpbfmbnaphfla');
      expect(CHROME_WEB_STORE_URL).toContain('ldbjgbplogpoejlbcmkmpbfmbnaphfla');
      expect(CHROME_WEB_STORE_URL).toContain('sitestack');
    });

    it('5.2. embeds canonical store listing URL across landing page, header, mobile nav, demo, and footer', () => {
      const landingHtml = renderLandingPage();
      expect(landingHtml).toContain(CHROME_WEB_STORE_URL);

      // Verify no generic webstore links without the extension ID exist
      const genericWebstoreLinks = (landingHtml.match(/href="https:\/\/chrome\.google\.com\/webstore"/g) || []).length;
      expect(genericWebstoreLinks).toBe(0);

      // Verify all occurrences use the canonical URL
      const canonicalOccurrences = (landingHtml.match(new RegExp(CHROME_WEB_STORE_URL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
      // Landing page contains: desktop header, mobile header, hero CTA, demo CTA, bottom banner CTA, and footer link (6 total)
      expect(canonicalOccurrences).toBe(6);
    });
  });
});
