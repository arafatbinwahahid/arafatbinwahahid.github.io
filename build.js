// Static site generator: turns data/*.json into plain HTML pages in dist/.
//   node build.js           build the site
//   node build.js --serve   build, then preview at http://localhost:8080
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { ROOT, site, sitemap, products, payments, absUrl, buildImages, optionsOf, hasSharp, paypalIdOk } from './templates/helpers.js';
import { layout, isNoindex } from './templates/layout.js';
import { allPages } from './templates/pages.js';
import { validateData } from './templates/validate.js';
import { webmcpScript } from './templates/webmcp.js';

const OUT = path.join(ROOT, 'dist');

function write(file, content) {
  const full = path.join(OUT, file);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content);
}

// Check every data file against schemas/, then the rules that need more than one file
await validateData();
const codes = payments.currencies.map((c) => c.code);
const ids = new Set();
for (const p of products) {
  const where = `data/collections/products.json (${p.slug || p.title})`;
  for (const id of [p.id, ...(p.variants || []).map((v) => v.id)]) {
    if (!id || ids.has(id)) throw new Error(`${where}: every product and plan needs its own "id" (${id || 'missing'})`);
    ids.add(id);
  }
  for (const o of optionsOf(p)) {
    const what = o.name ? `${where}, plan "${o.name}"` : where;
    for (const c of codes) if (!(o.prices?.[c] > 0)) throw new Error(`${what}: "prices" needs a ${c} price above 0 (currencies come from payments.json)`);
  }
}
if (!codes.includes(payments.defaultCurrency)) throw new Error(`data/global/payments.json: "defaultCurrency" must be one of ${codes.join(', ')}`);
for (const c of payments.currencies) for (const m of c.methods) {
  if (m.enabled === false) continue;
  const empty = (m.details || []).filter((r) => !r.value).map((r) => r.label);
  if (empty.length) console.warn(`  ! Payment ${m.id}: empty details (${empty.join(', ')}), customers are asked to message on WhatsApp`);
  if (m.type === 'appointment' && !m.location?.mapQuery) console.warn(`  ! Payment ${m.id}: no map location set`);
  if (m.paypalClientId && !paypalIdOk(m.paypalClientId)) console.warn(`  ! Payment ${m.id}: "paypalClientId" is not a PayPal Client ID, so the PayPal buttons are hidden. Use the Client ID of your app (developer.paypal.com → Apps & Credentials → Live, about 80 characters, starts with "A"), not the code of a Pay link or button ("BAA...")`);
}

fs.rmSync(OUT, { recursive: true, force: true });
const pages = allPages();
for (const p of pages) write(p.file || path.join(p.path, 'index.html'), layout(p));

// sitemap.xml: links from data/global/sitemap.json, then every other page added automatically
// Pages marked noindex are left out, even when sitemap.json lists them
const hidden = new Set(pages.filter(isNoindex).map((p) => absUrl(p.path)));
const added = pages.filter((p) => !isNoindex(p)).map((p) => absUrl(p.path)).filter((u) => !sitemap.urls.includes(u));
const urls = [...sitemap.urls.filter((u) => !hidden.has(u)), ...added].map((u) => `  <url><loc>${u}</loc></url>`);
write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`);

// webmcp.js: tools for AI agents in the browser (WebMCP), made from the same data
write('webmcp.js', webmcpScript(pages));

// robots.txt
const { allow = [], disallow = [] } = site.robots;
write('robots.txt', ['User-agent: *', ...allow.map((r) => `Allow: ${r}`), ...disallow.map((r) => `Disallow: ${r}`), '', `Sitemap: ${absUrl('/sitemap.xml')}`, ''].join('\n'));

// Static files. With sharp, pages use the small copies in assets/opt/, so the original uploads in assets/images/ are left out.
const IMAGES = path.join(ROOT, 'assets/images');
// The CSS is written into every page's <head> (see templates/layout.js), so the file itself is not copied.
const CSS = path.join(ROOT, 'assets/css');
fs.cpSync(path.join(ROOT, 'assets'), path.join(OUT, 'assets'), { recursive: true, filter: (src) => !src.startsWith(CSS) && (!hasSharp || !src.startsWith(IMAGES)) });
fs.mkdirSync(path.join(OUT, 'assets/opt'), { recursive: true });
await buildImages(OUT);
if (!hasSharp) console.warn('  ! "sharp" is not installed: images are not converted to WebP (run npm install)');

// Site search index for /search/ (Pagefind reads the pages that have data-pagefind-body)
try {
  const pagefind = await import('pagefind');
  const { index } = await pagefind.createIndex({});
  const { errors, page_count } = await index.addDirectory({ path: OUT });
  if (errors.length) throw new Error(errors.join('; '));
  await index.writeFiles({ outputPath: path.join(OUT, 'pagefind') });
  await pagefind.close();
  console.log(`Search index: ${page_count} pages`);
} catch (e) {
  console.warn(`  ! Search index not made (${e.code === 'ERR_MODULE_NOT_FOUND' ? 'run npm install' : e.message})`);
}

// Minify JS: drop comment lines and indentation (edit the readable files in assets/js/)
for (const f of fs.readdirSync(path.join(OUT, 'assets/js'))) {
  const file = path.join(OUT, 'assets/js', f);
  fs.writeFileSync(file, fs.readFileSync(file, 'utf8').split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('//')).join('\n'));
}
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
