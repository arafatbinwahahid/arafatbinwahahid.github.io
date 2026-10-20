// Builds /sitemap.xml from every page plus all services, products and blog posts in the JSON files.
import type { APIRoute } from 'astro';
import { site, services, products, posts } from '../lib/data';

const staticPages = [
  '/', '/about', '/experience', '/skills', '/work', '/credentials', '/reviews', '/contact',
  '/services', '/shop', '/blog', '/faq', '/terms-and-conditions', '/privacy-policy', '/refund-policy',
];

export const GET: APIRoute = () => {
  const urls = [
    ...staticPages.map((path) => ({ path })),
    ...services.map((s) => ({ path: `/services/${s.slug}` })),
    ...products.map((p) => ({ path: `/shop/${p.slug}` })),
    ...posts.map((p) => ({ path: `/blog/${p.slug}`, lastmod: p.date })),
  ];
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map((u) => `  <url><loc>${new URL(u.path, site.url).href}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}</url>`)
  .join('\n')}
</urlset>
`;
  return new Response(body, { headers: { 'Content-Type': 'application/xml' } });
};
