// The HTML shell every page shares: <head> with SEO tags, header, footer.
import { site, header, footer, contact, social, esc, icon, target, absUrl } from './helpers.js';

const isActive = (href, path) => (href === '/' ? path === '/' : path.startsWith(href));

function siteHeader(path) {
  const { logo, links, button, menu } = header;
  const navLinks = links.map((l) => `<a href="${esc(l.href)}"${isActive(l.href, path) ? ' aria-current="page"' : ''}>${esc(l.label)}</a>`).join('');
  const menuCols = menu.columns
    .map((c) => `<div><p class="menu-title">${esc(c.title)}</p>${c.links.map((l) => `<a href="${esc(l.href)}"${target(l.href)}${path === l.href ? ' aria-current="page"' : ''}>${icon(l.icon)}${esc(l.label)}</a>`).join('')}</div>`)
    .join('');
  return `<header class="hdr"><div class="wrap hdr-in">
<a class="logo" href="${esc(logo.href)}">${logo.image ? `<img src="${esc(logo.image)}" alt="" width="32" height="32">` : ''}${esc(logo.text)}</a>
<nav class="nav" aria-label="Main">${navLinks}</nav>
<div class="hdr-end">${button ? `<a class="btn btn-${esc(button.style || 'primary')} btn-sm" href="${esc(button.href)}"${target(button.href)}>${icon(button.icon)}<span>${esc(button.label)}</span></a>` : ''}
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
  return `<footer class="ftr"><div class="wrap ftr-grid">
<div><a class="logo" href="/">${esc(header.logo.text)}</a><p>${esc(footer.about)}</p>${socials}</div>${cols}${contactCol}</div>
<div class="wrap ftr-bottom"><span>${esc(footer.copyright.replace('{year}', new Date().getFullYear()))}</span><nav aria-label="Legal">${footer.bottomLinks.map((l) => `<a href="${esc(l.href)}">${esc(l.label)}</a>`).join('')}</nav></div></footer>`;
}

export function layout({ path, seo = {}, body, schema = [], crumbs, type = 'website', noindex = false }) {
  const title = seo.title ? `${seo.title}${site.titleSeparator}${site.name}` : site.title;
  const description = seo.description || site.description;
  const canonical = absUrl(path);
  const image = absUrl(seo.image || site.defaultImage);
  const t = site.theme;
  if (crumbs) {
    schema = [...schema, {
      '@context': 'https://schema.org', '@type': 'BreadcrumbList',
      itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.label, item: absUrl(c.href) })),
    }];
  }
  const ga = site.googleAnalyticsId
    ? `<script async src="https://www.googletagmanager.com/gtag/js?id=${esc(site.googleAnalyticsId)}"></script><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${esc(site.googleAnalyticsId)}');</script>`
    : '';
  return `<!doctype html>
<html lang="${esc(site.language)}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta name="robots" content="${noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large'}">
${noindex ? '' : `<link rel="canonical" href="${esc(canonical)}">`}
<meta name="theme-color" content="${esc(t.dark)}">
<link rel="icon" href="${esc(site.favicon)}">
<link rel="sitemap" type="application/xml" href="/sitemap.xml">
<meta property="og:type" content="${type}">
<meta property="og:site_name" content="${esc(site.name)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${esc(canonical)}">
<meta property="og:image" content="${esc(image)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:image" content="${esc(image)}">
<style>:root{--primary:${t.primary};--accent:${t.accent};--dark:${t.dark};--text:${t.text};--muted:${t.muted};--bg:${t.background};--soft:${t.soft};--border:${t.border};--radius:${t.radius}}</style>
<link rel="stylesheet" href="/assets/css/style.css">
${schema.map((s) => `<script type="application/ld+json">${JSON.stringify(s).replace(/</g, '\\u003c')}</script>`).join('\n')}
${ga}
</head>
<body data-forms-key="${esc(site.web3formsAccessKey)}">
<a class="skip" href="#main">Skip to content</a>
${siteHeader(path)}
<main id="main">
${body}
</main>
${siteFooter()}
${contact.showFloatingWhatsapp ? `<a class="wa-float" href="https://wa.me/${esc(contact.whatsapp)}" target="_blank" rel="noopener" aria-label="WhatsApp">${icon('wa')}</a>` : ''}
<script src="/assets/js/main.js" defer></script>
</body>
</html>
`;
}
