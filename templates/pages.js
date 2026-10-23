// Every page of the site. Each function returns { path, seo, body, schema, crumbs }.
import {
  site, header, contact, social, products, services, posts, payments, page, tools, rates,
  esc, icon, btns, paras, bullets, img, fullImage, shareImage, target, formatPrice, formatDate, whatsapp, absUrl, optionsOf, stockOf, lowestPrices, filled, paypalIdOk,
} from './helpers.js';
import { policyLinks, currencySelect } from './layout.js';
import { REPO, DRAFTS_BRANCH } from './cms.js';

const shopText = page('shop');
const servicesText = page('services');
const blogText = page('blog');
const reviewsPage = page('reviews');
const workPage = page('work');

// ---- Small building blocks ----
const home = { label: site.homeLabel, href: '/' };
const crumbsOf = (...items) => [home, ...items];

function pageHero(hero, crumbs) {
  const trail = crumbs
    .map((c, i) => (i === crumbs.length - 1 ? `<span aria-current="page">${esc(c.label)}</span>` : `<a href="${esc(c.href)}">${esc(c.label)}</a>`))
    .join('<span class="sep">/</span>');
  return `<section class="phero"><div class="wrap"><nav class="crumbs" aria-label="Breadcrumb">${trail}</nav><h1>${esc(hero.title)}</h1>${hero.text ? `<p class="lead">${esc(hero.text)}</p>` : ''}</div></section>`;
}

const section = (inner, { title, text, link, background } = {}) =>
  `<section class="sec${background === 'soft' ? ' sec-soft' : ''}"><div class="wrap">${
    title ? `<div class="sec-head"><div><h2>${esc(title)}</h2>${text ? `<p>${esc(text)}</p>` : ''}</div>${link ? `<a class="more" href="${esc(link.href)}">${esc(link.label)}${icon('arrow')}</a>` : ''}</div>` : ''
  }${inner}</div></section>`;

const grid = (items, cols = 3) => `<div class="grid g${cols}">${items.join('')}</div>`;

// Prices: the default currency is written into the HTML, shop.js switches it to the visitor's currency
const DEF = payments.defaultCurrency;
const money = (prices) => `<span data-prices="${esc(JSON.stringify(prices))}">${formatPrice(prices[DEF], DEF)}</span>`;
const hasPlans = (p) => optionsOf(p).length > 1;
const priceOf = (o) => `<b>${money(o.prices)}</b>${o.compareAtPrices ? ` <s>${money(o.compareAtPrices)}</s>` : ''}`;
const priceTag = (p) => (hasPlans(p) ? `<span class="from">${esc(shopText.fromLabel)}</span> <b>${money(lowestPrices(p))}</b>` : priceOf(optionsOf(p)[0]));
const badges = (p) => `${optionsOf(p).some((o) => o.compareAtPrices) ? `<span class="badge">${esc(shopText.saleLabel)}</span>` : ''}${stockOf(p) < 1 ? `<span class="badge badge-out">${esc(shopText.soldOutLabel)}</span>` : ''}`;
const CARD = '(max-width: 640px) calc(100vw - 2rem), 360px';
// Card titles are h3 under a section heading, and h2 on pages where the cards come straight after the h1
const cardTitle = (text, h = 3) => (h === 2 ? `<h2 class="h3">${esc(text)}</h2>` : `<h3>${esc(text)}</h3>`);
const shareUrl = (src) => absUrl(shareImage(src).src);

// Home page card (no cart there)
const productCard = (p) => `<a class="card" href="/shop/${esc(p.slug)}/">
<div class="card-img">${img(p.images[0], { sizes: CARD })}${badges(p)}</div>
<div class="card-body"><p class="kicker">${esc(p.category)}</p><h3>${esc(p.title)}</h3><p>${esc(p.summary)}</p><p class="price">${priceTag(p)}</p></div></a>`;

const addButton = (id, stock, cls = 'btn-sm') => (stock > 0
  ? `<button class="btn btn-primary ${cls}" type="button" data-add="${esc(id)}">${icon('cart')}${esc(shopText.addToCartLabel)}</button>`
  : `<button class="btn btn-outline ${cls}" type="button" disabled>${esc(shopText.soldOutLabel)}</button>`);

// On cards, a product with plans links to its page where the plan is chosen
const cardButton = (p) => (hasPlans(p) && stockOf(p) > 0
  ? `<a class="btn btn-primary btn-sm" href="/shop/${esc(p.slug)}/">${esc(shopText.choosePlanLabel)}</a>`
  : addButton(optionsOf(p)[0].id, stockOf(p)));

// Shop page card with Add to cart
const shopCard = (p, i) => `<article class="card" data-cat="${esc(p.category)}">
<a class="card-link" href="/shop/${esc(p.slug)}/"><div class="card-img">${img(p.images[0], { sizes: CARD, eager: i === 0 })}${badges(p)}</div>
<div class="card-body"><p class="kicker">${esc(p.category)}</p><h3>${esc(p.title)}</h3><p>${esc(p.summary)}</p></div></a>
<div class="card-foot"><p class="price">${priceTag(p)}</p>${cardButton(p)}</div></article>`;

const benefits = () => `<ul class="benefits">${shopText.benefits.map((b) => `<li><span class="ic">${icon(b.icon)}</span><span><b>${esc(b.title)}</b><span>${esc(b.text)}</span></span></li>`).join('')}</ul>`;

// Lowest package price, in the currency of the first package
const serviceFrom = (s) => {
  const cur = Object.keys(s.packages[0].prices)[0];
  return formatPrice(Math.min(...s.packages.map((p) => p.prices[cur]).filter((v) => v != null)), cur);
};
const serviceCard = (s, { h, eager } = {}) => `<a class="card" href="/services/${esc(s.slug)}/">
<div class="card-img">${img(s.images[0], { sizes: '(max-width: 640px) calc(100vw - 2rem), 600px', eager })}</div>
<div class="card-body"><p class="kicker">${esc(s.category)}</p>${cardTitle(s.title, h)}<p>${esc(s.summary)}</p><p class="price"><span class="from">${esc(servicesText.fromLabel)}</span> <b>${serviceFrom(s)}</b></p></div></a>`;

const postCard = (p, { h, eager } = {}) => `<a class="card" href="/blog/${esc(p.slug)}/">
<div class="card-img">${img(p.image, { sizes: CARD, eager })}</div>
<div class="card-body"><p class="kicker">${esc(p.category)} · <time datetime="${esc(p.date)}">${formatDate(p.date)}</time></p>${cardTitle(p.title, h)}<p>${esc(p.excerpt)}</p><span class="more">${esc(blogText.readMoreLabel)}${icon('arrow')}</span></div></a>`;

const stars = (n) => {
  const r = Math.max(0, Math.min(5, Math.round(n || 0)));
  return r ? `<p class="stars"><span aria-hidden="true">${'★'.repeat(r)}${'☆'.repeat(5 - r)}</span><span class="sr">${r} out of 5 stars</span></p>` : '';
};
const reviewCard = (r) => `<figure class="card card-pad review">${stars(r.rating)}<blockquote>“${esc(r.text)}”</blockquote>
<figcaption><b>${esc(r.name)}</b><span>${esc([r.role, r.date].filter(Boolean).join(', '))}</span>
${r.link ? `<a class="more" href="${esc(r.link.href)}"${target(r.link.href)}>${esc(r.link.label)}${icon('arrow')}</a>` : ''}</figcaption></figure>`;

const workCard = (p) => `<article class="card"><div class="card-img card-img-tall">${img(p.image)}</div><div class="card-body"><h3>${esc(p.title)}</h3><p>${esc(p.summary)}</p></div></article>`;

const figure = (image, o) => (image?.src ? `<figure class="fig">${img(image, o)}${image.caption ? `<figcaption>${esc(image.caption)}</figcaption>` : ''}</figure>` : '');

// ---- Home ----
const homeSections = {
  products: (s) => section(grid(products.slice(0, s.limit).map(productCard)), s),
  services: (s) => section(grid(services.slice(0, s.limit).map((x) => serviceCard(x)), 2), s),
  about: (s) => section(`<div class="split"><div>${img(s.image)}</div><div><h2>${esc(s.title)}</h2>${paras(s.text)}${btns(s.buttons)}</div></div>`, { background: s.background }),
  work: (s) => section(grid(workPage.projects.slice(0, s.limit).map(workCard), 2), s),
  reviews: (s) => section(grid(reviewsPage.items.slice(0, s.limit).map(reviewCard)), s),
  blog: (s) => (posts.length ? section(grid(posts.slice(0, s.limit).map((x) => postCard(x))), s) : ''),
  tools: (s) => (tools.length ? section(grid(tools.slice(0, s.limit).map((x) => toolCard(x)), 2), s) : ''),
  cta: (s) => section(`<div class="cta"><h2>${esc(s.title)}</h2><p>${esc(s.text)}</p>${btns(s.buttons)}</div>`, { background: s.background }),
};

function homePage() {
  const d = page('home');
  const h = d.hero;
  const hero = `<section class="hero"><div class="wrap hero-in">
<div><p class="kicker">${esc(h.eyebrow)}</p><h1>${esc(h.title)}</h1><p class="lead">${esc(h.text)}</p>${btns(h.buttons)}</div>
<div class="tiles">${h.tiles.map((t) => `<a class="tile" href="${esc(t.href)}"><span class="ic">${icon(t.icon)}</span><span class="tile-t"><b>${esc(t.title)}</b><span>${esc(t.text)}</span></span><span class="more">${esc(t.label)}${icon('arrow')}</span></a>`).join('')}</div>
</div></section>`;
  const body = hero + d.sections.filter((s) => s.show !== false && homeSections[s.type]).map((s) => homeSections[s.type](s)).join('');
  const person = {
    '@context': 'https://schema.org', '@type': 'Person', name: site.name, url: site.url,
    image: shareUrl(site.defaultImage), jobTitle: site.person.jobTitle, email: `mailto:${contact.email}`, telephone: `+${contact.whatsapp}`,
    worksFor: { '@type': 'Organization', name: site.person.worksFor },
    address: { '@type': 'PostalAddress', addressLocality: site.person.locality, addressRegion: site.person.region, addressCountry: site.person.country },
    sameAs: social.map((s) => s.url).filter((u) => /linkedin|fiverr/.test(u)),
    knowsAbout: site.person.knowsAbout,
  };
  const website = { '@context': 'https://schema.org', '@type': 'WebSite', name: site.name, url: site.url };
  const org = header.logo.image && { '@context': 'https://schema.org', '@type': 'Organization', name: site.name, url: site.url, logo: shareUrl(header.logo.image) };
  return { path: '/', seo: d.seo, body, schema: [person, website, org].filter(Boolean) };
}

// ---- Blocks shared by product and service pages ----
const gallery = (images) => `<div class="gallery">${images.map((im, i) => `<div class="gallery-main" data-slide="${i}"${i ? ' hidden' : ''}>${img(im, { eager: i === 0 })}</div>`).join('')}${images.length > 1
  ? `<div class="thumbs">${images.map((im, i) => `<button class="thumb" type="button" data-thumb="${i}" aria-label="Image ${i + 1}"${i ? '' : ' aria-current="true"'}>${img(im, { sizes: '96px' })}</button>`).join('')}</div>` : ''}</div>`;

const infoSection = (it, S) => section(`<div class="split split-top"><div class="prose-sm"><h2>${esc(S.about)}</h2><p>${esc(it.about)}</p>
<h3>${esc(S.description)}</h3>${paras(it.description)}${it.usage?.length ? `<h3>${esc(it.usageTitle || S.usage)}</h3>${it.usageIntro ? `<p>${esc(it.usageIntro)}</p>` : ''}<ol class="steps-list">${it.usage.map((u) => `<li>${esc(u)}</li>`).join('')}</ol>` : ''}</div>
<div><h2>${esc(S.features)}</h2><ul class="features">${it.features.map((f) => `<li><span class="ic">${icon(f.icon || 'check')}</span><span>${esc(f.text)}</span></li>`).join('')}</ul></div></div>`, { background: 'soft' });

const faqSection = (faq, title) => (faq?.length ? section(`<div class="faq narrow">${faq.map((i) => `<details><summary>${esc(i.q)}</summary><p>${esc(i.a)}</p></details>`).join('')}</div>`, { title }) : '');

// "Get in the product queue" box from data/pages/shop.json
const queueSection = () => { const q = shopText.queue; return section(`<div class="cta"><h2>${esc(q.title)}</h2>${paras(q.lines)}${btns(q.buttons)}</div>`); };

// ---- Shop ----
function shopPage() {
  const cats = [...new Set(products.map((p) => p.category))];
  const filters = cats.length > 1
    ? `<div class="chips" role="group" aria-label="Categories"><button class="chip is-on" type="button" data-filter="all" aria-pressed="true">${esc(shopText.allLabel)}</button>${cats.map((c) => `<button class="chip" type="button" data-filter="${esc(c)}" aria-pressed="false">${esc(c)}</button>`).join('')}</div>`
    : '<div></div>';
  const crumbs = crumbsOf({ label: shopText.hero.title, href: '/shop/' });
  const list = { '@context': 'https://schema.org', '@type': 'ItemList', itemListElement: products.map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: absUrl(`/shop/${p.slug}/`), name: p.title })) };
  return {
    path: '/shop/', seo: shopText.seo, crumbs, schema: [list], cart: true,
    body: pageHero(shopText.hero, crumbs)
      + section(`<h2 class="sr">${esc(shopText.productsTitle)}</h2><div class="toolbar">${filters}${currencySelect()}</div><div class="grid g3" id="products">${products.map(shopCard).join('')}</div>${policyLinks()}`)
      + section(benefits(), { background: 'soft' })
      + queueSection(),
  };
}

function productPage(p) {
  const S = shopText.sections;
  const url = `/shop/${p.slug}/`;
  const crumbs = crumbsOf({ label: shopText.hero.title, href: '/shop/' }, { label: p.title, href: url });
  const opts = optionsOf(p);
  const first = opts.find((o) => o.stock > 0) || opts[0];
  const stockText = (o) => (o.stock > 0 ? shopText.stockLabel.replace('{n}', o.stock) : shopText.soldOutLabel);
  const plans = hasPlans(p) ? `<fieldset class="choice plans"><legend class="h3">${esc(shopText.choosePlanLabel)}</legend><div class="opts opts-col">${opts.map((o) => `<label class="opt"><input type="radio" name="plan-${esc(p.id)}" value="${esc(o.id)}" data-plan="${esc(JSON.stringify(o.prices))}"${o.id === first.id ? ' checked' : ''}${o.stock < 1 ? ' disabled' : ''}><span><b>${esc(o.name)}</b><span class="plan-price">${money(o.prices)}${o.stock < 1 ? ` · ${esc(shopText.soldOutLabel)}` : ''}</span></span></label>`).join('')}</div></fieldset>` : '';
  const qty = stockOf(p) > 0
    ? `<div class="qty-row"><div class="qty"><button type="button" data-step="-1" aria-label="${esc(shopText.cart.decreaseLabel)}">${icon('minus')}</button><input id="qty-${esc(p.id)}" type="number" inputmode="numeric" min="1" max="${first.stock}" value="1" data-qty aria-label="${esc(shopText.quantityLabel)}"><button type="button" data-step="1" aria-label="${esc(shopText.cart.increaseLabel)}">${icon('plus')}</button></div>${addButton(first.id, first.stock, '')}</div><p class="status" role="status" data-buy-status></p>`
    : addButton(first.id, 0, '');
  const buy = `<div class="buy" data-buy="${esc(first.id)}"><p class="kicker">${esc(p.category)}</p><p class="price price-lg" data-main-price>${priceOf(first)}</p>${plans}${currencySelect()}
<p class="stock${first.stock > 0 ? '' : ' stock-out'}" data-stock-text>${esc(stockText(first))}</p>${qty}
${p.externalLink ? btns([{ style: 'outline', icon: 'globe', ...p.externalLink }]) : ''}<p class="muted">${esc(shopText.formatLabel)}: ${esc(p.format)}</p>${policyLinks()}</div>`;
  const reviews = p.reviews?.length ? section(grid(p.reviews.map(reviewCard)), { title: S.reviews, background: 'soft' }) : '';
  const availability = `https://schema.org/${stockOf(p) > 0 ? 'InStock' : 'OutOfStock'}`;
  const offers = payments.currencies.map((c) => (hasPlans(p)
    ? { '@type': 'AggregateOffer', priceCurrency: c.code, lowPrice: Math.min(...opts.map((o) => o.prices[c.code])), highPrice: Math.max(...opts.map((o) => o.prices[c.code])), offerCount: opts.length, url: absUrl(url), availability }
    : { '@type': 'Offer', price: first.prices[c.code], priceCurrency: c.code, url: absUrl(url), availability }));
  const schema = {
    '@context': 'https://schema.org', '@type': 'Product', name: p.title, description: p.seo?.description || p.summary, sku: p.id, category: p.category,
    image: p.images.map((im) => shareUrl(im.src)), brand: { '@type': 'Brand', name: site.name }, offers,
  };
  return {
    path: url, seo: { title: p.title, description: p.summary, image: p.images[0]?.src, ...filled(p.seo) }, crumbs, schema: [schema], cart: true,
    type: 'product', product: { amount: lowestPrices(p)[DEF], currency: DEF },
    body: pageHero({ title: p.title, text: p.summary }, crumbs) + section(`<div class="split split-top">${gallery(p.images)}${buy}</div>`)
      + infoSection(p, S) + section(benefits()) + faqSection(p.faq, S.faq) + reviews,
  };
}

// ---- Payments (checkout) ----
// The first enabled payment method with a working PayPal Client ID (used by the checkout and the service pages)
const paypalMethod = () => payments.currencies.flatMap((c) => c.methods).find((m) => m.enabled !== false && paypalIdOk(m.paypalClientId));
const paypalClientId = () => paypalMethod()?.paypalClientId;
// PayPal fees for paypal.js (payments.json → PayPal → "fees"); nothing when every value is 0
const feeAttrs = (fees, label) => (fees && Object.values(fees).some((v) => v > 0) ? ` data-fees="${esc(JSON.stringify(fees))}" data-fee-label="${esc(label)}"` : '');
const enabledMethods = (c) => c.methods.filter((m) => m.enabled !== false);

function payForm(m, c, f) {
  const field = (label, input) => `<label>${esc(label)}${input}</label>`;
  const who = `${field(f.nameLabel, '<input type="text" name="name" autocomplete="name" required maxlength="100">')}
<div class="row2">${field(f.mobileLabel, '<input name="mobile" type="tel" autocomplete="tel" required maxlength="25">')}${field(f.emailLabel, '<input name="email" type="email" autocomplete="email" required maxlength="120">')}</div>`;
  const tr = m.timeRange || {};
  const extra = m.type === 'appointment'
    ? `<div class="row2">${field(f.dateLabel, '<input name="date" type="date" required data-date>')}${field(f.timeLabel, `<input name="time" type="time" required${tr.start ? ` min="${esc(tr.start)}"` : ''}${tr.end ? ` max="${esc(tr.end)}"` : ''}>`)}</div>
${field(f.messageLabel, '<textarea name="message" rows="3" maxlength="1000"></textarea>')}`
    : `<div class="row2">${field(`${f.amountLabel} (${c.code})`, '<input name="amount" type="number" inputmode="decimal" min="0" step="any" required data-amount>')}${field(f.transactionLabel, '<input type="text" name="transaction" maxlength="100">')}</div>`;
  return `<form class="form" data-clarity-mask="true" data-pay-form data-type="${esc(m.type)}" data-method="${esc(m.name)}" data-currency="${esc(c.code)}">
<input type="checkbox" name="botcheck" class="hp" tabindex="-1" aria-hidden="true">${who}${extra}
<button class="btn btn-primary" type="submit">${icon(m.type === 'appointment' ? 'calendar' : 'mail')}${esc(m.type === 'appointment' ? f.submitAppointment : f.submitPayment)}</button><p class="status" role="status"></p></form>`;
}

function methodPanel(m, c, d) {
  const rows = (m.details || []).filter((r) => r.value);
  const missing = (m.details || []).some((r) => !r.value) || (m.type === 'appointment' && !m.location?.mapQuery);
  const details = rows.length ? `<dl class="pay-details">${rows.map((r) => `<div><dt>${esc(r.label)}</dt><dd><span>${esc(r.value)}</span><button class="copy" type="button" data-copy="${esc(r.value)}">${icon('copy')}<span>${esc(d.copyLabel)}</span></button></dd></div>`).join('')}</dl>` : '';
  const loc = m.location || {};
  const place = m.type === 'appointment' && loc.mapQuery
    ? `<h4>${esc(d.locationTitle)}</h4><p>${esc(loc.address || loc.name)}</p><div class="map"><iframe title="${esc(d.locationTitle)}: ${esc(loc.name)}" src="https://www.google.com/maps?q=${encodeURIComponent(loc.mapQuery)}&amp;output=embed" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe></div>
<p><a class="more" href="https://www.google.com/maps?q=${encodeURIComponent(loc.mapQuery)}" target="_blank" rel="noopener">${esc(d.openMapLabel)}${icon('arrow')}</a></p>` : '';
  const hours = m.hours?.length ? `<h4>${esc(d.hoursTitle)}</h4><dl class="pay-details">${m.hours.map((h) => `<div><dt>${esc(h.days)}</dt><dd>${esc(h.time)}</dd></div>`).join('')}</dl>` : '';
  const head = `<section class="card card-pad method-panel" data-panel="${esc(m.id)}" hidden aria-labelledby="h-${esc(m.id)}">
<h2 class="h3" id="h-${esc(m.id)}">${esc(d.payTitle)}: ${icon(m.icon)} ${esc(m.name)} (${esc(c.code)})</h2><p>${esc(m.intro)}</p>`;
  // With a PayPal Client ID the buttons do everything (payer name and email come from PayPal), so no form or manual steps
  if (paypalIdOk(m.paypalClientId)) {
    return `${head}
<div class="paypal-box" data-method="${esc(m.name)}" data-type="transfer"${feeAttrs(m.fees, d.paypal.feeLabel)}><h4>${esc(d.paypal.title)}</h4><p class="muted">${esc(d.paypal.note)}</p>
<div data-paypal="${esc(m.paypalClientId)}" data-currency="${esc(c.code)}"></div>
<p class="notice" data-paypal-fallback hidden>${esc(d.paypal.fallback)} <a href="${whatsapp()}" target="_blank" rel="noopener">WhatsApp</a></p><p class="status" role="status"></p></div></section>`;
  }
  return `${head}
${details ? `<h4>${esc(d.detailsTitle)}</h4>${details}` : ''}${m.link?.href ? btns([{ label: m.link.label, href: m.link.href, icon: 'card' }]) : ''}
${m.poster?.src ? `<figure class="poster">${img(m.poster)}</figure>` : ''}${place}${hours}
${missing ? `<p class="notice">${esc(d.missingDetails)} <a href="${whatsapp()}" target="_blank" rel="noopener">WhatsApp</a></p>` : ''}
${m.steps?.length ? `<h4>${esc(d.stepsTitle)}</h4><ol class="steps-list">${m.steps.map((st) => `<li>${esc(st)}</li>`).join('')}</ol>` : ''}
${payForm(m, c, d.form)}<p class="note">${esc(d.verifyNote)}</p></section>`;
}

function paymentsPage() {
  const d = page('payments');
  const crumbs = crumbsOf({ label: shopText.hero.title, href: '/shop/' }, { label: d.hero.title, href: '/payments/' });
  const opt = (name, value, label) => `<label class="opt"><input type="radio" name="${esc(name)}" value="${esc(value)}"><span>${label}</span></label>`;
  const curs = payments.currencies;
  const choose = `<fieldset class="choice"><legend class="h3">${esc(d.currencyTitle)}</legend><div class="opts">${curs.map((c) => opt('currency', c.code, `<b>${esc(c.code)}</b> ${esc(c.name)}`)).join('')}</div></fieldset>
${curs.map((c) => `<fieldset class="choice" data-methods="${esc(c.code)}" hidden><legend class="h3">${esc(d.methodTitle)}</legend><div class="opts">${enabledMethods(c).map((m) => opt(`method-${c.code}`, m.id, `${icon(m.icon)}<b>${esc(m.name)}</b>`)).join('')}</div></fieldset>`).join('')}
${curs.flatMap((c) => enabledMethods(c).map((m) => methodPanel(m, c, d))).join('')}`;
  const summary = `<aside class="card card-pad pay-summary" aria-labelledby="sum-title"><h2 class="h3" id="sum-title">${esc(d.summaryTitle)}</h2>
<p>${esc(d.orderIdLabel)}: <b data-order-id></b></p><p class="notice" data-stock-notice hidden>${esc(d.stockNotice)}</p><p class="notice" data-no-methods hidden>${esc(d.noMethods)} <a href="${whatsapp()}" target="_blank" rel="noopener">WhatsApp</a></p>
<ul class="sum-list" data-summary></ul><p class="fee-line" data-fee-line hidden><span>${esc(d.paypal.feeLabel)}</span><b data-fee></b></p><p class="cart-total"><span>${esc(shopText.cart.totalLabel)}</span><b data-cart-total></b></p>
<button class="more" type="button" data-cart-open>${esc(d.editCartLabel)}</button>${policyLinks()}</aside>`;
  const e = d.empty;
  return {
    path: '/payments/', seo: d.seo, crumbs, noindex: true, cart: true, scripts: payments.currencies.some((c) => c.methods.some((m) => paypalIdOk(m.paypalClientId))) ? ['paypal'] : [],
    // .pay-area keeps the footer below the screen while the script decides what to show, so nothing jumps
    body: pageHero(d.hero, crumbs) + section(`<div class="pay-area"><noscript><p class="notice">${esc(d.noscript)}</p></noscript>
<div class="card card-pad narrow center" data-pay-empty hidden><h2 class="h3">${esc(e.title)}</h2><p>${esc(e.text)}</p>${btns([e.button])}</div>
<div class="card card-pad narrow center" data-pay-done hidden><h2 class="h3">${esc(d.done.title)}</h2><p data-done-text></p><p hidden><a class="btn btn-primary" data-track-link href="/track/">${icon('search')}${esc(trackText.linkLabel)}</a></p>${btns([d.done.button])}</div>
<div class="pay" data-pay-main>${summary}<div class="pay-steps">${choose}</div></div></div>`),
  };
}

// ---- Services ----
function servicesPage() {
  const crumbs = crumbsOf({ label: servicesText.hero.title, href: '/services/' });
  const pr = servicesText.process;
  return {
    path: '/services/', seo: servicesText.seo, crumbs,
    body: pageHero(servicesText.hero, crumbs) + section(grid(services.map((s, i) => serviceCard(s, { h: 2, eager: i === 0 })), 2))
      + (pr ? section(`<ol class="steps">${pr.steps.map((st, i) => `<li class="card card-pad"><span class="num">${i + 1}</span><h3>${esc(st.title)}</h3><p>${esc(st.text)}</p></li>`).join('')}</ol>`, { title: pr.title, background: 'soft' }) : '')
      + queueSection(),
  };
}

function servicePage(s) {
  const T = servicesText;
  const url = `/services/${s.slug}/`;
  const crumbs = crumbsOf({ label: T.hero.title, href: '/services/' }, { label: s.title, href: url });
  const price = (pk) => { const [cur, v] = Object.entries(pk.prices)[0]; return formatPrice(v, cur); };
  const order = (pk) => whatsapp(T.orderMessage.replace('{service}', s.title).replace('{package}', pk.name).replace('{price}', price(pk)));
  // A package with a USD price also gets PayPal / card buttons (Client ID from payments.json), next to Order on WhatsApp
  const P = T.paypal;
  // "Payment methods turned off" on the service can switch PayPal off for it
  const payId = s.paymentsOff?.includes(paypalMethod()?.id) ? '' : paypalClientId();
  const payBox = (pk) => (payId && pk.prices.USD ? `<div class="pk-btns"><a class="btn btn-primary btn-sm" href="${esc(order(pk))}" target="_blank" rel="noopener">${icon('wa')}${esc(T.orderLabel)}</a>
<button class="btn btn-outline btn-sm" type="button" data-pay-open aria-expanded="false">${icon('card')}${esc(P.payLabel.replace('{price}', formatPrice(pk.prices.USD, 'USD')))}</button></div>
<div class="paypal-box" hidden${feeAttrs(paypalMethod()?.fees, P.feeLabel)} data-package="${esc(pk.name)}" data-sku="${esc(`${s.slug}-${s.packages.indexOf(pk) + 1}`)}" data-price="${pk.prices.USD}"><p class="muted">${esc(P.note)}</p>
<div data-paypal="${esc(payId)}" data-currency="USD"></div><p class="notice" data-paypal-fallback hidden>${esc(P.fallback)}</p><p class="status" role="status"></p></div>`
    : `<a class="btn btn-primary btn-sm" href="${esc(order(pk))}" target="_blank" rel="noopener">${icon('wa')}${esc(T.orderLabel)}</a>`);
  const payText = payId ? ` data-service="${esc(s.title)}" data-order-prefix="${esc(payments.orderPrefix || 'AB')}" data-wa="${esc(contact.whatsapp)}" data-tracklabel="${esc(trackText.linkLabel)}"${['payLabelFee', 'doneTitle', 'doneText', 'doneWhatsapp', 'error', 'sendError'].map((k) => ` data-${k.toLowerCase()}="${esc(P[k])}"`).join('')}` : '';
  const packages = `<h2 class="h3">${esc(s.packagesTitle)}</h2><ul class="packages"${payText}>${s.packages.map((pk) => `<li><div><b>${esc(pk.name)}</b><span class="muted">${esc(s.priceLabel)} <b class="plan-price">${price(pk)}</b></span></div>
${payBox(pk)}</li>`).join('')}</ul>`;
  const box = `<div class="buy"><p class="kicker">${esc(s.category)}</p><p class="price price-lg"><span class="from">${esc(T.fromLabel)}</span> <b>${serviceFrom(s)}</b></p>${packages}${btns(s.buttons)}${policyLinks()}</div>`;
  const schema = {
    '@context': 'https://schema.org', '@type': 'Service', name: s.title, serviceType: s.category, description: s.seo?.description || s.summary,
    image: s.images.map((im) => shareUrl(im.src)), provider: { '@type': 'Person', name: site.name, url: site.url }, areaServed: 'Worldwide',
    offers: s.packages.map((pk) => { const [cur, v] = Object.entries(pk.prices)[0]; return { '@type': 'Offer', name: pk.name, price: v, priceCurrency: cur, url: absUrl(url) }; }),
  };
  return {
    path: url, seo: { title: s.title, description: s.summary, image: s.images[0]?.src, ...filled(s.seo) }, crumbs, schema: [schema],
    scripts: payId && s.packages.some((pk) => pk.prices.USD) ? ['paypal', 'service-pay'] : [],
    body: pageHero({ title: s.title, text: s.summary }, crumbs) + section(`<div class="split split-top">${gallery(s.images)}${box}</div>`)
      + infoSection(s, T.sections) + faqSection(s.faq, T.sections.faq) + queueSection(),
  };
}

// ---- About, Experience, Skills, Work, Credentials ----
function aboutPage() {
  const d = page('about');
  const crumbs = crumbsOf({ label: d.hero.title, href: '/about/' });
  return {
    path: '/about/', seo: d.seo, crumbs,
    body: pageHero(d.hero, crumbs) + section(`<div class="split split-top"><div>${img(d.image, { eager: true })}</div><div>${paras(d.paragraphs)}
<h2 class="h3">${esc(d.factsTitle)}</h2><dl class="facts">${d.facts.map((f) => `<dt>${esc(f.label)}</dt><dd>${esc(f.value)}</dd>`).join('')}</dl>${btns(d.buttons)}</div></div>`),
  };
}

function experiencePage() {
  const d = page('experience');
  const crumbs = crumbsOf({ label: d.hero.title, href: '/experience/' });
  // The first photo is the biggest thing on the screen, so it loads first (not lazily)
  const firstPhoto = d.roles.findIndex((r) => r.image?.src);
  const roles = d.roles.map((r, i) => `<article class="role"><div class="role-head"><h2 class="h3">${esc(r.title)}${r.current ? ` <span class="badge badge-inline">${esc(d.currentLabel)}</span>` : ''}</h2>
<p class="muted">${esc(r.company)}</p><p class="meta"><span>${icon('clock')}${esc(r.period)}</span><span>${esc(r.type)}</span></p></div>${bullets(r.points)}${figure(r.image, { eager: i === firstPhoto })}</article>`).join('');
  return { path: '/experience/', seo: d.seo, crumbs, body: pageHero(d.hero, crumbs) + section(`<div class="timeline">${roles}</div>`) };
}

function skillsPage() {
  const d = page('skills');
  const crumbs = crumbsOf({ label: d.hero.title, href: '/skills/' });
  const groups = d.groups.map((g) => `<div class="card card-pad"><span class="ic">${icon(g.icon)}</span><h2 class="h3">${esc(g.title)}</h2><div class="tags">${g.items.map((i) => `<span>${esc(i)}</span>`).join('')}</div></div>`);
  groups.push(`<div class="card card-pad"><span class="ic">${icon('globe')}</span><h2 class="h3">${esc(d.languagesTitle)}</h2><div class="tags">${d.languages.map((l) => `<span>${esc(l.name)} · ${esc(l.level)}</span>`).join('')}</div></div>`);
  return {
    path: '/skills/', seo: d.seo, crumbs,
    body: pageHero(d.hero, crumbs) + section(grid(groups, 2)),
  };
}

function workPageFn() {
  const d = workPage;
  const crumbs = crumbsOf({ label: d.hero.title, href: '/work/' });
  const items = d.projects.map((p, i) => `<article class="split split-top project">${'<div>' + img(p.image, { eager: i === 0 }) + '</div>'}<div><h2>${esc(p.title)}</h2><p>${esc(p.summary)}</p>${bullets(p.points)}${btns(p.buttons)}</div></article>`).join('');
  return { path: '/work/', seo: d.seo, crumbs, body: pageHero(d.hero, crumbs) + section(items) };
}

function credentialsPage() {
  const d = page('credentials');
  const crumbs = crumbsOf({ label: d.hero.title, href: '/credentials/' });
  const certs = d.certificates.map((c, i) => `<a class="card" href="${fullImage(c.image.src)}" target="_blank" rel="noopener"><div class="card-img card-img-fit">${img(c.image, { sizes: '(max-width: 640px) calc(100vw - 2rem), 280px', eager: i === 0 })}</div><div class="card-body"><h3>${esc(c.title)}</h3><p>${esc(c.detail)}</p></div></a>`);
  const edu = d.education.map((e) => `<div class="card card-pad"><span class="ic">${icon('award')}</span><h3>${esc(e.title)}</h3><p>${esc(e.detail)}</p></div>`);
  return {
    path: '/credentials/', seo: d.seo, crumbs,
    body: pageHero(d.hero, crumbs) + section(grid(certs, 4), { title: d.certificatesTitle }) + section(grid(edu, 2), { title: d.educationTitle, background: 'soft' }),
  };
}

// ---- Reviews & Contact (with forms) ----
function reviewsPageFn() {
  const d = reviewsPage;
  const f = d.form;
  const crumbs = crumbsOf({ label: d.hero.title, href: '/reviews/' });
  const fiverr = d.fiverr ? `<div class="card card-pad card-accent"><span class="ic">${icon('star')}</span><h2 class="h3">${esc(d.fiverr.title)}</h2><p>${esc(d.fiverr.text)}</p>${btns([d.fiverr.button])}</div>` : '';
  const form = f.show ? section(`<div class="narrow card card-pad"><h2 class="h3">${esc(f.title)}</h2><p>${esc(f.text)}</p>
<form class="form" data-clarity-mask="true" data-form="review" data-success="${esc(f.success)}" data-rating-error="${esc(f.ratingError)}" data-error="${esc(page('contact').form.error)}">
<input type="checkbox" name="botcheck" class="hp" tabindex="-1" aria-hidden="true">
<div class="row2"><label>${esc(f.nameLabel)}<input type="text" name="name" autocomplete="name" required></label><label>${esc(f.emailLabel)}<input name="email" type="email" autocomplete="email"></label></div>
<fieldset class="rating"><legend>${esc(f.ratingLabel)}</legend>${[5, 4, 3, 2, 1].map((n) => `<input type="radio" id="r${n}" name="rating" value="${n}"><label for="r${n}" title="${n}">★<span class="sr">${n} stars</span></label>`).join('')}</fieldset>
<label>${esc(f.messageLabel)}<textarea name="message" rows="5" required></textarea></label>
<label class="check"><input type="checkbox" name="allow_public" value="Yes">${esc(f.allowLabel)}</label>
<button class="btn btn-primary" type="submit">${esc(f.submitLabel)}</button><p class="status" role="status"></p><p class="note">${esc(f.note)}</p></form></div>`, { background: 'soft' }) : '';
  return { path: '/reviews/', seo: d.seo, crumbs, body: pageHero(d.hero, crumbs) + section(grid([...d.items.map(reviewCard), fiverr])) + form };
}

function contactPage() {
  const d = page('contact');
  const f = d.form;
  const L = d.labels;
  const crumbs = crumbsOf({ label: d.hero.title, href: '/contact/' });
  const row = (ic, label, value, href) => `<li><a href="${esc(href)}"${target(href)}><span class="ic">${icon(ic)}</span><span><small>${esc(label)}</small><b>${esc(value)}</b></span></a></li>`;
  const items = [
    row('wa', L.whatsapp, contact.whatsappDisplay, whatsapp()),
    ...contact.phones.map((p) => row('phone', p.label, p.display.replace(/ /g, '\u00a0'), `tel:${p.number}`)),
    row('mail', L.email, contact.email, `mailto:${contact.email}`),
    ...social.filter((s) => !/wa\.me|mailto:/.test(s.url)).map((s) => row(s.icon, s.label, s.display, s.url)),
    row('pin', L.address, contact.address, contact.mapUrl),
    d.cv.show ? row('download', L.cv, d.cv.label, d.cv.href) : '',
  ].join('');
  const form = `<div class="card card-pad"><h2 class="h3">${esc(f.title)}</h2><p>${esc(f.text)}</p>
<form class="form" data-clarity-mask="true" data-form="contact" data-success="${esc(f.success)}" data-error="${esc(f.error)}">
<input type="checkbox" name="botcheck" class="hp" tabindex="-1" aria-hidden="true">
<label>${esc(f.nameLabel)}<input type="text" name="name" autocomplete="name" required></label>
<label>${esc(f.emailLabel)}<input name="email" type="email" autocomplete="email" required></label>
<label>${esc(f.messageLabel)}<textarea name="message" rows="6" required></textarea></label>
<div class="btns"><button class="btn btn-primary" type="submit">${icon('mail')}${esc(f.submitLabel)}</button><button class="btn btn-outline" type="button" data-wa="${esc(contact.whatsapp)}">${icon('wa')}${esc(f.whatsappLabel)}</button></div>
<p class="status" role="status"></p><p class="note">${esc(f.note)}</p></form></div>`;
  const schema = { '@context': 'https://schema.org', '@type': 'ContactPage', name: d.seo.title, url: absUrl('/contact/') };
  return {
    path: '/contact/', seo: d.seo, crumbs, schema: [schema],
    body: pageHero(d.hero, crumbs) + section(`<div class="split split-top"><div><h2 class="h3">${esc(d.detailsTitle)}</h2><ul class="contact-list">${items}</ul><p class="muted">${icon('clock')} ${esc(L.hours)}: ${esc(contact.hours)}</p></div>${form}</div>`),
  };
}

// ---- Blog ----
function blogPage() {
  const crumbs = crumbsOf({ label: blogText.hero.title, href: '/blog/' });
  return { path: '/blog/', seo: blogText.seo, crumbs, body: pageHero(blogText.hero, crumbs) + section(grid(posts.map((p, i) => postCard(p, { h: 2, eager: i === 0 })))) };
}

const blocks = {
  p: (b) => `<p>${esc(b.text)}</p>`,
  h2: (b) => `<h2>${esc(b.text)}</h2>`,
  h3: (b) => `<h3>${esc(b.text)}</h3>`,
  quote: (b) => `<blockquote>${esc(b.text)}</blockquote>`,
  list: (b) => `<${b.ordered ? 'ol' : 'ul'}>${b.items.map((i) => `<li>${esc(i)}</li>`).join('')}</${b.ordered ? 'ol' : 'ul'}>`,
  image: (b) => figure(b),
};

function postPage(p) {
  const crumbs = crumbsOf({ label: blogText.hero.title, href: '/blog/' }, { label: p.title, href: `/blog/${p.slug}/` });
  const schema = {
    '@context': 'https://schema.org', '@type': 'BlogPosting', headline: p.title, description: p.excerpt, datePublished: p.date, dateModified: p.seo?.article?.modifiedTime || p.date,
    author: { '@type': 'Person', name: p.author, url: site.url }, mainEntityOfPage: absUrl(`/blog/${p.slug}/`), ...(p.image && { image: shareUrl(p.image.src) }),
  };
  const body = pageHero({ title: p.title, text: `${blogText.byLabel} ${p.author} · ${formatDate(p.date)}` }, crumbs)
    + section(`<article class="prose">${p.image ? img(p.image, { eager: true }) : ''}${p.content.map((b) => (blocks[b.type] || blocks.p)(b)).join('')}
<div class="tags">${(p.tags || []).map((t) => `<span>${esc(t)}</span>`).join('')}</div><p><a class="more" href="/blog/">← ${esc(blogText.backLabel)}</a></p></article>`);
  const seo = { title: p.title, description: p.excerpt, image: p.image?.src, ...filled(p.seo) };
  const article = { publishedTime: p.date, author: p.author, section: p.category, tags: p.tags };
  return { path: `/blog/${p.slug}/`, seo, crumbs, schema: [schema], type: 'article', article, body };
}

// ---- Free tools: /tools/, one page per tool, and a page per currency pair (data/collections/tools.json) ----
const toolsText = page('tools');
const rateOf = Object.fromEntries(rates.currencies.map((c) => [c.code, c]));
// rates.json holds units per 1 USD, so any pair goes through USD
const convert = (n, from, to) => (n / rateOf[from].rate) * rateOf[to].rate;
const fmtCur = (n, code) => {
  const c = rateOf[code] || {};
  const d = c.decimals ?? 2;
  return new Intl.NumberFormat(c.lakh ? 'en-IN' : 'en-US', { style: 'currency', currency: code, minimumFractionDigits: d, maximumFractionDigits: d }).format(n);
};
const fmtRate = (n) => new Intl.NumberFormat('en-US', { maximumFractionDigits: n < 1 ? 6 : 4 }).format(n);
const fillT = (text, v) => String(text || '').replace(/\{(\w+)\}/g, (_, k) => v[k] ?? '');
const toolUrl = (t) => `/tools/${t.slug}/`;
// The converter's starting pair is the main page itself, so it gets no second page with the same content
const isStartPair = (t, p) => p.from === t.converter.from && p.to === t.converter.to;
const pairUrl = (t, p) => (isStartPair(t, p) ? toolUrl(t) : `${toolUrl(t)}${p.from.toLowerCase()}-to-${p.to.toLowerCase()}/`);
const toolData = (data) => `<script type="application/json" id="tool-data">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`;

const toolCard = (t, { h } = {}) => `<a class="card card-pad tool-card" href="${toolUrl(t)}"><span class="ic">${icon(t.icon)}</span>
<p class="kicker">${esc(t.category)} · ${esc(toolsText.freeLabel)}</p>${cardTitle(t.title, h)}<p>${esc(t.summary)}</p><span class="more">${esc(toolsText.openLabel)}${icon('arrow')}</span></a>`;

function toolsPage() {
  const crumbs = crumbsOf({ label: toolsText.hero.title, href: '/tools/' });
  const list = { '@context': 'https://schema.org', '@type': 'ItemList', itemListElement: tools.map((t, i) => ({ '@type': 'ListItem', position: i + 1, url: absUrl(toolUrl(t)), name: t.title })) };
  return { path: '/tools/', seo: toolsText.seo, crumbs, schema: [list], body: pageHero(toolsText.hero, crumbs) + section(grid(tools.map((t) => toolCard(t, { h: 2 })), 2)) };
}

// Website cost calculator: packages and their prices come from the linked service, extras from tools.json
function calculatorWidget(t) {
  const K = t.calculator;
  const L = K.labels;
  const svc = services.find((s) => s.slug === K.service);
  const cur = K.currency;
  const pkgs = svc.packages.map((pk) => ({ name: pk.name, price: pk.prices[cur] }));
  const extras = K.extras.map((x) => `<label class="extra"><span><b>${esc(x.name)}</b><small>${fmtCur(x.price, cur)}${x.unit ? ` ${esc(fillT(L.perLabel, { unit: x.unit }))}` : ''}</small></span>${x.unit
    ? `<input type="number" inputmode="numeric" min="0" max="${x.max || 99}" value="0" data-extra="${esc(x.id)}" aria-label="${esc(x.name)}">`
    : `<input type="checkbox" data-extra="${esc(x.id)}">`}</label>`).join('');
  const curOpts = rates.currencies.map((c) => `<option value="${esc(c.code)}"${c.code === cur ? ' selected' : ''}>${esc(c.code)} · ${esc(c.name)}</option>`).join('');
  return `<div class="card card-pad calc" data-calc>
<fieldset class="choice"><legend class="h3">${esc(L.packageTitle)}</legend><div class="opts opts-col">${pkgs.map((pk, i) => `<label class="opt"><input type="radio" name="pkg" value="${i}"${i ? '' : ' checked'}><span><b>${esc(pk.name)}</b><span class="plan-price">${fmtCur(pk.price, cur)}</span></span></label>`).join('')}</div></fieldset>
<fieldset class="choice"><legend class="h3">${esc(L.extrasTitle)}</legend><div class="extras">${extras}</div></fieldset>
<label class="cur"><span>${esc(L.currencyLabel)}</span> <select data-calc-currency>${curOpts}</select></label>
<ul class="sum-list" data-calc-lines></ul><p class="cart-total" role="status"><span>${esc(L.totalLabel)}</span><b data-calc-total>${fmtCur(pkgs[0].price, cur)}</b></p>
<div class="btns"><a class="btn btn-primary" href="${esc(whatsapp())}" target="_blank" rel="noopener" data-calc-wa>${icon('wa')}${esc(L.whatsappLabel)}</a></div>
<p class="note">${esc(fillT(L.note, { currency: cur, date: formatDate(rates.updated) }))}</p>
${toolData({ base: cur, packages: pkgs, extras: K.extras, rates: rates.currencies, labels: L, whatsapp: contact.whatsapp })}</div>`;
}

// Currency converter: the default (or the pair page's) result and tables are written into the HTML, the script updates them
function converterWidget(t, pair) {
  const C = t.converter;
  const L = C.labels;
  const from = pair?.from || C.from;
  const to = pair?.to || C.to;
  const a = C.amount;
  const opts = (sel) => rates.currencies.map((c) => `<option value="${esc(c.code)}"${c.code === sel ? ' selected' : ''}>${esc(c.code)} · ${esc(c.name)}</option>`).join('');
  const all = rates.currencies.filter((c) => c.code !== from).map((c) => `<li><span>${esc(c.name)}</span><b>${fmtCur(convert(a, from, c.code), c.code)}</b></li>`).join('');
  const r = convert(1, from, to);
  return `<div class="card card-pad conv" data-conv>
<div class="conv-grid"><label class="conv-amount">${esc(L.amountLabel)}<input type="number" inputmode="decimal" min="0" step="any" value="${a}" data-conv-amount></label>
<label>${esc(L.fromLabel)}<select data-conv-from>${opts(from)}</select></label>
<button class="icon-btn conv-swap" type="button" data-conv-swap aria-label="${esc(L.swapLabel)}" title="${esc(L.swapLabel)}">${icon('swap')}</button>
<label>${esc(L.toLabel)}<select data-conv-to>${opts(to)}</select></label></div>
<p class="conv-result" role="status"><span data-conv-in>${fmtCur(a, from)} =</span> <b data-conv-out>${fmtCur(convert(a, from, to), to)}</b></p>
<p class="muted" data-conv-rate>1 ${esc(from)} = ${fmtRate(r)} ${esc(to)} · 1 ${esc(to)} = ${fmtRate(1 / r)} ${esc(from)}</p>
<p class="conv-words" data-conv-words-row hidden><small>${esc(L.wordsLabel)}:</small> <span data-conv-words></span></p>
<details class="conv-own"><summary>${esc(L.ownRateTitle)}</summary><label class="conv-own-row"><span data-conv-own-from>1 ${esc(from)} =</span><input type="number" inputmode="decimal" min="0" step="any" data-conv-own><span data-conv-own-to>${esc(to)}</span></label><p class="muted">${esc(L.ownRateHint)}</p></details>
<label class="check"><input type="checkbox" data-conv-bn>${esc(L.banglaLabel)}</label>
<h2 class="h3">${esc(L.allTitle)}</h2><ul class="sum-list conv-all" data-conv-all>${all}</ul>
<p class="note">${esc(L.updatedLabel)}: <time datetime="${esc(rates.updated)}">${formatDate(rates.updated)}</time>. ${esc(rates.note)}</p>
${toolData({ rates: rates.currencies, labels: L })}</div>`;
}

const rateTable = (C, a, b) => `<div><h2 class="h3">${esc(fillT(C.labels.tableTitle, { from: a, to: b, fromName: rateOf[a].name, toName: rateOf[b].name }))}</h2><table class="conv-table"><thead><tr><th scope="col">${esc(a)}</th><th scope="col">${esc(b)}</th></tr></thead><tbody>${C.amounts.map((n) => `<tr><td>${fmtCur(n, a)}</td><td>${fmtCur(convert(n, a, b), b)}</td></tr>`).join('')}</tbody></table></div>`;

function toolPage(t, pair) {
  const base = toolUrl(t);
  const L = t.converter?.labels || {};
  const pv = pair && { from: pair.from, to: pair.to, fromName: rateOf[pair.from].name, toName: rateOf[pair.to].name };
  const url = pair ? pairUrl(t, pair) : base;
  const title = pair ? fillT(L.pairTitle, pv) : t.title;
  const summary = pair ? fillT(L.pairText, pv) : t.summary;
  const crumbs = crumbsOf({ label: toolsText.hero.title, href: '/tools/' }, { label: t.title, href: base }, ...(pair ? [{ label: title, href: url }] : []));
  const isConv = t.type === 'currency';
  const widget = isConv ? converterWidget(t, pair) : calculatorWidget(t);
  const C = t.converter;
  const tables = isConv ? (() => { const p = pair || C; return section(`<div class="grid g2">${rateTable(C, p.from, p.to)}${rateTable(C, p.to, p.from)}</div>`); })() : '';
  // Links to the other pairs (the starting pair links to the main page), never to this page itself
  const links = isConv ? [...new Map([[base, t.title], ...C.pairs.map((p) => [pairUrl(t, p), `${p.from} → ${p.to}`])]).entries()].filter(([href]) => href !== url) : [];
  const others = links.length ? section(`<ul class="tags pair-links">${links.map(([href, label]) => `<li><a href="${href}">${esc(label)}</a></li>`).join('')}</ul>`, { title: L.otherTitle }) : '';
  const steps = t.steps?.length ? `<h2 class="h3">${esc(toolsText.howTitle)}</h2><ol class="steps-list">${t.steps.map((s) => `<li>${esc(s)}</li>`).join('')}</ol>` : '';
  const how = t.intro?.length || steps ? section(`<div class="split split-top"><div class="prose-sm">${paras(t.intro)}</div><div>${steps}</div></div>`, { background: 'soft' }) : '';
  const c = t.cta || {};
  const cta = c.title || c.text || c.buttons?.length ? section(`<div class="cta">${c.title ? `<h2>${esc(c.title)}</h2>` : ''}${c.text ? `<p>${esc(c.text)}</p>` : ''}${btns(c.buttons)}</div>`) : '';
  // The same questions are on every pair page, so only the main tool page marks them up (as Google asks)
  const faq = !pair && t.faq?.length && { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: t.faq.map((i) => ({ '@type': 'Question', name: i.q, acceptedAnswer: { '@type': 'Answer', text: i.a } })) };
  // Pair pages follow the tool's robots setting, so hiding the converter from Google hides its pair pages too
  const seo = pair ? { ...(t.seo?.robots && { robots: t.seo.robots }), title, description: fillT(L.pairDescription, pv) } : { title: t.title, description: t.summary, ...filled(t.seo) };
  return {
    path: url, seo, crumbs, schema: [faq].filter(Boolean), scripts: [isConv ? 'tool-currency' : 'tool-website-cost'], styles: ['tools'],
    body: pageHero({ title, text: summary }, crumbs) + section(`<div class="narrow">${widget}</div>`) + tables + how + faqSection(t.faq, toolsText.faqTitle) + others + cta,
  };
}

const toolPages = () => tools.flatMap((t) => [toolPage(t), ...(t.type === 'currency' ? t.converter.pairs.filter((p) => !isStartPair(t, p)).map((p) => toolPage(t, p)) : [])]);

// ---- Search (Pagefind index made by templates/build-steps.js) ----
function searchPage() {
  const d = page('search');
  const crumbs = crumbsOf({ label: d.hero.title, href: '/search/' });
  const form = `<form class="search-form" action="/search/" method="get" role="search" data-search
 data-results-label="${esc(d.resultsLabel)}" data-no-results="${esc(d.noResults)}" data-loading="${esc(d.loading)}" data-unavailable="${esc(d.unavailable)}">
<label class="sr" for="q">${esc(d.buttonLabel)}</label><input id="q" name="q" type="search" placeholder="${esc(d.placeholder)}" autocomplete="off" enterkeyhint="search">
<button class="btn btn-primary" type="submit">${icon('search')}${esc(d.buttonLabel)}</button></form>
<p class="muted" role="status" data-search-status></p><ol class="search-results" data-search-results></ol>`;
  return { path: '/search/', seo: d.seo, crumbs, scripts: ['search'], body: pageHero(d.hero, crumbs) + section(`<div class="narrow">${form}</div>`) };
}

// ---- FAQ, legal, 404 ----
function faqPage() {
  const d = page('faq');
  const crumbs = crumbsOf({ label: d.hero.title, href: '/faq/' });
  const all = d.groups.flatMap((g) => g.items);
  const schema = { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: all.map((i) => ({ '@type': 'Question', name: i.q, acceptedAnswer: { '@type': 'Answer', text: i.a } })) };
  const groups = d.groups.map((g) => `<h2 class="h3">${esc(g.title)}</h2><div class="faq">${g.items.map((i) => `<details><summary>${esc(i.q)}</summary><p>${esc(i.a)}</p></details>`).join('')}</div>`).join('');
  return { path: '/faq/', seo: d.seo, crumbs, schema: [schema], body: pageHero(d.hero, crumbs) + section(`<div class="narrow">${groups}</div>`) };
}

function legalPage(name, path) {
  const d = page(name);
  const crumbs = crumbsOf({ label: d.hero.title, href: path });
  const sections = d.sections.map((s) => `<h2>${esc(s.heading)}</h2>${paras(s.paragraphs)}${s.list ? `<ul>${s.list.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>` : ''}`).join('');
  return {
    path, seo: d.seo, crumbs,
    body: pageHero(d.hero, crumbs) + section(`<article class="prose"><p class="muted">${esc(d.updatedLabel)}: <time datetime="${esc(d.lastUpdated)}">${formatDate(d.lastUpdated)}</time></p>${sections}</article>`),
  };
}

function notFoundPage() {
  const d = page('404');
  return { path: '/404.html', file: '404.html', noindex: true, seo: d.seo, body: `<section class="sec notfound"><div class="wrap"><p class="code">${esc(d.code)}</p><h1>${esc(d.title)}</h1><p class="lead">${esc(d.text)}</p>${btns(d.buttons)}</div></section>` };
}

// ---- Order tracking: /track/ for buyers, /admin/orders/ for the owner (orders are kept on Cloudflare, see src/pages/api/) ----
const trackText = page('track');
const statusData = () => trackText.statuses.map((x) => ({ id: x.id, label: x.label, text: x.text, icon: icon(x.icon) }));
const jsonData = (id, data) => `<script type="application/json" id="${id}">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`;

function trackPage() {
  const d = trackText;
  const crumbs = crumbsOf({ label: d.hero.title, href: '/track/' });
  const L = Object.fromEntries(['loading', 'notFound', 'unavailable', 'tooMany', 'statusLabel', 'itemsLabel', 'totalLabel', 'noteLabel', 'historyTitle', 'updatedLabel'].map((k) => [k, d[k]]));
  const form = `<form class="card card-pad form track-form" data-track>
<label>${esc(d.idLabel)}<input type="text" name="id" required maxlength="30" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="AB-261023-K7Q2M"><small class="muted">${esc(d.idHint)}</small></label>
<label>${esc(d.checkLabel)}<input type="text" name="check" required maxlength="120" autocomplete="off"></label>
<button class="btn btn-primary" type="submit">${icon('search')}${esc(d.submitLabel)}</button><p class="status" role="status" data-track-status></p></form>
<div class="card card-pad track-result" data-track-result hidden aria-live="polite"></div>
<p class="center muted">${esc(d.helpText)} <a href="${whatsapp()}" target="_blank" rel="noopener">WhatsApp</a></p>
${jsonData('track-data', { labels: L, statuses: statusData(), locale: site.locale })}`;
  return { path: '/track/', seo: d.seo, crumbs, scripts: ['track'], styles: ['admin'], body: pageHero(d.hero, crumbs) + section(`<div class="narrow">${form}</div>`) };
}

// The owner's page: list, search and change orders. It is useless without the ADMIN_PASSWORD secret, and hidden from Google.
function ordersAdminPage() {
  const opts = trackText.statuses.map((x) => `<option value="${esc(x.id)}">${esc(x.label)}</option>`).join('');
  const body = `<section class="sec"><div class="wrap admin-orders" data-orders>
<h1 class="h2">Orders</h1>
<form class="card card-pad form narrow" data-login><label>Admin password<input type="password" name="password" required autocomplete="current-password"></label>
<button class="btn btn-primary" type="submit">${icon('lock')}Open orders</button><p class="status" role="status" data-login-status></p>
<p class="muted">The password is the ADMIN_PASSWORD secret you set in Cloudflare. It is kept only in this browser tab.</p></form>
<div data-app hidden>
<div class="admin-bar"><input type="search" placeholder="Search ID, name, phone, email, item" data-q aria-label="Search orders">
<select data-filter aria-label="Filter by status"><option value="">All statuses</option>${opts}</select>
<button class="btn btn-primary btn-sm" type="button" data-new>${icon('plus')}New order</button><a class="btn btn-outline btn-sm" href="/admin/publish/">Publish changes</a><button class="btn btn-outline btn-sm" type="button" data-logout>Log out</button></div>
<p class="status" role="status" data-app-status></p>
<ul class="order-list" data-list></ul></div>
<dialog class="drawer order-edit" data-edit aria-labelledby="edit-title"><form class="form" method="dialog" data-edit-form>
<div class="drawer-head"><h2 class="h3" id="edit-title" data-edit-title>Order</h2><button class="icon-btn" type="button" data-close aria-label="Close">${icon('close')}</button></div>
<label>Order ID<input type="text" name="id" maxlength="30" placeholder="Empty = make a new ID" autocapitalize="characters"></label>
<label>Status<select name="status">${opts}</select></label>
<label>Note in the history (optional)<input type="text" name="historyNote" maxlength="300" placeholder="e.g. Sent by email"></label>
<label>Message for the buyer (shown on the tracking page)<textarea name="note" rows="2" maxlength="1000"></textarea></label>
<div class="row2"><label>Name<input type="text" name="name" maxlength="100"></label><label>Phone (with country code)<input type="tel" name="phone" maxlength="25"></label></div>
<label>Email<input type="email" name="email" maxlength="120"></label>
<label>Items<textarea name="items" rows="2" maxlength="1500"></textarea></label>
<div class="row2"><label>Total<input type="text" name="total" maxlength="40" placeholder="OMR 3.500"></label><label>Payment method<input type="text" name="method" maxlength="80"></label></div>
<div class="btns"><button class="btn btn-primary" type="submit" value="save">Save</button><button class="btn btn-outline" type="button" data-delete>${icon('trash')}Delete</button></div>
<ol class="history" data-edit-history></ol></form></dialog>
${jsonData('orders-data', { statuses: statusData(), site: site.url, whatsapp: whatsapp(), linkLabel: trackText.linkLabel, locale: site.locale })}
</div></section>`;
  return { path: '/admin/orders/', noindex: true, seo: { title: 'Orders' }, scripts: ['orders-admin'], styles: ['admin'], body };
}

// The owner's Publish page: CMS saves wait as drafts in the cms-drafts branch; "Publish all" puts them on the site in one build.
// It talks to GitHub with the same token as the CMS (kept only in this browser tab).
function publishPage() {
  const body = `<section class="sec"><div class="wrap admin-orders" data-publish>
<h1 class="h2">Publish changes</h1>
<p class="muted">Every Save in the CMS is kept as a draft. Nothing changes on the site until you press <b>Publish all</b> here, so you can change many products, services and settings and update the site once.</p>
<form class="card card-pad form narrow" data-login><label>GitHub token<input type="password" name="token" required autocomplete="current-password"></label>
<button class="btn btn-primary" type="submit">${icon('lock')}Open</button><p class="status" role="status" data-login-status></p>
<p class="muted">The same fine-grained token you use for the CMS (Contents: Read and write on this repository). It is kept only in this browser tab.</p></form>
<div data-app hidden>
<div class="admin-bar"><button class="btn btn-primary" type="button" data-publish-all disabled>${icon('check')}Publish all</button>
<button class="btn btn-outline btn-sm" type="button" data-refresh>${icon('refresh')}Refresh</button><a class="btn btn-outline btn-sm" href="/admin/">Open the CMS</a><a class="btn btn-outline btn-sm" href="/admin/orders/">Orders</a>
<button class="btn btn-outline btn-sm" type="button" data-logout>Log out</button></div>
<p class="status" role="status" data-app-status></p>
<div class="card card-pad" data-create hidden><h2 class="h3">One step first</h2><p>The drafts branch does not exist yet. Make it once, then the CMS opens and saves drafts there.</p><button class="btn btn-primary" type="button" data-create-branch>${icon('plus')}Create the drafts branch</button></div>
<div class="card card-pad publish-check" data-check hidden><h2 class="h3">Check</h2><p data-check-text></p><ul class="publish-problems" data-problems></ul></div>
<div class="card card-pad" data-changes hidden><h2 class="h3" data-changes-title>Waiting to be published</h2><ul class="order-list publish-list" data-change-list></ul>
<details><summary>Files</summary><ul class="publish-files" data-file-list></ul></details>
<p><button class="btn btn-outline btn-sm" type="button" data-discard>${icon('trash')}Discard all drafts</button></p></div>
</div>
${jsonData('publish-data', { repo: REPO, drafts: DRAFTS_BRANCH, main: 'main', locale: site.locale })}
</div></section>`;
  return { path: '/admin/publish/', noindex: true, seo: { title: 'Publish changes' }, scripts: ['publish'], styles: ['admin'], body };
}

export function allPages() {
  return [
    homePage(),
    shopPage(), ...products.map(productPage), paymentsPage(),
    servicesPage(), ...services.map(servicePage),
    toolsPage(), ...toolPages(),
    aboutPage(), experiencePage(), skillsPage(), workPageFn(), credentialsPage(),
    reviewsPageFn(), contactPage(),
    blogPage(), ...posts.map(postPage),
    legalPage('terms', '/terms-and-conditions/'), legalPage('privacy', '/privacy-policy/'), legalPage('refund', '/refund-policy/'),
    faqPage(), searchPage(), trackPage(), ordersAdminPage(), publishPage(), notFoundPage(),
  ];
}
