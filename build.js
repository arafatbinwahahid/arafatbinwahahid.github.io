// Static site generator: turns data/*.json into plain HTML pages in dist/.
//   node build.js           build the site
//   node build.js --serve   build, then preview at http://localhost:8080
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { ROOT, site, sitemap, absUrl } from './templates/helpers.js';
import { layout } from './templates/layout.js';
import { allPages } from './templates/pages.js';

const OUT = path.join(ROOT, 'dist');

function write(file, content) {
  const full = path.join(OUT, file);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content);
}

fs.rmSync(OUT, { recursive: true, force: true });
const pages = allPages();
for (const p of pages) write(p.file || path.join(p.path, 'index.html'), layout(p));

// sitemap.xml (links come from data/global/sitemap.json)
const urls = sitemap.urls.map((u) => `  <url><loc>${u}</loc></url>`);
write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`);
for (const p of pages) if (!p.noindex && !sitemap.urls.includes(absUrl(p.path))) console.warn(`  ! Not in sitemap.json: ${absUrl(p.path)}`);

// robots.txt
const { allow = [], disallow = [] } = site.robots;
write('robots.txt', ['User-agent: *', ...allow.map((r) => `Allow: ${r}`), ...disallow.map((r) => `Disallow: ${r}`), '', `Sitemap: ${absUrl('/sitemap.xml')}`, ''].join('\n'));

// Static files
fs.cpSync(path.join(ROOT, 'assets'), path.join(OUT, 'assets'), { recursive: true });

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
