/**
 * SiteStack Public Web Platform — Sitemap & Robots Generator
 */

import { CatalogService } from './catalog-service';

export function generateSitemapXml(): string {
  const service = new CatalogService();
  const technologies = service.getAllTechnologies();
  const baseUrl = 'https://sitestack.dev';
  const lastmod = new Date().toISOString().split('T')[0];

  const staticRoutes = [
    { loc: `${baseUrl}/`, priority: '1.0', changefreq: 'weekly' },
    { loc: `${baseUrl}/catalog`, priority: '0.9', changefreq: 'daily' },
    { loc: `${baseUrl}/categories`, priority: '0.8', changefreq: 'weekly' },
    { loc: `${baseUrl}/docs`, priority: '0.8', changefreq: 'monthly' },
  ];

  const techRoutes = technologies.map((t) => ({
    loc: `${baseUrl}/technologies/${t.id}`,
    priority: '0.7',
    changefreq: 'weekly',
  }));

  const allRoutes = [...staticRoutes, ...techRoutes];

  const urlElements = allRoutes.map((route) => `  <url>
    <loc>${route.loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlElements}
</urlset>`;
}

export function generateRobotsTxt(): string {
  return `# SiteStack Public Web Platform — Crawling Rules
User-agent: *
Allow: /

Sitemap: https://sitestack.dev/sitemap.xml
`;
}
