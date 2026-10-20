// Every page of the site. Each function returns { path, seo, body, schema, crumbs }.
import {
  site, contact, social, products, services, posts, page,
  esc, icon, btns, paras, bullets, img, target, formatPrice, formatDate, whatsapp, absUrl,
} from './helpers.js';

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

const priceTag = (p) =>
  p.salePrice != null ? `<b>${formatPrice(p.salePrice)}</b> <s>${formatPrice(p.price)}</s>` : `<b>${formatPrice(p.price)}</b>`;

const productCard = (p) => `<a class="card" href="/shop/${esc(p.slug)}/" data-cat="${esc(p.category)}">
<div class="card-img">${img(p.image)}${p.salePrice != null ? `<span class="badge">${esc(shopText.saleLabel)}</span>` : ''}${!p.inStock ? `<span class="badge badge-out">${esc(shopText.soldOutLabel)}</span>` : ''}</div>
<div class="card-body"><p class="kicker">${esc(p.category)}</p><h3>${esc(p.title)}</h3><p>${esc(p.summary)}</p><p class="price">${priceTag(p)}</p></div></a>`;

const serviceCard = (s) => `<a class="card card-pad" href="/services/${esc(s.slug)}/">
<span class="ic">${icon(s.icon)}</span><h3>${esc(s.title)}</h3><p>${esc(s.summary)}</p>
<p class="meta">${s.priceFrom != null ? `<span>${esc(servicesText.fromLabel)} <b>${formatPrice(s.priceFrom)}</b></span>` : ''}${s.delivery ? `<span>${icon('clock')}${esc(s.delivery)}</span>` : ''}</p></a>`;

const postCard = (p) => `<a class="card" href="/blog/${esc(p.slug)}/">
<div class="card-img">${img(p.image)}</div>
<div class="card-body"><p class="kicker">${esc(p.category)} · <time datetime="${esc(p.date)}">${formatDate(p.date)}</time></p><h3>${esc(p.title)}</h3><p>${esc(p.excerpt)}</p><span class="more">${esc(blogText.readMoreLabel)}${icon('arrow')}</span></div></a>`;

const stars = (n) => {
  const r = Math.max(0, Math.min(5, Math.round(n || 0)));
  return r ? `<p class="stars" aria-label="${r} out of 5 stars">${'★'.repeat(r)}${'☆'.repeat(5 - r)}</p>` : '';
};
const reviewCard = (r) => `<figure class="card card-pad review">${stars(r.rating)}<blockquote>“${esc(r.text)}”</blockquote>
<figcaption><b>${esc(r.name)}</b><span>${esc([r.role, r.date].filter(Boolean).join(', '))}</span></figcaption>
${r.link ? `<a class="more" href="${esc(r.link.href)}"${target(r.link.href)}>${esc(r.link.label)}${icon('arrow')}</a>` : ''}</figure>`;

const workCard = (p) => `<article class="card"><div class="card-img card-img-tall">${img(p.image)}</div><div class="card-body"><h3>${esc(p.title)}</h3><p>${esc(p.summary)}</p></div></article>`;

const figure = (image) => (image?.src ? `<figure class="fig">${img(image)}${image.caption ? `<figcaption>${esc(image.caption)}</figcaption>` : ''}</figure>` : '');

// ---- Home ----
const homeSections = {
  products: (s) => section(grid(products.slice(0, s.limit).map(productCard)), s),
  services: (s) => section(grid(services.slice(0, s.limit).map(serviceCard), 4), s),
  about: (s) => section(`<div class="split"><div>${img(s.image)}</div><div><h2>${esc(s.title)}</h2>${paras(s.text)}${btns(s.buttons)}</div></div>`, { background: s.background }),
  work: (s) => section(grid(workPage.projects.slice(0, s.limit).map(workCard), 2), s),
  reviews: (s) => section(grid(reviewsPage.items.slice(0, s.limit).map(reviewCard)), s),
  blog: (s) => (posts.length ? section(grid(posts.slice(0, s.limit).map(postCard)), s) : ''),
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
    image: absUrl(site.defaultImage), jobTitle: site.person.jobTitle, email: `mailto:${contact.email}`, telephone: `+${contact.whatsapp}`,
    worksFor: { '@type': 'Organization', name: site.person.worksFor },
    address: { '@type': 'PostalAddress', addressLocality: site.person.locality, addressRegion: site.person.region, addressCountry: site.person.country },
    sameAs: social.map((s) => s.url).filter((u) => /linkedin|fiverr/.test(u)),
    knowsAbout: site.person.knowsAbout,
  };
  const website = { '@context': 'https://schema.org', '@type': 'WebSite', name: site.name, url: site.url };
  return { path: '/', seo: d.seo, body, schema: [person, website] };
}

// ---- Shop ----
function shopPage() {
  const cats = [...new Set(products.map((p) => p.category))];
  const filters = cats.length > 1
    ? `<div class="chips" role="group"><button class="chip is-on" data-filter="all">${esc(shopText.allLabel)}</button>${cats.map((c) => `<button class="chip" data-filter="${esc(c)}">${esc(c)}</button>`).join('')}</div>`
    : '';
  const crumbs = crumbsOf({ label: shopText.hero.title, href: '/shop/' });
  const list = { '@context': 'https://schema.org', '@type': 'ItemList', itemListElement: products.map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: absUrl(`/shop/${p.slug}/`), name: p.title })) };
  return {
    path: '/shop/', seo: shopText.seo, crumbs, schema: [list],
    body: pageHero(shopText.hero, crumbs) + section(`${filters}<div class="grid g3" id="products">${products.map(productCard).join('')}</div><p class="note">${esc(shopText.note)} <a href="/refund-policy/">→</a></p>`),
  };
}

function productPage(p) {
  const price = p.salePrice ?? p.price;
  const crumbs = crumbsOf({ label: shopText.hero.title, href: '/shop/' }, { label: p.title, href: `/shop/${p.slug}/` });
  const order = whatsapp(shopText.orderMessage.replace('{product}', p.title).replace('{price}', formatPrice(price)));
  const buy = p.inStock
    ? btns([{ label: shopText.orderLabel, href: order, icon: 'wa' }, p.buyLink && { label: shopText.buyLabel, href: p.buyLink, style: 'outline', icon: 'cart' }].filter(Boolean))
    : `<p class="badge badge-out">${esc(shopText.soldOutLabel)}</p>`;
  const schema = {
    '@context': 'https://schema.org', '@type': 'Product', name: p.title, description: p.summary, image: absUrl(p.image.src), category: p.category,
    brand: { '@type': 'Brand', name: site.name },
    offers: { '@type': 'Offer', price, priceCurrency: site.currency, url: absUrl(`/shop/${p.slug}/`), availability: `https://schema.org/${p.inStock ? 'InStock' : 'OutOfStock'}` },
  };
  return {
    path: `/shop/${p.slug}/`, seo: { title: p.title, description: p.summary, image: p.image.src }, crumbs, schema: [schema],
    body: pageHero({ title: p.title, text: p.summary }, crumbs) + section(`<div class="split split-top"><div>${img(p.image, { eager: true })}</div><div>
<p class="kicker">${esc(p.category)}</p><p class="price price-lg">${priceTag(p)}</p>${paras(p.description)}${bullets(p.features)}<p class="muted">Format: ${esc(p.format)}</p>${buy}<p class="note">${esc(shopText.note)}</p></div></div>`),
  };
}

// ---- Services ----
function servicesPage() {
  const crumbs = crumbsOf({ label: servicesText.hero.title, href: '/services/' });
  const pr = servicesText.process;
  return {
    path: '/services/', seo: servicesText.seo, crumbs,
    body: pageHero(servicesText.hero, crumbs) + section(grid(services.map(serviceCard), 2))
      + (pr ? section(`<ol class="steps">${pr.steps.map((s, i) => `<li class="card card-pad"><span class="num">${i + 1}</span><h3>${esc(s.title)}</h3><p>${esc(s.text)}</p></li>`).join('')}</ol>`, { title: pr.title, background: 'soft' }) : ''),
  };
}

function servicePage(s) {
  const crumbs = crumbsOf({ label: servicesText.hero.title, href: '/services/' }, { label: s.title, href: `/services/${s.slug}/` });
  const schema = {
    '@context': 'https://schema.org', '@type': 'Service', name: s.title, description: s.summary, provider: { '@type': 'Person', name: site.name, url: site.url }, areaServed: 'Worldwide',
    ...(s.priceFrom != null && { offers: { '@type': 'Offer', price: s.priceFrom, priceCurrency: site.currency } }),
  };
  return {
    path: `/services/${s.slug}/`, seo: { title: s.title, description: s.summary, image: s.image?.src }, crumbs, schema: [schema],
    body: pageHero({ title: s.title, text: s.summary }, crumbs) + section(`<div class="split split-top"><div>${img(s.image, { eager: true })}</div><div>
<p class="meta meta-lg">${s.priceFrom != null ? `<span>${esc(servicesText.fromLabel)} <b>${formatPrice(s.priceFrom)}</b></span>` : ''}${s.delivery ? `<span>${icon('clock')}${esc(servicesText.deliveryLabel)}: ${esc(s.delivery)}</span>` : ''}</p>
${paras(s.description)}<h2 class="h3">${esc(servicesText.includesTitle)}</h2>${bullets(s.includes)}${btns(s.buttons)}</div></div>`),
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
  const roles = d.roles.map((r) => `<article class="role"><div class="role-head"><h2 class="h3">${esc(r.title)}${r.current ? ` <span class="badge badge-inline">${esc(d.currentLabel)}</span>` : ''}</h2>
<p class="muted">${esc(r.company)}</p><p class="meta"><span>${icon('clock')}${esc(r.period)}</span><span>${esc(r.type)}</span></p></div>${bullets(r.points)}${figure(r.image)}</article>`).join('');
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
  const certs = d.certificates.map((c) => `<a class="card" href="${esc(c.image.src)}" target="_blank" rel="noopener"><div class="card-img card-img-fit">${img(c.image)}</div><div class="card-body"><h3>${esc(c.title)}</h3><p>${esc(c.detail)}</p></div></a>`);
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
  const fiverr = d.fiverr ? `<div class="card card-pad card-accent"><span class="ic">${icon('star')}</span><h3>${esc(d.fiverr.title)}</h3><p>${esc(d.fiverr.text)}</p>${btns([d.fiverr.button])}</div>` : '';
  const form = f.show ? section(`<div class="narrow card card-pad"><h2 class="h3">${esc(f.title)}</h2><p>${esc(f.text)}</p>
<form class="form" data-form="review" data-success="${esc(f.success)}" data-rating-error="${esc(f.ratingError)}" data-error="${esc(page('contact').form.error)}">
<input type="checkbox" name="botcheck" class="hp" tabindex="-1" autocomplete="off">
<div class="row2"><label>${esc(f.nameLabel)}<input name="name" autocomplete="name" required></label><label>${esc(f.emailLabel)}<input name="email" type="email" autocomplete="email"></label></div>
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
    ...contact.phones.map((p) => row('phone', p.label, p.display, `tel:${p.number}`)),
    row('mail', L.email, contact.email, `mailto:${contact.email}`),
    ...social.filter((s) => !/wa\.me|mailto:/.test(s.url)).map((s) => row(s.icon, s.label, s.display, s.url)),
    row('pin', L.address, contact.address, contact.mapUrl),
    d.cv.show ? row('download', L.cv, d.cv.label, d.cv.href) : '',
  ].join('');
  const form = `<div class="card card-pad"><h2 class="h3">${esc(f.title)}</h2><p>${esc(f.text)}</p>
<form class="form" data-form="contact" data-success="${esc(f.success)}" data-error="${esc(f.error)}">
<input type="checkbox" name="botcheck" class="hp" tabindex="-1" autocomplete="off">
<label>${esc(f.nameLabel)}<input name="name" autocomplete="name" required></label>
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
  return { path: '/blog/', seo: blogText.seo, crumbs, body: pageHero(blogText.hero, crumbs) + section(grid(posts.map(postCard))) };
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
    '@context': 'https://schema.org', '@type': 'BlogPosting', headline: p.title, description: p.excerpt, datePublished: p.date, dateModified: p.date,
    author: { '@type': 'Person', name: p.author, url: site.url }, mainEntityOfPage: absUrl(`/blog/${p.slug}/`), ...(p.image && { image: absUrl(p.image.src) }),
  };
  const body = pageHero({ title: p.title, text: `${blogText.byLabel} ${p.author} · ${formatDate(p.date)}` }, crumbs)
    + section(`<article class="prose">${p.image ? img(p.image, { eager: true }) : ''}${p.content.map((b) => (blocks[b.type] || blocks.p)(b)).join('')}
<div class="tags">${(p.tags || []).map((t) => `<span>${esc(t)}</span>`).join('')}</div><p><a class="more" href="/blog/">← ${esc(blogText.backLabel)}</a></p></article>`);
  return { path: `/blog/${p.slug}/`, seo: { title: p.title, description: p.excerpt, image: p.image?.src }, crumbs, schema: [schema], type: 'article', body };
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

export function allPages() {
  return [
    homePage(),
    shopPage(), ...products.map(productPage),
    servicesPage(), ...services.map(servicePage),
    aboutPage(), experiencePage(), skillsPage(), workPageFn(), credentialsPage(),
    reviewsPageFn(), contactPage(),
    blogPage(), ...posts.map(postPage),
    legalPage('terms', '/terms-and-conditions/'), legalPage('privacy', '/privacy-policy/'), legalPage('refund', '/refund-policy/'),
    faqPage(), notFoundPage(),
  ];
}
