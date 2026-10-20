// Loads every JSON file in data/ and provides small HTML helpers.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA = path.join(ROOT, 'data');

function read(file) {
  try {
    return JSON.parse(fs.readFileSync(path.join(DATA, file), 'utf8'));
  } catch (e) {
    throw new Error(`Problem in data/${file}: ${e.message}`);
  }
}

export const site = read('global/site.json');
export const header = read('global/header.json');
export const footer = read('global/footer.json');
export const contact = read('global/contact.json');
export const social = read('global/social.json');
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
export const isHttp = (href) => /^https?:\/\//.test(href || '');
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

export function img(image, { eager = false } = {}) {
  if (!image?.src) return '';
  const s = imageSize(image.src);
  const wh = s ? ` width="${s[0]}" height="${s[1]}"` : '';
  return `<img src="${esc(image.src)}" alt="${esc(image.alt)}"${wh}${eager ? ' fetchpriority="high"' : ' loading="lazy"'} decoding="async">`;
}

export const formatPrice = (n) =>
  n == null ? '' : new Intl.NumberFormat(site.locale, { style: 'currency', currency: site.currency }).format(n);
export const formatDate = (iso) =>
  new Date(iso + 'T00:00:00Z').toLocaleDateString(site.locale, { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
export const whatsapp = (text) => `https://wa.me/${contact.whatsapp}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
export const absUrl = (p) => new URL(p, site.url).href;
