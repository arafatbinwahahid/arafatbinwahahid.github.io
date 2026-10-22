// Builds /webmcp.js: tools that AI agents in the browser can use through WebMCP (document.modelContext).
// Everything comes from data/*.json at build time, so new products, services and pages show up automatically.
// Pages load the file only when the browser supports WebMCP, so normal visitors never download it.
import { site, contact, products, services, tools, rates, payments, page, absUrl, whatsapp, optionsOf, stockOf } from './helpers.js';

const list = (a) => [].concat(a || []).filter(Boolean);

function siteData(pages) {
  const faq = page('faq');
  const converter = tools.find((t) => t.type === 'currency');
  return {
    site: { name: site.name, url: site.url, description: site.description },
    contact: {
      whatsapp: whatsapp(), email: contact.email, phones: contact.phones.map((p) => ({ label: p.label, number: p.number })),
      address: contact.address, hours: contact.hours,
    },
    currencies: payments.currencies.map((c) => ({ code: c.code, name: c.name, methods: c.methods.filter((m) => m.enabled !== false).map((m) => m.name) })),
    defaultCurrency: payments.defaultCurrency,
    checkout: absUrl('/payments/'),
    pages: pages.filter((p) => !(p.noindex || p.seo?.robots?.index === false)).map((p) => ({ title: p.seo?.title || site.name, url: absUrl(p.path) })),
    products: products.map((p) => ({
      slug: p.slug, title: p.title, url: absUrl(`/shop/${p.slug}/`), category: p.category, summary: p.summary, about: p.about,
      features: list(p.features).map((f) => f.text), faq: list(p.faq), format: p.format, inStock: stockOf(p) > 0,
      plans: optionsOf(p).map((o) => ({ id: o.id, name: o.name || p.title, prices: o.prices, stock: o.stock })),
    })),
    services: services.map((s) => ({
      slug: s.slug, title: s.title, url: absUrl(`/services/${s.slug}/`), category: s.category, summary: s.summary, about: s.about,
      features: list(s.features).map((f) => f.text), faq: list(s.faq), packages: s.packages.map((pk) => ({ name: pk.name, prices: pk.prices })),
    })),
    tools: tools.map((t) => ({ slug: t.slug, title: t.title, url: absUrl(`/tools/${t.slug}/`), summary: t.summary })),
    // The currency converter's own rates (units per 1 USD), only when that tool is on the site
    rates: converter
      ? { updated: rates.updated, note: rates.note, url: absUrl(`/tools/${converter.slug}/`), currencies: rates.currencies.map((c) => ({ code: c.code, name: c.name, perUsd: c.rate, decimals: c.decimals })) }
      : null,
    faq: faq.groups.flatMap((g) => g.items),
  };
}

// Runs in the browser. D is the data above.
function client(D) {
  const mc = document.modelContext || navigator.modelContext;
  if (!mc) return;
  const reply = (data) => ({ content: [{ type: 'text', text: typeof data === 'string' ? data : JSON.stringify(data) }] });
  const find = (items, slug) => items.find((x) => x.slug === slug || x.title.toLowerCase() === String(slug).toLowerCase());
  const plans = Object.fromEntries(D.products.flatMap((p) => p.plans.map((pl) => [pl.id, { ...pl, product: p.title }])));
  const readCart = () => { try { return JSON.parse(localStorage.getItem('cart')) || []; } catch { return []; } };
  const cartView = (cart) => ({ items: cart.filter((i) => plans[i.id]).map((i) => ({ id: i.id, product: plans[i.id].product, plan: plans[i.id].name, quantity: i.qty, prices: plans[i.id].prices })), checkout: D.checkout });
  const slugInput = (what) => ({ type: 'object', properties: { slug: { type: 'string', description: `The ${what} slug from the list tool, e.g. "${what === 'product' ? D.products[0]?.slug : D.services[0]?.slug}"` } }, required: ['slug'] });
  const readOnly = { readOnlyHint: true };

  const tools = [
    {
      name: 'get-site-info',
      description: `About ${D.site.name}: what the site offers, contact details (WhatsApp, email, phone), currencies, payment methods, free tools and the list of pages.`,
      inputSchema: { type: 'object', properties: {} },
      annotations: readOnly,
      execute: async () => reply({ site: D.site, contact: D.contact, currencies: D.currencies, defaultCurrency: D.defaultCurrency, tools: D.tools, pages: D.pages }),
    },
    {
      name: 'list-products',
      description: 'List every product in the shop with its plans, prices in each currency and stock.',
      inputSchema: { type: 'object', properties: {} },
      annotations: readOnly,
      execute: async () => reply(D.products.map(({ slug, title, url, category, summary, inStock, plans: p }) => ({ slug, title, url, category, summary, inStock, plans: p }))),
    },
    {
      name: 'get-product',
      description: 'Full details of one product: description, features, plans with prices and stock, and its FAQ.',
      inputSchema: slugInput('product'),
      annotations: readOnly,
      execute: async ({ slug }) => reply(find(D.products, slug) || `No product "${slug}". Use list-products to see the slugs.`),
    },
    {
      name: 'list-services',
      description: 'List the services (custom work ordered on WhatsApp) with their packages and prices.',
      inputSchema: { type: 'object', properties: {} },
      annotations: readOnly,
      execute: async () => reply(D.services.map(({ slug, title, url, category, summary, packages }) => ({ slug, title, url, category, summary, packages }))),
    },
    {
      name: 'get-service',
      description: 'Full details of one service: description, features, packages with prices and its FAQ.',
      inputSchema: slugInput('service'),
      annotations: readOnly,
      execute: async ({ slug }) => reply(find(D.services, slug) || `No service "${slug}". Use list-services to see the slugs.`),
    },
    {
      name: 'search-site',
      description: 'Search products, services, free tools, pages and FAQ answers by keyword. Returns matching items with links.',
      inputSchema: { type: 'object', properties: { query: { type: 'string', description: 'Words to search for, e.g. "netflix 4k" or "refund"' } }, required: ['query'] },
      annotations: readOnly,
      execute: async ({ query }) => {
        const words = String(query || '').toLowerCase().split(/\s+/).filter(Boolean);
        const hit = (text) => words.length && words.every((w) => text.toLowerCase().includes(w));
        const faqs = [...D.faq, ...D.products.flatMap((p) => p.faq), ...D.services.flatMap((s) => s.faq)];
        return reply({
          products: D.products.filter((p) => hit(JSON.stringify(p))).map((p) => ({ title: p.title, url: p.url, slug: p.slug })),
          services: D.services.filter((s) => hit(JSON.stringify(s))).map((s) => ({ title: s.title, url: s.url, slug: s.slug })),
          tools: D.tools.filter((t) => hit(t.title + ' ' + t.summary)),
          pages: D.pages.filter((p) => hit(p.title)),
          faq: faqs.filter((f) => hit(f.q + ' ' + f.a)),
        });
      },
    },
    {
      name: 'get-cart',
      description: "Show what is in the visitor's shopping cart on this site.",
      inputSchema: { type: 'object', properties: {} },
      annotations: readOnly,
      execute: async () => reply(cartView(readCart())),
    },
    {
      name: 'add-to-cart',
      description: "Add a product plan to the visitor's cart. Use the plan id from list-products or get-product. Payment is done by the visitor on the checkout page.",
      inputSchema: {
        type: 'object',
        properties: { id: { type: 'string', description: 'Plan id, e.g. "' + (D.products[0]?.plans[0]?.id || '') + '"' }, quantity: { type: 'integer', minimum: 1, description: 'How many (default 1)' } },
        required: ['id'],
      },
      execute: async ({ id, quantity = 1 }) => {
        const plan = plans[id];
        if (!plan) return reply(`No plan with id "${id}". Use list-products to see the ids.`);
        const cart = readCart().filter((i) => plans[i.id]);
        const line = cart.find((i) => i.id === id) || cart[cart.push({ id, qty: 0 }) - 1];
        const qty = Math.min(line.qty + Math.max(1, Math.floor(quantity)), plan.stock);
        if (qty < 1 || qty === line.qty) return reply(`Not added: only ${plan.stock} of "${plan.product} (${plan.name})" in stock.`);
        line.qty = qty;
        localStorage.setItem('cart', JSON.stringify(cart));
        return reply({ added: `${plan.product} (${plan.name})`, ...cartView(cart), note: 'Open the checkout link to choose a currency and payment method.' });
      },
    },
    {
      name: 'whatsapp-link',
      description: `Make a WhatsApp link to message ${D.site.name} with a ready-written message (for questions, services or custom orders). It does not send anything.`,
      inputSchema: { type: 'object', properties: { message: { type: 'string', description: 'The message to pre-fill' } }, required: ['message'] },
      annotations: readOnly,
      execute: async ({ message }) => reply({ url: `${D.contact.whatsapp}?text=${encodeURIComponent(message || '')}` }),
    },
  ];

  if (D.rates) {
    const R = Object.fromEntries(D.rates.currencies.map((c) => [c.code, c]));
    const codes = Object.keys(R);
    tools.push({
      name: 'convert-currency',
      description: `Convert money between ${codes.join(', ')} with the exchange rates ${D.site.name} sets by hand (updated ${D.rates.updated}). Same numbers as the currency converter on the site.`,
      inputSchema: {
        type: 'object',
        properties: { amount: { type: 'number', minimum: 0, description: 'Amount to convert' }, from: { type: 'string', enum: codes }, to: { type: 'string', enum: codes } },
        required: ['amount', 'from', 'to'],
      },
      annotations: readOnly,
      execute: async ({ amount, from, to }) => {
        const a = R[String(from).toUpperCase()];
        const b = R[String(to).toUpperCase()];
        if (!a || !b) return reply(`Use one of these currency codes: ${codes.join(', ')}`);
        const n = Math.max(0, Number(amount) || 0);
        // Same steps and rounding as the converter page, so the numbers match it exactly
        const result = new Intl.NumberFormat('en-US', { minimumFractionDigits: b.decimals, maximumFractionDigits: b.decimals, useGrouping: false }).format((n / a.perUsd) * b.perUsd);
        return reply({ amount: n, from: a.code, to: b.code, result: Number(result), rate: b.perUsd / a.perUsd, updated: D.rates.updated, note: D.rates.note, url: D.rates.url });
      },
    });
  }

  if (mc.registerTool) tools.forEach((t) => { try { mc.registerTool(t); } catch (e) { console.warn('WebMCP:', t.name, e); } });
  else if (mc.provideContext) mc.provideContext({ tools });
}

export const webmcpScript = (pages) => `// WebMCP tools for AI agents. Made automatically from data/*.json by build.js, do not edit.
(${client.toString()})(${JSON.stringify(siteData(pages)).replace(/</g, '\\u003c')});
`;
