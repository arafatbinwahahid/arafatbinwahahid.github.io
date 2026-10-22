// The HTML shell every page shares: <head> with SEO tags, header, footer.
import { css, site, header, footer, contact, social, products, payments, page, esc, icon, target, absUrl, iconLinks, thumb, logoImg, optionsOf, shareImage, filled, assetUrl, img } from './helpers.js';

const shop = page('shop');
const payText = page('payments');

// Links to Privacy, Terms and Refund (data/pages/shop.json "policyLinks")
export const policyLinks = () => `<p class="policy">${shop.policyLinks.map((l) => `<a href="${esc(l.href)}">${esc(l.label)}</a>`).join('')}</p>`;

export const currencySelect = () => `<label class="cur">${esc(shop.currencyLabel)} <select data-currency-select>${payments.currencies.map((c) => `<option value="${esc(c.code)}">${esc(c.code)} · ${esc(c.name)}</option>`).join('')}</select></label>`;

// Product data and labels for assets/js/shop.js (prices and stock always come from here, never from the browser)
function catalog() {
  const data = {
    locale: site.locale,
    defaultCurrency: payments.defaultCurrency,
    currencies: payments.currencies.map((c) => c.code),
    products: products.flatMap((p) => optionsOf(p).map((o) => ({ id: o.id, slug: p.slug, title: p.title, option: o.name, prices: o.prices, stock: o.stock, image: thumb(p.images[0]?.src) }))),
    text: { ...shop.cart, maxStock: shop.maxStockMessage, stock: shop.stockLabel, soldOut: shop.soldOutLabel, pay: payText.form, paypal: payText.paypal, done: payText.done, copied: payText.copiedLabel, copy: payText.copyLabel, orderPrefix: payments.orderPrefix || 'AB' },
  };
  return `<script type="application/json" id="catalog">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`;
}

const c = shop.cart;
const cartButton = () => `<button class="cart-btn" type="button" data-cart-open aria-label="${esc(c.openLabel)}">${icon('cart')}<span class="cart-count" data-cart-count hidden>0</span></button>`;
const cartDrawer = () => `<dialog class="drawer" id="cart" aria-labelledby="cart-title">
<div class="drawer-head"><h2 id="cart-title" class="h3">${esc(c.title)}</h2><button class="icon-btn" type="button" data-cart-close aria-label="${esc(c.closeLabel)}">${icon('close')}</button></div>
${currencySelect()}
<ul class="cart-list" data-cart-list></ul>
<p class="muted" data-cart-empty>${esc(c.empty)}</p>
<div class="drawer-foot"><p class="cart-total"><span>${esc(c.totalLabel)}</span><b data-cart-total></b></p>
<a class="btn btn-primary" href="/payments/" data-checkout>${esc(c.checkoutLabel)}</a>
<button class="btn btn-outline" type="button" data-cart-close>${esc(c.continueLabel)}</button>${policyLinks()}</div>
</dialog>`;

const isActive = (href, path) => (href === '/' ? path === '/' : path.startsWith(href));

function siteHeader(path, cart) {
  const { logo, links, button, menu } = header;
  const navLinks = links.map((l) => `<a href="${esc(l.href)}"${isActive(l.href, path) ? ' aria-current="page"' : ''}>${esc(l.label)}</a>`).join('');
  const menuCols = menu.columns
    .map((c) => `<div><p class="menu-title">${esc(c.title)}</p>${c.links.map((l) => `<a href="${esc(l.href)}"${target(l.href)}${path === l.href ? ' aria-current="page"' : ''}>${icon(l.icon)}${esc(l.label)}</a>`).join('')}</div>`)
    .join('');
  return `<header class="hdr"><div class="wrap hdr-in">
<a class="logo" href="${esc(logo.href)}">${logoImg()}${esc(logo.text)}</a>
<nav class="nav" aria-label="Main">${navLinks}</nav>
<div class="hdr-end">${header.search ? `<a class="icon-btn hdr-search" href="${esc(header.search.href)}" aria-label="${esc(header.search.label)}" title="${esc(header.search.label)}"${path === header.search.href ? ' aria-current="page"' : ''}>${icon('search')}</a>` : ''}${cart ? cartButton() : ''}${button ? `<a class="btn btn-${esc(button.style || 'primary')} btn-sm" href="${esc(button.href)}"${target(button.href)} aria-label="${esc(button.label)}">${icon(button.icon)}<span>${esc(button.label)}</span></a>` : ''}
<details class="menu"><summary aria-label="${esc(menu.buttonLabel)}" title="${esc(menu.buttonLabel)}">${icon('dots')}</summary><nav class="menu-panel" aria-label="${esc(menu.buttonLabel)}">${menuCols}</nav></details></div>
</div></header>`;
}

function siteFooter() {
  const cols = footer.columns.map((c) => `<div><p class="f-title">${esc(c.title)}</p>${c.links.map((l) => `<a href="${esc(l.href)}"${target(l.href)}>${esc(l.label)}</a>`).join('')}</div>`).join('');
  const contactCol = `<div><p class="f-title">${esc(footer.contactTitle)}</p>
<a href="https://wa.me/${esc(contact.whatsapp)}" target="_blank" rel="noopener">${icon('wa')}${esc(contact.whatsappDisplay)}</a>
<a href="mailto:${esc(contact.email)}">${icon('mail')}${esc(contact.email)}</a>
<a href="${esc(contact.mapUrl)}" target="_blank" rel="noopener">${icon('pin')}${esc(contact.address)}</a></div>`;
  const socials = footer.showSocial ? `<div class="social">${social.map((s) => `<a href="${esc(s.url)}"${target(s.url)} aria-label="${esc(s.label)}">${icon(s.icon)}</a>`).join('')}</div>` : '';
  // Payment logos (footer.json "paymentIcons"), e.g. a "We accept" image, above the copyright line
  const pay = footer.paymentIcons?.length ? `<div class="wrap ftr-pay">${footer.paymentIcons.filter((p) => p.src).map((p) => img(p, { sizes: '(max-width: 480px) calc(100vw - 2rem), 420px' })).join('')}</div>` : '';
  return `<footer class="ftr"><div class="wrap ftr-grid">
<div><a class="logo" href="/">${logoImg()}${esc(header.logo.text)}</a><p>${esc(footer.about)}</p>${socials}</div>${cols}${contactCol}</div>${pay}
<div class="wrap ftr-bottom"><span>${esc(footer.copyright.replace('{year}', new Date().getFullYear()))}</span><nav aria-label="Legal">${footer.bottomLinks.map((l) => `<a href="${esc(l.href)}">${esc(l.label)}</a>`).join('')}</nav></div></footer>`;
}

// A page is left out of Google and sitemap.xml when the code says so (payments, 404) or its JSON has "robots": { "index": false }
export const isNoindex = (p) => !!(p.noindex || p.seo?.robots?.index === false);

const meta = (attr, key, content) => (content === '' || content == null ? '' : `\n<meta ${attr}="${esc(key)}" content="${esc(content)}">`);

// <meta name="robots">: index/follow plus the optional Google rules from the page's "seo.robots"
function robotsContent(r, noindex) {
  const rules = [noindex ? 'noindex' : 'index', r.follow === false ? 'nofollow' : 'follow'];
  if (noindex) return rules.join(', ');
  for (const k of ['nosnippet', 'noimageindex', 'notranslate', 'indexifembedded']) if (r[k]) rules.push(k);
  if (Number.isInteger(r.maxSnippet)) rules.push(`max-snippet:${r.maxSnippet}`);
  rules.push(`max-image-preview:${r.maxImagePreview || 'large'}`);
  if (Number.isInteger(r.maxVideoPreview)) rules.push(`max-video-preview:${r.maxVideoPreview}`);
  if (r.unavailableAfter) rules.push(`unavailable_after: ${r.unavailableAfter}`);
  return rules.join(', ');
}

// Verification codes from site.json "verification" (a pasted <meta> tag also works), on the home page
const VERIFY = { google: 'google-site-verification', bing: 'msvalidate.01', yandex: 'yandex-verification', pinterest: 'p:domain_verify', facebook: 'facebook-domain-verification', baidu: 'baidu-site-verification' };
const code = (v) => (String(v || '').match(/content="([^"]+)"/)?.[1] || v || '').trim();
const verifyTags = () => Object.entries(VERIFY).map(([k, n]) => meta('name', n, code(site.verification?.[k]))).join('');

export function layout({ path, seo: rawSeo = {}, body, schema = [], crumbs, type = 'website', noindex = false, cart = false, article, product, scripts = [] }) {
  const seo = filled(rawSeo) || {};
  const og = seo.openGraph || {};
  const tw = seo.twitter || {};
  const defaults = site.seo || {};
  noindex = noindex || seo.robots?.index === false;
  // " | Arafat Bin Wahahid" is added unless the title would get longer than Google shows (about 60 characters)
  const withName = `${seo.title}${site.titleSeparator}${site.name}`;
  const title = !seo.title ? site.title : seo.titleSuffix === false || withName.length > 60 ? seo.title : withName;
  const description = seo.description || site.description;
  const canonical = absUrl(seo.canonical || path);
  const share = shareImage(seo.image || site.defaultImage);
  const image = absUrl(share.src);
  const imageAlt = seo.imageAlt || title;
  const ogType = og.type || type;
  const t = site.theme;
  const art = ogType === 'article' ? { ...article, ...seo.article } : null;
  if (crumbs) {
    schema = [...schema, {
      '@context': 'https://schema.org', '@type': 'BreadcrumbList',
      itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.label, item: absUrl(c.href) })),
    }];
  }
  // Extra JSON-LD from the page's "seo.schema": objects, or JSON text from the CMS code editor
  schema = [...schema, ...(seo.schema || []).map((s) => (typeof s === 'string' ? JSON.parse(s) : s))];
  // Google Analytics and Microsoft Clarity load on the first tap, scroll or key press, or 3.5 s after the page has loaded, so they never slow the first paint
  const gaId = esc(site.googleAnalyticsId || '');
  const clarityId = esc(site.clarityId || '');
  const analytics = gaId || clarityId
    ? `<script>${gaId ? `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${gaId}');` : ''}${clarityId ? `window.clarity=window.clarity||function(){(clarity.q=clarity.q||[]).push(arguments)};` : ''}
(function(){var on=0;function add(src){var s=document.createElement('script');s.async=true;s.src=src;document.head.appendChild(s)}
function go(){if(on)return;on=1;${gaId ? `add('https://www.googletagmanager.com/gtag/js?id=${gaId}');` : ''}${clarityId ? `add('https://www.clarity.ms/tag/${clarityId}');` : ''}}
['pointerdown','keydown','scroll','touchstart'].forEach(function(e){addEventListener(e,go,{once:true,passive:true})});addEventListener('load',function(){setTimeout(go,3500)})})();</script>`
    : '';
  const head = [
    `<title>${esc(title)}</title>`,
    meta('name', 'description', description),
    meta('name', 'keywords', seo.keywords?.join(', ')),
    meta('name', 'author', seo.author || defaults.author),
    meta('name', 'robots', robotsContent(seo.robots || {}, noindex)),
    meta('name', 'googlebot', seo.googlebot),
    meta('name', 'bingbot', seo.bingbot),
    noindex ? '' : `\n<link rel="canonical" href="${esc(canonical)}">`,
    ...(seo.alternates || []).map((a) => `\n<link rel="alternate" hreflang="${esc(a.hreflang)}" href="${esc(absUrl(a.href))}">`),
    meta('name', 'theme-color', t.dark),
    path === '/' ? verifyTags() : '',
    `\n${iconLinks()}`,
    meta('property', 'og:type', ogType),
    meta('property', 'og:locale', site.locale.replace('-', '_')),
    ...(og.localeAlternate || []).map((l) => meta('property', 'og:locale:alternate', l)),
    meta('property', 'og:site_name', site.name),
    meta('property', 'og:title', og.title || title),
    meta('property', 'og:description', og.description || description),
    meta('property', 'og:url', canonical),
    meta('property', 'og:image', image),
    meta('property', 'og:image:width', share.width),
    meta('property', 'og:image:height', share.height),
    meta('property', 'og:image:alt', imageAlt),
    meta('property', 'fb:app_id', defaults.facebookAppId),
    ...(art ? [
      meta('property', 'article:published_time', art.publishedTime),
      meta('property', 'article:modified_time', art.modifiedTime || art.publishedTime),
      meta('property', 'article:author', art.author),
      meta('property', 'article:section', art.section),
      ...(art.tags || []).map((tag) => meta('property', 'article:tag', tag)),
    ] : []),
    ...(product ? [meta('property', 'product:price:amount', product.amount), meta('property', 'product:price:currency', product.currency)] : []),
    meta('name', 'twitter:card', tw.card || 'summary_large_image'),
    meta('name', 'twitter:site', defaults.twitterSite),
    meta('name', 'twitter:creator', tw.creator || defaults.twitterCreator),
    meta('name', 'twitter:title', tw.title || og.title || title),
    meta('name', 'twitter:description', tw.description || og.description || description),
    meta('name', 'twitter:image', image),
    meta('name', 'twitter:image:alt', imageAlt),
    ...(seo.meta || []).map((m) => (m.property ? meta('property', m.property, m.content) : meta('name', m.name, m.content))),
  ].join('');
  return `<!DOCTYPE html>
<html lang="${esc(site.language)}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="format-detection" content="telephone=no">
${head.trim()}
<style>:root{--primary:${t.primary};--accent:${t.accent};--dark:${t.dark};--text:${t.text};--muted:${t.muted};--bg:${t.background};--soft:${t.soft};--border:${t.border};--radius:${t.radius}}${css}</style>
${schema.map((s) => `<script type="application/ld+json">${JSON.stringify(s).replace(/</g, '\\u003c')}</script>`).join('\n')}
${analytics}
</head>
<body data-forms-key="${esc(site.web3formsAccessKey)}">
<a class="skip" href="#main">Skip to content</a>
${siteHeader(path, cart)}
<main id="main"${noindex ? '' : ' data-pagefind-body'}>
${body}
</main>
${siteFooter()}
${contact.showFloatingWhatsapp ? `<a class="wa-float" href="https://wa.me/${esc(contact.whatsapp)}" target="_blank" rel="noopener" aria-label="WhatsApp">${icon('wa')}</a>` : ''}
${cart ? cartDrawer() + catalog() : ''}
<script src="${assetUrl('assets/js/main.js')}" defer></script>
<script>if(document.modelContext||navigator.modelContext){var w=document.createElement('script');w.src='/webmcp.js';document.body.appendChild(w)}</script>${scripts.map((s) => `\n<script src="${assetUrl(`assets/js/${s}.js`)}" defer></script>`).join('')}${cart ? `\n<script src="${assetUrl('assets/js/shop.js')}" defer></script>` : ''}
</body>
</html>
`;
}
