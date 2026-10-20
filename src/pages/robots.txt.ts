// Builds /robots.txt from the "robots" settings in src/data/settings/site.json.
import type { APIRoute } from 'astro';
import { site } from '../lib/data';

export const GET: APIRoute = () => {
  const lines = [
    'User-agent: *',
    ...site.robots.allow.map((p) => `Allow: ${p}`),
    ...site.robots.disallow.map((p) => `Disallow: ${p}`),
    '',
    `Sitemap: ${new URL('/sitemap.xml', site.url).href}`,
    '',
  ];
  return new Response(lines.join('\n'), { headers: { 'Content-Type': 'text/plain' } });
};
