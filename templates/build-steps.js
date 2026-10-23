// Build steps around the pages Astro makes (astro.config.mjs → templates/astro-site.js):
//   checkData()        before the build: every JSON file against schemas/, then the rules that need more than one file
//   finish(OUT, pages) after the build: sitemap.xml, robots.txt, CMS, WebMCP, images, search index, small JS files
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, site, sitemap, products, services, payments, tools, rates, absUrl, buildImages, optionsOf, hasSharp, paypalIdOk } from './helpers.js';
import { isNoindex } from './layout.js';
import { validateData } from './validate.js';
import { webmcpScript } from './webmcp.js';
import { cmsConfig, adminHtml } from './cms.js';
import { checkCms } from './cms-check.js';

export async function checkData() {
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
  // Free tools: the service, currencies and slugs they point to must exist
  const rateCodes = rates.currencies.map((c) => c.code);
  const twice = (list) => list.find((x, i) => list.indexOf(x) !== i);
  if (rates.currencies.find((c) => c.code === 'USD')?.rate !== 1) throw new Error('data/global/rates.json: "currencies" needs USD with rate 1 (every rate is per 1 USD)');
  if (twice(rateCodes)) throw new Error(`data/global/rates.json: ${twice(rateCodes)} is listed twice in "currencies"; keep one and change its rate`);
  const toolSlugs = new Set();
  for (const t of tools) {
    const where = `data/collections/tools.json (${t.slug})`;
    if (toolSlugs.has(t.slug)) throw new Error(`${where}: two tools use the same "slug"`);
    toolSlugs.add(t.slug);
    if (t.type === 'website-cost') {
      const K = t.calculator;
      const svc = services.find((s) => s.slug === K.service);
      if (!svc) throw new Error(`${where}: "calculator.service" must be the slug of a service in services.json (not a draft)`);
      if (!rateCodes.includes(K.currency)) throw new Error(`${where}: "calculator.currency" ${K.currency} is not in data/global/rates.json`);
      for (const pk of svc.packages) if (!(pk.prices?.[K.currency] > 0)) throw new Error(`${where}: package "${pk.name}" of the service "${svc.slug}" needs a ${K.currency} price above 0 for the calculator`);
      const ids = K.extras.map((x) => x.id);
      if (twice(ids)) throw new Error(`${where}: two extras use the id "${twice(ids)}"`);
    }
    if (t.type === 'currency') {
      const C = t.converter;
      for (const c of [C.from, C.to, ...C.pairs.flatMap((p) => [p.from, p.to])]) if (!rateCodes.includes(c)) throw new Error(`${where}: currency ${c} is not in data/global/rates.json`);
      for (const p of [C, ...C.pairs]) if (p.from === p.to) throw new Error(`${where}: a pair needs two different currencies (${p.from})`);
      const pairs = C.pairs.map((p) => `${p.from} → ${p.to}`);
      if (twice(pairs)) throw new Error(`${where}: the pair ${twice(pairs)} is listed twice`);
    }
  }
  // "paymentsOff" on a product or service must name a method in payments.json (a removed method is only warned about)
  const methodIds = new Set(payments.currencies.flatMap((c) => c.methods.map((m) => m.id)));
  for (const x of [...products, ...services]) for (const id of x.paymentsOff || []) if (!methodIds.has(id)) console.warn(`  ! ${x.slug}: "paymentsOff" names ${id}, which is not a payment method any more`);
  if (!codes.includes(payments.defaultCurrency)) throw new Error(`data/global/payments.json: "defaultCurrency" must be one of ${codes.join(', ')}`);
  for (const c of payments.currencies) for (const m of c.methods) {
    if (m.enabled === false) continue;
    const empty = (m.details || []).filter((r) => !r.value).map((r) => r.label);
    if (empty.length) console.warn(`  ! Payment ${m.id}: empty details (${empty.join(', ')}), customers are asked to message on WhatsApp`);
    if (m.type === 'appointment' && !m.location?.mapQuery) console.warn(`  ! Payment ${m.id}: no map location set`);
    if (m.paypalClientId && !paypalIdOk(m.paypalClientId)) console.warn(`  ! Payment ${m.id}: "paypalClientId" is not a PayPal Client ID, so the PayPal buttons are hidden. Copy the whole Client ID of your app with its copy button (developer.paypal.com → Apps & Credentials → Live, about 80 characters); it is ${m.paypalClientId.length} characters now`);
  }
}

export async function finish(OUT, pages) {
  const write = (file, content) => {
    const full = path.join(OUT, file);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, content);
  };
  // sitemap.xml: links from data/global/sitemap.json, then every other page added automatically
  // Pages marked noindex are left out, even when sitemap.json lists them
  const hidden = new Set(pages.filter(isNoindex).map((p) => absUrl(p.path)));
  const added = pages.filter((p) => !isNoindex(p)).map((p) => absUrl(p.path)).filter((u) => !sitemap.urls.includes(u));
  // Links in sitemap.json to a page that no longer exists (e.g. a product set to Draft) are left out too
  const known = new Set(pages.map((p) => absUrl(p.path)));
  const exists = (u) => known.has(u) || (u.startsWith(site.url) && fs.existsSync(path.join(ROOT, decodeURI(new URL(u).pathname))));
  const urls = [...sitemap.urls.filter((u) => !hidden.has(u) && exists(u)), ...added].map((u) => `  <url><loc>${u}</loc></url>`);
  write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`);

  // /admin/: Sveltia CMS. The config is JSON, which is also valid YAML
  const cms = cmsConfig();
  checkCms(cms);
  write('admin/index.html', adminHtml());
  write('admin/config.yml', `${JSON.stringify(cms, null, 2)}\n`);

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
  // Only for the copy on GitHub Pages (Cloudflare ignores these)
  if (fs.existsSync(path.join(ROOT, 'CNAME'))) fs.copyFileSync(path.join(ROOT, 'CNAME'), path.join(OUT, 'CNAME'));
  fs.writeFileSync(path.join(OUT, '.nojekyll'), '');

  // Warn about sitemap links that point to nothing
  for (const u of sitemap.urls) {
    const file = path.join(OUT, decodeURI(new URL(u).pathname));
    const ok = fs.existsSync(file) && (fs.statSync(file).isFile() || fs.existsSync(path.join(file, 'index.html')));
    if (!u.startsWith(site.url) || !ok) console.warn(`  ! sitemap.json links to a page that does not exist (left out of sitemap.xml): ${u}`);
  }
}
