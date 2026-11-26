/**
 * SiteStack Public Web Platform — Static Site Generator (SSG) Build Script
 *
 * Emits all static HTML pages, sitemap, robots.txt, and verifies CSS assets in dist-web/.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  CatalogService,
  renderLandingPage,
  renderCatalogPage,
  renderTechnologyDetailPage,
  renderCategoriesPage,
  renderDocsPage,
  renderNotFoundPage,
  generateSitemapXml,
  generateRobotsTxt,
} from './index';

export interface BuildSummary {
  outputDir: string;
  totalPages: number;
  technologyPages: number;
  staticPages: string[];
  sitemapGenerated: boolean;
  robotsGenerated: boolean;
  cssPresent: boolean;
}

export function buildStaticWebsite(targetDir?: string): BuildSummary {
  const rootDir = process.cwd();
  const outputDir = targetDir || path.resolve(rootDir, 'dist-web');

  // Ensure main output directory exists
  fs.mkdirSync(outputDir, { recursive: true });

  const service = new CatalogService();
  const allTechnologies = service.getAllTechnologies();

  // 1. Render Landing Page
  fs.writeFileSync(path.join(outputDir, 'index.html'), renderLandingPage(), 'utf-8');

  // 2. Render Catalog Directory Page
  const catalogDir = path.join(outputDir, 'catalog');
  fs.mkdirSync(catalogDir, { recursive: true });
  fs.writeFileSync(path.join(catalogDir, 'index.html'), renderCatalogPage(), 'utf-8');

  // 3. Render Categories & Ontology Explorer
  const categoriesDir = path.join(outputDir, 'categories');
  fs.mkdirSync(categoriesDir, { recursive: true });
  fs.writeFileSync(path.join(categoriesDir, 'index.html'), renderCategoriesPage(), 'utf-8');

  // 4. Render Documentation & FAQ Page
  const docsDir = path.join(outputDir, 'docs');
  fs.mkdirSync(docsDir, { recursive: true });
  fs.writeFileSync(path.join(docsDir, 'index.html'), renderDocsPage(), 'utf-8');

  // 5. Render All 80 Technology Detail Pages
  const techBaseDir = path.join(outputDir, 'technologies');
  fs.mkdirSync(techBaseDir, { recursive: true });

  let techPageCount = 0;
  for (const tech of allTechnologies) {
    const singleTechDir = path.join(techBaseDir, tech.id);
    fs.mkdirSync(singleTechDir, { recursive: true });
    const techHtml = renderTechnologyDetailPage(tech.id);
    fs.writeFileSync(path.join(singleTechDir, 'index.html'), techHtml, 'utf-8');
    techPageCount++;
  }

  // 6. Generate Sitemap & Robots
  fs.writeFileSync(path.join(outputDir, 'sitemap.xml'), generateSitemapXml(), 'utf-8');
  fs.writeFileSync(path.join(outputDir, 'robots.txt'), generateRobotsTxt(), 'utf-8');

  // 7. Render 404 Error Page (Cloudflare Pages fallback)
  fs.writeFileSync(path.join(outputDir, '404.html'), renderNotFoundPage(), 'utf-8');

  // 8. Generate Cloudflare Pages _headers (Security & Asset Caching)
  const headersContent = `/*
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  Referrer-Policy: strict-origin-when-cross-origin

/assets/*
  Cache-Control: public, max-age=31536000, immutable

/icons/*
  Cache-Control: public, max-age=86400
`;
  fs.writeFileSync(path.join(outputDir, '_headers'), headersContent, 'utf-8');

  // 7. Copy Original Canonical Brand Icons
  const publicIconsDir = path.resolve(rootDir, 'public', 'icons');
  const targetIconsDir = path.join(outputDir, 'icons');
  if (fs.existsSync(publicIconsDir)) {
    fs.mkdirSync(targetIconsDir, { recursive: true });
    for (const iconFile of fs.readdirSync(publicIconsDir)) {
      fs.copyFileSync(
        path.join(publicIconsDir, iconFile),
        path.join(targetIconsDir, iconFile)
      );
    }
  }

  const cssPath = path.join(outputDir, 'assets', 'style.css');
  const cssPresent = fs.existsSync(cssPath);

  const summary: BuildSummary = {
    outputDir,
    totalPages: techPageCount + 4,
    technologyPages: techPageCount,
    staticPages: ['/', '/catalog', '/categories', '/docs'],
    sitemapGenerated: true,
    robotsGenerated: true,
    cssPresent,
  };

  console.log(`\n======================================================`);
  console.log(`[SiteStack Static Web Builder] Build Completed Successfully`);
  console.log(`  Output Directory : ${outputDir}`);
  console.log(`  Total HTML Pages : ${summary.totalPages}`);
  console.log(`  Technology Pages : ${summary.technologyPages}`);
  console.log(`  Sitemap XML      : Generated`);
  console.log(`  Robots TXT       : Generated`);
  console.log(`  Bundled CSS      : ${cssPresent ? 'Present' : 'Not yet compiled'}`);
  console.log(`======================================================\n`);

  return summary;
}

// Execute build if run directly (not during vitest runs)
if (!process.env.VITEST) {
  buildStaticWebsite();
}
