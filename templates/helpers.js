// Loads every JSON file in data/ and provides small HTML helpers.
import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// The project folder. Astro bundles this file into dist/server/ while building, so then the folder it is run from is used.
const here = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const ROOT = fs.existsSync(path.join(here, 'data')) ? here : process.cwd();
const DATA = path.join(ROOT, 'data');

// The CMS saves empty fields as "" or null (and empty objects like a link with no text). Treat them as not filled in,
// so an untouched optional field never fails the checks in schemas/. Lists are kept, even when empty.
function tidy(v) {
  if (Array.isArray(v)) return v.map(tidy);
  if (!v || typeof v !== 'object') return v;
  for (const k of Object.keys(v)) {
    const t = tidy(v[k]);
    if (t === '' || t == null || (typeof t === 'object' && !Array.isArray(t) && !Object.keys(t).length)) delete v[k];
    else v[k] = t;
  }
  return v;
}

export function read(file) {
  const text = fs.readFileSync(path.join(DATA, file), 'utf8');
  try {
    return tidy(JSON.parse(text));
  } catch (e) {
    // Phone keyboards type curly quotes “ ” which JSON does not accept; retry with straight ones
    if (/[“”]/.test(text)) {
      try {
        const data = tidy(JSON.parse(text.replace(/[“”]/g, '"')));
        console.warn(`  ! data/${file}: curly quotes “ ” were read as straight quotes ". Please use " in JSON.`);
        return data;
      } catch {}
    }
    throw new Error(`Problem in data/${file}: ${e.message}`);
  }
}

export const site = read('global/site.json');
export const header = read('global/header.json');
export const footer = read('global/footer.json');
export const contact = read('global/contact.json');
export const social = read('global/social.json');
export const sitemap = read('global/sitemap.json');
export const payments = read('global/payments.json');
export const icons = read('global/icons.json');
// "status": "draft" hides a product or service from the site (the CMS has a Status field)
// Exchange rates (payments.json → currencies → "rate": 1 USD in that currency, set by hand).
// A currency with a rate gets every product price worked out from the USD price, rounded UP to "roundTo"
// (so a rate never makes you lose money); a currency without a rate keeps the prices written by hand.
const BASE = 'USD';
const rated = payments.currencies.filter((c) => c.code !== BASE && c.rate > 0);
const roundUp = (n, step) => Math.round(Math.ceil(n / step - 1e-9) * step * 1000) / 1000;
const stepOf = (c) => c.roundTo > 0 ? c.roundTo : c.code === 'OMR' ? 0.001 : 0.01;
function withRates(prices) {
  if (!prices?.[BASE]) return prices;
  const out = { ...prices };
  for (const c of rated) out[c.code] = roundUp(prices[BASE] * c.rate, stepOf(c));
  return out;
}
const ratePrices = (o) => ({ ...o, prices: withRates(o.prices), ...(o.compareAtPrices && { compareAtPrices: withRates(o.compareAtPrices) }) });
// Service packages without a USD price get one from their own currency's rate (the PayPal button needs USD)
function packageUsd(prices) {
  if (prices.USD) return prices;
  const [code, v] = Object.entries(prices)[0] || [];
  const c = rated.find((x) => x.code === code);
  return c ? { ...prices, USD: roundUp(v / c.rate, 0.01) } : prices;
}

// "status": "draft" hides a product or service from the site (the CMS has a Status field)
export const products = read('collections/products.json').filter((p) => p.status !== 'draft')
  .map((p) => (p.variants?.length ? { ...p, variants: p.variants.map(ratePrices) } : ratePrices(p)));
export const services = read('collections/services.json').filter((s) => s.status !== 'draft')
  .map((s) => ({ ...s, packages: s.packages.map((pk) => ({ ...pk, prices: packageUsd(pk.prices) })) }));
export const page = (name) => read(`pages/${name}.json`);
// Free tools (/tools/) and the exchange rates they use (rate = units of a currency per 1 USD, set by hand)
export const tools = read('collections/tools.json').filter((t) => t.status !== 'draft');
const ratesFile = read('global/rates.json');
// Decimals left empty = the currency's usual number (OMR 3, USD 2), the same everywhere the rates are shown
const usualDecimals = (code) => { try { return new Intl.NumberFormat('en-US', { style: 'currency', currency: code }).resolvedOptions().maximumFractionDigits; } catch { return 2; } };
export const rates = { ...ratesFile, currencies: (ratesFile.currencies || []).map((c) => ({ ...c, decimals: c.decimals ?? usualDecimals(c.code) })) };
export const posts = fs
  .readdirSync(path.join(DATA, 'collections/blog'))
  .filter((f) => f.endsWith('.json'))
  .map((f) => read(`collections/blog/${f}`))
  .filter((p) => !p.draft)
  .sort((a, b) => b.date.localeCompare(a.date));

// The stylesheet, minified, for the <style> tag in every page (edit the readable assets/css/style.css).
// Styles only a few pages use are in their own file (assets/css/tools.css, admin.css) and written only into those pages.
const minifyCss = (file) => fs.readFileSync(path.join(ROOT, 'assets/css', file), 'utf8')
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/\s+/g, ' ')
  .replace(/\s*([{}:;,>])\s*/g, '$1')
  .replace(/;}/g, '}')
  .trim();
export const css = minifyCss('style.css');
const pageCss = {};
export const extraCss = (name) => (pageCss[name] ??= minifyCss(`${name}.css`));

// ---- HTML helpers ----
const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ESC[c]);
const isHttp = (href) => /^https?:\/\//.test(href || '');
export const target = (href) => (isHttp(href) ? ' target="_blank" rel="noopener"' : '');

export const icon = (name) =>
  name && icons[name] ? `<svg class="i" viewBox="0 0 24 24" aria-hidden="true">${icons[name]}</svg>` : '';

export const btn = (b) =>
  b ? `<a class="btn btn-${esc(b.style || 'primary')}" href="${esc(b.href)}"${target(b.href)}${b.download ? ' download' : ''}>${icon(b.icon)}${esc(b.label)}</a>` : '';
export const btns = (list = []) => (list.length ? `<div class="btns">${list.map(btn).join('')}</div>` : '');

export const paras = (list = []) => [].concat(list).map((p) => `<p>${esc(p)}</p>`).join('');
export const bullets = (list = []) => (list.length ? `<ul class="list">${list.map((i) => `<li>${icon('check')}${esc(i)}</li>`).join('')}</ul>` : '');

// Reads width/height from JPG/PNG files so images never shift the layout.
const sizes = {};
function imageSize(src) {
  if (!src || isHttp(src)) return null;
  if (src in sizes) return sizes[src];
  let size = null;
  try {
    const b = fs.readFileSync(path.join(ROOT, decodeURI(src)));
    if (b.readUInt32BE(0) === 0x89504e47) size = [b.readUInt32BE(16), b.readUInt32BE(20)];
    else if (b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP') {
      // WebP (the CMS saves uploads as WebP): lossy VP8, lossless VP8L or extended VP8X header
      const kind = b.toString('ascii', 12, 16);
      if (kind === 'VP8X') size = [1 + b.readUIntLE(24, 3), 1 + b.readUIntLE(27, 3)];
      else if (kind === 'VP8L') { const n = b.readUInt32LE(21); size = [1 + (n & 0x3fff), 1 + ((n >> 14) & 0x3fff)]; }
      else if (kind === 'VP8 ') size = [b.readUInt16LE(26) & 0x3fff, b.readUInt16LE(28) & 0x3fff];
    }
    else if (b[0] === 0xff && b[1] === 0xd8) {
      for (let i = 2; i < b.length - 9; ) {
        if (b[i] !== 0xff || b[i + 1] === 0xff) { i++; continue; }
        const m = b[i + 1];
        if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) { size = [b.readUInt16BE(i + 7), b.readUInt16BE(i + 5)]; break; }
        i += 2 + b.readUInt16BE(i + 2);
      }
    }
  } catch {
    console.warn(`  ! Image not found: ${src}`);
  }
  return (sizes[src] = size);
}

// WebP versions are made at build time when the optional "sharp" package is installed (it is on GitHub).
// The site then only ships these small copies, never the original uploads.
let sharp = null;
try { sharp = (await import('sharp')).default; } catch {}
export const hasSharp = !!sharp;
const imageJobs = new Map(); // source path -> widths to generate
const addJob = (src, w) => imageJobs.set(src, new Set([...(imageJobs.get(src) || []), w]));
// File names with spaces or capitals become simple names, e.g. "My Logo.PNG" -> my-logo-400.webp
// A short fingerprint of the file is part of the name, so a changed image always gets a new URL (safe to cache for a long time)
const hashes = {};
const fileHash = (file) => (hashes[file] ??= crypto.createHash('sha1').update(fs.readFileSync(path.join(ROOT, file))).digest('hex').slice(0, 8));
const optPath = (src, w, ext = 'webp') => `/assets/opt/${path.basename(decodeURI(src)).replace(/\.[^.]+$/, '').replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-${w}.${fileHash(decodeURI(src))}.${ext}`;
// Script URL with the same fingerprint, e.g. /assets/js/main.js?v=1a2b3c4d
export const assetUrl = (file) => `/${file}?v=${fileHash(file)}`;
export const url = (src) => encodeURI(decodeURI(src || ''));
const canResize = (src) => sharp && !isHttp(src) && /\.(jpe?g|png|webp)$/i.test(src || '') && imageSize(src);

function webpWidths(src) {
  if (!canResize(src)) return null;
  const w = imageSize(src)[0];
  const widths = [...new Set([200, 400, 600, 800, 1200].filter((x) => x < w).concat(Math.min(w, 1600)))];
  widths.forEach((x) => addJob(src, x));
  return widths;
}

// sizes: how wide the image is shown; the default fits the two-column pages (full width minus the side space on phones)
export function img(image, { eager = false, sizes = '(max-width: 800px) calc(100vw - 2rem), 600px' } = {}) {
  if (!image?.src) return '';
  const s = imageSize(image.src);
  const wh = s ? ` width="${s[0]}" height="${s[1]}"` : '';
  const widths = webpWidths(image.src);
  const src = widths
    ? `${optPath(image.src, widths.find((w) => w >= 800) || widths.at(-1))}" srcset="${widths.map((w) => `${optPath(image.src, w)} ${w}w`).join(', ')}" sizes="${sizes}`
    : url(image.src);
  return `<img src="${src}" alt="${esc(image.alt)}"${wh}${eager ? ' fetchpriority="high"' : ' loading="lazy"'} decoding="async">`;
}

// Small image for the cart, and the largest copy for "open full image" links
export const thumb = (src) => (webpWidths(src) ? optPath(src, Math.min(400, imageSize(src)[0])) : url(src));
export const fullImage = (src) => (webpWidths(src) ? optPath(src, Math.min(1600, imageSize(src)[0])) : url(src));

// 1200px JPG for link previews (Facebook, WhatsApp, Google) and structured data
export function shareImage(src) {
  if (!canResize(src)) return { src: url(src) };
  addJob(src, 'og');
  const [w, h] = imageSize(src);
  const width = Math.min(1200, w);
  return { src: optPath(src, 'og', 'jpg'), width, height: Math.round((h * width) / w) };
}

// Logo: white or see-through space around it is cut off, then a 96px-high copy is used in the header and footer
// (shown 32–44px high, so it stays sharp on phones). The footer is dark, so it gets a copy with black and grey made white.
const LOGO_H = 96;
const logoInput = (src) => sharp(path.join(ROOT, decodeURI(src))).flatten({ background: '#ffffff' }).trim();
let logoSize = null;
if (sharp && header.logo.image && !isHttp(header.logo.image)) {
  try { logoSize = (await logoInput(header.logo.image).toBuffer({ resolveWithObject: true })).info; } catch { console.warn(`  ! Logo not found: ${header.logo.image}`); }
}
// A half-size copy for normal screens, the full one for sharp (2×) screens. The footer logo loads only when scrolled to.
export function logoImg({ dark = false, alt = '' } = {}) {
  const src = header.logo.image;
  if (!src) return '';
  if (!logoSize) return `<img src="${esc(url(src))}" alt="${esc(alt)}" height="32">`;
  const job = dark ? 'logo-dark' : 'logo';
  addJob(src, job);
  const w = Math.round((logoSize.width / logoSize.height) * LOGO_H);
  return `<img src="${optPath(src, `${job}-sm`)}" srcset="${optPath(src, `${job}-sm`)} 1x, ${optPath(src, job)} 2x" alt="${esc(alt)}" width="${Math.round(w / 2)}" height="${LOGO_H / 2}"${dark ? ' loading="lazy"' : ''} decoding="async">`;
}

// Products can have plans ("variants"), each with its own id, prices and stock. Without plans the product itself is the only option.
export const optionsOf = (p) => (p.variants?.length ? p.variants : [{ id: p.id, name: '', prices: p.prices, compareAtPrices: p.compareAtPrices, stock: p.stock }]);
export const stockOf = (p) => optionsOf(p).reduce((n, o) => n + o.stock, 0);
export const lowestPrices = (p) => Object.fromEntries(Object.keys(optionsOf(p)[0].prices).map((c) => [c, Math.min(...optionsOf(p).map((o) => o.prices[c]))]));

// Favicon: a small square PNG made from site.json "favicon" when sharp is available
export function iconLinks() {
  if (!sharp || isHttp(site.favicon)) return `<link rel="icon" href="${esc(url(site.favicon))}">`;
  addJob(site.favicon, 'icon');
  return `<link rel="icon" type="image/png" sizes="48x48" href="${optPath(site.favicon, 48, 'png')}">\n<link rel="apple-touch-icon" href="${optPath(site.favicon, 180, 'png')}">`;
}

export async function buildImages(outDir) {
  for (const [src, widths] of imageJobs) {
    const input = path.join(ROOT, decodeURI(src));
    for (const w of widths) {
      if (w === 'icon') {
        const white = { r: 255, g: 255, b: 255, alpha: 1 };
        const mark = await sharp(input).trim().toBuffer();
        for (const px of [48, 180]) {
          const inner = await sharp(mark).resize(Math.round(px * 0.86), Math.round(px * 0.86), { fit: 'contain', background: white }).toBuffer();
          await sharp({ create: { width: px, height: px, channels: 4, background: white } }).composite([{ input: inner, gravity: 'centre' }]).png().toFile(path.join(outDir, optPath(src, px, 'png')));
        }
      } else if (w === 'logo' || w === 'logo-dark') {
        // Turn the white background into transparency so the logo sits on any background
        const { data, info } = await logoInput(src).resize({ height: LOGO_H }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
        const rgba = Buffer.alloc(info.width * info.height * 4);
        for (let i = 0, j = 0; i < data.length; i += 3, j += 4) {
          const a = 255 - Math.min(data[i], data[i + 1], data[i + 2]);
          for (let k = 0; k < 3; k++) rgba[j + k] = a ? Math.round(255 - ((255 - data[i + k]) * 255) / a) : 0;
          // Dark footer: black and grey parts (the name) become white, coloured parts stay as they are
          if (w === 'logo-dark' && Math.max(rgba[j], rgba[j + 1], rgba[j + 2]) - Math.min(rgba[j], rgba[j + 1], rgba[j + 2]) < 48) rgba.fill(255, j, j + 3);
          rgba[j + 3] = a;
        }
        const logo = sharp(rgba, { raw: { width: info.width, height: info.height, channels: 4 } });
        await logo.clone().webp({ quality: 90, alphaQuality: 100 }).toFile(path.join(outDir, optPath(src, w)));
        await logo.clone().resize({ height: LOGO_H / 2 }).webp({ quality: 90, alphaQuality: 100 }).toFile(path.join(outDir, optPath(src, `${w}-sm`)));
      } else if (w === 'og') {
        await sharp(input).resize({ width: 1200, withoutEnlargement: true }).flatten({ background: '#ffffff' }).jpeg({ quality: 82, mozjpeg: true }).toFile(path.join(outDir, optPath(src, 'og', 'jpg')));
      } else {
        await sharp(input).resize({ width: w, withoutEnlargement: true }).webp({ quality: 78 }).toFile(path.join(outDir, optPath(src, w)));
      }
    }
  }
  return imageJobs.size;
}

export const formatPrice = (n, currency = site.currency) =>
  n == null ? '' : new Intl.NumberFormat(site.locale, { style: 'currency', currency }).format(n);
export const formatDate = (iso) =>
  new Date(iso + 'T00:00:00Z').toLocaleDateString(site.locale, { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
export const whatsapp = (text) => `https://wa.me/${contact.whatsapp}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
export const absUrl = (p) => new URL(p, site.url).href;

// A PayPal app Client ID is about 80 characters (it starts with "A" or "B"). A cut-off ID or the short code of a
// Pay link / no-code button does not work with the cart buttons, so the site then falls back to paying by hand.
export const paypalIdOk = (id) => /^[A-Z][\w-]{60,}$/.test(id || '');

// Drops empty values ("", null, []) from JSON, so empty fields fall back to the automatic ones
export const filled = (o) => {
  if (Array.isArray(o)) return o;
  if (!o || typeof o !== 'object') return o;
  const out = {};
  for (const [k, v] of Object.entries(o)) {
    const f = filled(v);
    if (f === '' || f == null || (Array.isArray(f) && !f.length) || (typeof f === 'object' && !Array.isArray(f) && !Object.keys(f).length)) continue;
    out[k] = f;
  }
  return out;
};
