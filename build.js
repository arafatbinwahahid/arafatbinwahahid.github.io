// Static site generator: turns data/*.json into plain HTML pages in dist/.
//   node build.js           build the site
//   node build.js --serve   build, then preview at http://localhost:8080
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { ROOT, site, sitemap, products, payments, absUrl, buildImages } from './templates/helpers.js';
import { layout } from './templates/layout.js';
import { allPages } from './templates/pages.js';

const OUT = path.join(ROOT, 'dist');

function write(file, content) {
  const full = path.join(OUT, file);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content);
}

// Check shop data before building: a wrong price or stock should stop the build, not reach customers
const codes = payments.currencies.map((c) => c.code);
const ids = new Set();
for (const p of products) {
  const where = `data/collections/products.json (${p.slug || p.title})`;
  if (!p.id || ids.has(p.id)) throw new Error(`${where}: every product needs its own "id"`);
  ids.add(p.id);
  for (const c of codes) if (!(p.prices?.[c] > 0)) throw new Error(`${where}: "prices" needs a ${c} price above 0`);
  if (!Number.isInteger(p.stock) || p.stock < 0) throw new Error(`${where}: "stock" must be a whole number, 0 or more`);
  if (!p.images?.length) throw new Error(`${where}: add at least one image in "images"`);
}
if (!codes.includes(payments.defaultCurrency)) throw new Error(`data/global/payments.json: "defaultCurrency" must be one of ${codes.join(', ')}`);
for (const c of payments.currencies) for (const m of c.methods) {
  if (m.enabled === false) continue;
  const empty = (m.details || []).filter((r) => !r.value).map((r) => r.label);
  if (empty.length) console.warn(`  ! Payment ${m.id}: empty details (${empty.join(', ')}), customers are asked to message on WhatsApp`);
  if (m.type === 'appointment' && !m.location?.mapQuery) console.warn(`  ! Payment ${m.id}: no map location set`);
}

fs.rmSync(OUT, { recursive: true, force: true });
const pages = allPages();
for (const p of pages) write(p.file || path.join(p.path, 'index.html'), layout(p));

// sitemap.xml: links from data/global/sitemap.json, then every other page added automatically
const added = pages.filter((p) => !p.noindex).map((p) => absUrl(p.path)).filter((u) => !sitemap.urls.includes(u));
const urls = [...sitemap.urls, ...added].map((u) => `  <url><loc>${u}</loc></url>`);
write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`);

// robots.txt
const { allow = [], disallow = [] } = site.robots;
write('robots.txt', ['User-agent: *', ...allow.map((r) => `Allow: ${r}`), ...disallow.map((r) => `Disallow: ${r}`), '', `Sitemap: ${absUrl('/sitemap.xml')}`, ''].join('\n'));

// Static files
fs.cpSync(path.join(ROOT, 'assets'), path.join(OUT, 'assets'), { recursive: true });
fs.mkdirSync(path.join(OUT, 'assets/opt'), { recursive: true });
const optimised = await buildImages(OUT);
if (!optimised) console.warn('  ! "sharp" is not installed: images are not converted to WebP (run npm install)');

// Minify CSS (edit the readable assets/css/style.css, the site gets the small version)
const cssFile = path.join(OUT, 'assets/css/style.css');
const css = fs.readFileSync(cssFile, 'utf8')
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/\s+/g, ' ')
  .replace(/\s*([{}:;,>])\s*/g, '$1')
  .replace(/;}/g, '}')
  .trim();
fs.writeFileSync(cssFile, css);
if (fs.existsSync(path.join(ROOT, 'CNAME'))) fs.copyFileSync(path.join(ROOT, 'CNAME'), path.join(OUT, 'CNAME'));
fs.writeFileSync(path.join(OUT, '.nojekyll'), '');

// Warn about sitemap links that point to nothing
for (const u of sitemap.urls) {
  const file = path.join(OUT, decodeURI(new URL(u).pathname));
  const ok = fs.existsSync(file) && (fs.statSync(file).isFile() || fs.existsSync(path.join(file, 'index.html')));
  if (!u.startsWith(site.url) || !ok) console.warn(`  ! Broken link in sitemap.json: ${u}`);
}

console.log(`Built ${pages.length} pages + sitemap.xml + robots.txt into dist/`);

if (process.argv.includes('--serve')) {
  const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.xml': 'application/xml', '.txt': 'text/plain', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.pdf': 'application/pdf', '.webp': 'image/webp' };
  http.createServer((req, res) => {
    let file = path.join(OUT, decodeURIComponent(req.url.split('?')[0]));
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
    const found = fs.existsSync(file);
    if (!found) file = path.join(OUT, '404.html');
    res.writeHead(found ? 200 : 404, { 'Content-Type': types[path.extname(file).toLowerCase()] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  }).listen(8080, () => console.log('Preview: http://localhost:8080'));
}
