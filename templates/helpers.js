// Loads every JSON file in data/ and provides small HTML helpers.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA = path.join(ROOT, 'data');

function read(file) {
  const text = fs.readFileSync(path.join(DATA, file), 'utf8');
  try {
    return JSON.parse(text);
  } catch (e) {
    // Phone keyboards type curly quotes “ ” which JSON does not accept; retry with straight ones
    if (/[“”]/.test(text)) {
      try {
        const data = JSON.parse(text.replace(/[“”]/g, '"'));
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
export const products = read('collections/products.json');
export const services = read('collections/services.json');
export const page = (name) => read(`pages/${name}.json`);
export const posts = fs
  .readdirSync(path.join(DATA, 'collections/blog'))
  .filter((f) => f.endsWith('.json'))
  .map((f) => read(`collections/blog/${f}`))
  .filter((p) => !p.draft)
  .sort((a, b) => b.date.localeCompare(a.date));

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
let sharp = null;
try { sharp = (await import('sharp')).default; } catch {}
export const imageJobs = new Map(); // source path -> widths to generate
const optPath = (src, w, ext = 'webp') => `/assets/opt/${path.basename(src).replace(/\.[^.]+$/, '')}-${w}.${ext}`;

function webpWidths(src, size) {
  if (!sharp || !size || isHttp(src) || !/\.(jpe?g|png)$/i.test(src)) return null;
  const widths = [...new Set([400, 800, 1200].filter((w) => w < size[0]).concat(Math.min(size[0], 1600)))];
  imageJobs.set(src, new Set([...(imageJobs.get(src) || []), ...widths]));
  return widths;
}

export function img(image, { eager = false, sizes = '(max-width: 800px) 100vw, 50vw' } = {}) {
  if (!image?.src) return '';
  const s = imageSize(image.src);
  const wh = s ? ` width="${s[0]}" height="${s[1]}"` : '';
  const tag = `<img src="${esc(image.src)}" alt="${esc(image.alt)}"${wh}${eager ? ' fetchpriority="high"' : ' loading="lazy"'} decoding="async">`;
  const widths = webpWidths(image.src, s);
  if (!widths) return tag;
  return `<picture><source type="image/webp" srcset="${widths.map((w) => `${optPath(image.src, w)} ${w}w`).join(', ')}" sizes="${sizes}">${tag}</picture>`;
}

// Small image for the cart; falls back to the original file without sharp
export const thumb = (src) => (webpWidths(src, imageSize(src)) ? optPath(src, Math.min(400, imageSize(src)[0])) : src);

// Favicon: a small square PNG made from site.json "favicon" when sharp is available
export function iconLinks() {
  if (!sharp || isHttp(site.favicon)) return `<link rel="icon" href="${esc(site.favicon)}">`;
  imageJobs.set(site.favicon, new Set([...(imageJobs.get(site.favicon) || []), 'icon']));
  return `<link rel="icon" type="image/png" sizes="48x48" href="${optPath(site.favicon, 48, 'png')}">\n<link rel="apple-touch-icon" href="${optPath(site.favicon, 180, 'png')}">`;
}

export async function buildImages(outDir) {
  for (const [src, widths] of imageJobs) {
    const input = path.join(ROOT, decodeURI(src));
    for (const w of widths) {
      if (w === 'icon') {
        for (const px of [48, 180]) await sharp(input).resize(px, px, { fit: 'cover' }).png().toFile(path.join(outDir, optPath(src, px, 'png')));
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
