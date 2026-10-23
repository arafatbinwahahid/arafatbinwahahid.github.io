// Sveltia CMS (arafatbin.com/admin/): one form per JSON file in data/.
// build.js writes dist/admin/config.yml from this file, so the icon lists and folders always match the site.
// Every key of every JSON file must have a field here, or the CMS drops it when saving: `npm test` checks that (cms-check.js).
import { icons, header, payments, site } from './helpers.js';

export const CMS_VERSION = '0.227.4';
const REPO = process.env.GITHUB_REPOSITORY || 'arafatbinwahahid/arafatbinwahahid.github.io';
const LATER = 'Saved for later: the site does not show this yet.';

// ---- Field helpers (every field is optional unless `required: true` is passed; the build checks the data) ----
const F = (widget, name, label, o = {}) => ({ name, label, widget, required: false, ...o });
const str = (name, label, o) => F('string', name, label, o);
const txt = (name, label, o) => F('text', name, label, o);
const num = (name, label, o) => F('number', name, label, { value_type: 'float', ...o });
const int = (name, label, o) => F('number', name, label, { value_type: 'int', ...o });
const bool = (name, label, o) => F('boolean', name, label, o);
const date = (name, label, o) => F('datetime', name, label, { type: 'date', format: 'YYYY-MM-DD', ...o });
const time = (name, label, o) => F('datetime', name, label, { type: 'time', format: 'HH:mm', ...o });
const sel = (name, label, options, o) => F('select', name, label, { options, ...o });
// Turn payment methods off for one product or service (every method in Settings → Payment methods can be picked)
const paymentsOff = (what) => F('select', 'paymentsOff', 'Payment methods turned off', {
  multiple: true, required: false,
  options: payments.currencies.flatMap((c) => c.methods.map((m) => ({ label: `${m.name} (${c.code})`, value: m.id }))),
  hint: `Pick the methods this ${what} must not be paid with, e.g. PayPal. Empty = every method that is on in Settings → Payment methods. To turn a method off everywhere, use its “Show this method” switch there.`,
});
const obj = (name, label, fields, o) => F('object', name, label, { fields, collapsed: 'auto', ...o });
const list = (name, label, fields, o) => F('list', name, label, { fields, collapsed: 'auto', ...o });
const strList = (name, label, o) => F('list', name, label, { field: { name: 'item', label: 'Item', widget: 'string' }, ...o });
const txtList = (name, label, o) => F('list', name, label, { field: { name: 'item', label: 'Paragraph', widget: 'text' }, ...o });
const later = (field) => ({ ...field, hint: field.hint ? `${field.hint} ${LATER}` : LATER });
const hidden = (name) => ({ name, widget: 'hidden' });

const URL_HINT = 'A page on this site like /shop/, or a full link like https://…, mailto:… or tel:…';
const href = (name = 'href', label = 'Link', o) => str(name, label, { hint: URL_HINT, pattern: ['^$|^(/|https?://|mailto:|tel:|#)', 'Start with /, https://, mailto:, tel: or #'], ...o });
const iconNames = Object.keys(icons).filter((k) => !k.startsWith('_'));
const icon = (name = 'icon', label = 'Icon', o) => sel(name, label, iconNames, { hint: 'Icons come from Settings → Icons (data/global/icons.json).', dropdown_threshold: 0, ...o });
// Best upload size for each place an image is shown (measured from the site's layout, about 2× the shown size for sharp phones)
const SIZES = {
  product: '1200 × 900 px (4:3, landscape). The first image is the shop card (cut to 4:3) and the big picture on the product page; the others show as thumbnails under it.',
  service: '1200 × 900 px (4:3, landscape). The first image is the service card (cut to 4:3) and the big picture on the service page; the others show as thumbnails under it.',
  blogCover: '1200 × 900 px (4:3, landscape). Shown on blog cards (cut to 4:3) and at the top of the post, and used when the post is shared unless SEO → Share image is set.',
  blogImage: '1200 px wide, any height. Shown inside the post at the text width (up to about 720 px).',
  about: '1200 × 800 px (3:2, landscape). Shown next to the text, up to 556 px wide; also the photo of the home page "About" section.',
  experience: '1200 × 900 px (4:3, landscape). Shown under the job, up to 600 px wide.',
  work: '1200 × 825 px (16:11, landscape). Home page "Recent work" cards cut it to 16:11; the Work page shows the whole image.',
  credential: '1600 × 1200 px (4:3) scan or photo of the certificate. Shown whole (never cut) in a 4:3 box; tapping it opens the full image, so keep the text sharp.',
  poster: '1000 × 1000 px (square). For a QR code: square, at least 600 px, with a white border around the code.',
  payLogo: '256 × 256 px (square) or a wide logo, PNG or SVG with a transparent or light background. Shown in a 64 × 64 px tile.',
  logo: 'PNG with a white or transparent background, at least 300 px tall. White space around it is cut off automatically; shown 32 px tall in the header and footer.',
  favicon: '512 × 512 px (square) PNG. Becomes the browser tab icon (48 px) and the phone home-screen icon (180 px).',
  share: '1200 × 630 px (1.91:1), JPG or PNG. Shown when the page is shared on Facebook, WhatsApp, X or LinkedIn and in Google Discover.',
  avatar: '400 × 400 px (square) photo of the person.',
  signature: '600 × 200 px, PNG with a transparent background.',
  companyLogo: '256 × 256 px (square) PNG.',
  wide: '1200 px wide, any height.',
};
const imageHint = (size) => `📐 Best size: ${SIZES[size] || SIZES.wide} Upload JPG, PNG or WebP; it is resized and turned into small WebP copies automatically.`;
const imgPath = (name, label, folder, { size, ...o } = {}) => F('image', name, label, { media_folder: `/assets/images/${folder}`, public_folder: `/assets/images/${folder}`, hint: imageHint(size), ...o });
const image = (name, label, folder, o = {}) => obj(name, label, [
  imgPath('src', 'Image', folder, { size: o.size }),
  str('alt', 'Alt text', { hint: 'Describe the image for Google and screen readers, e.g. "Netflix shared account poster".' }),
  ...(o.caption ? [str('caption', 'Caption', { hint: 'Short text shown under the image.' })] : []),
], { summary: '{{alt}}', ...o.field });
const images = (name, label, folder, size) => list(name, label, [imgPath('src', 'Image', folder, { size }), str('alt', 'Alt text', { hint: 'Describe the image for Google and screen readers.' })], { summary: '{{alt}}', thumbnail: 'src', hint: `The first image is the main one. ${imageHint(size)}` });
const buttonFields = () => [
  str('label', 'Button text', { required: true }),
  href('href', 'Link', { required: true }),
  sel('style', 'Style', ['primary', 'outline', 'light'], { default: 'primary', hint: 'primary = filled blue, outline = white with border, light = white on dark.' }),
  icon(),
  bool('download', 'Download the file', { hint: 'Turn on for files like a PDF CV.' }),
];
const button = (name = 'button', label = 'Button') => obj(name, label, buttonFields(), { summary: '{{label}}' });
const buttons = (name = 'buttons', label = 'Buttons') => list(name, label, buttonFields(), { summary: '{{label}}', label_singular: 'button' });
const link = (name = 'link', label = 'Link', withIcon = false) => obj(name, label, [str('label', 'Text'), href(), ...(withIcon ? [icon()] : [])], { summary: '{{label}}' });
const links = (name, label, withIcon = false) => list(name, label, [str('label', 'Text', { required: true }), href('href', 'Link', { required: true }), ...(withIcon ? [icon()] : [])], { summary: '{{label}} → {{href}}', label_singular: 'link' });
const hero = () => obj('hero', 'Page header', [str('title', 'Title (H1)', { required: true, hint: 'The main heading of the page. One clear sentence.' }), txt('text', 'Intro text')], { collapsed: false });
const faq = (name = 'faq', label = 'Questions and answers') => list(name, label, [str('q', 'Question', { required: true }), txt('a', 'Answer', { required: true })], { summary: '{{q}}', label_singular: 'question' });
const CURRENCIES = ['OMR', 'USD', 'BDT'];
const prices = (name, label, hint) => obj(name, label, CURRENCIES.map((c) => num(c, c, { min: 0, step: 0.001 })), { hint, collapsed: false });
const color = (name, label) => F('color', name, label, { allowInput: true });

// ---- SEO block used by every page, product, service and post (see README "SEO") ----
const seo = ({ article = false } = {}) => obj('seo', '🔍 SEO', [
  str('title', 'SEO title', { hint: 'Shown in Google and the browser tab. Up to about 60 characters. Empty = the page title.', maxlength: 70 }),
  bool('titleSuffix', 'Add " | Arafat Bin Wahahid" to the title', { default: true, hint: 'Added only while the title stays under 60 characters.' }),
  txt('description', 'Meta description', { hint: 'The grey text under the title in Google. 70–155 characters.', maxlength: 170 }),
  strList('keywords', 'Keywords', { hint: 'Optional. Google ignores this, Bing uses it a little.' }),
  str('canonical', 'Canonical URL', { hint: 'Only when this page copies another URL. Empty = this page.' }),
  F('image', 'image', 'Share image', { media_folder: '/assets/images/social', public_folder: '/assets/images/social', hint: `Image for Facebook, WhatsApp and X previews. Empty = the main image of the page. ${imageHint('share')}` }),
  str('imageAlt', 'Share image alt text'),
  str('author', 'Author', { hint: 'Empty = Settings → Site → SEO defaults → Author.' }),
  obj('robots', 'Search engine rules (robots)', [
    bool('index', 'Show in Google (index)', { default: true, hint: 'Off = noindex, and the page is left out of sitemap.xml.' }),
    bool('follow', 'Follow links on this page', { default: true }),
    bool('nosnippet', 'No text snippet in results'),
    bool('noimageindex', 'Do not index images'),
    bool('notranslate', 'No translate offer in Google'),
    bool('indexifembedded', 'Index when embedded'),
    int('maxSnippet', 'Max snippet length', { default: -1, min: -1, hint: '-1 = no limit' }),
    sel('maxImagePreview', 'Max image preview', ['', 'none', 'standard', 'large'], { default: 'large' }),
    int('maxVideoPreview', 'Max video preview (seconds)', { default: -1, min: -1, hint: '-1 = no limit' }),
    date('unavailableAfter', 'Remove from Google after', { hint: 'Optional end date for offers that expire.' }),
  ]),
  str('googlebot', 'Extra rules for Google only', { hint: 'e.g. nosnippet' }),
  str('bingbot', 'Extra rules for Bing only'),
  obj('openGraph', 'Facebook / WhatsApp (Open Graph)', [
    str('type', 'Type', { hint: 'website, article, product, profile … Empty = automatic.' }),
    str('title', 'Title'), txt('description', 'Description'),
    strList('localeAlternate', 'Other locales', { hint: 'e.g. bn_BD' }),
  ]),
  obj('twitter', 'X (Twitter) card', [
    sel('card', 'Card type', ['', 'summary', 'summary_large_image']),
    str('title', 'Title'), txt('description', 'Description'), str('creator', 'Creator @username'),
  ]),
  ...(article ? [obj('article', 'Article details', [
    date('publishedTime', 'Published', { hint: 'Empty = the post date.' }), date('modifiedTime', 'Last updated'),
    str('section', 'Section', { hint: 'Empty = the post category.' }), strList('tags', 'Tags', { hint: 'Empty = the post tags.' }),
  ])] : []),
  list('alternates', 'Other language versions (hreflang)', [str('hreflang', 'Language code', { hint: 'e.g. bn, ar, en' }), str('href', 'URL')], { summary: '{{hreflang}}: {{href}}' }),
  F('list', 'schema', 'Extra structured data (JSON-LD)', { field: { name: 'item', label: 'JSON-LD object', widget: 'code', default_language: 'json', output_code_only: true, allow_language_selection: false }, hint: 'Paste schema.org JSON. Added next to the automatic data.' }),
  list('meta', 'Other meta tags', [str('name', 'name'), str('property', 'property (instead of name)'), str('content', 'content')], { summary: '{{name}}{{property}}' }),
], { collapsed: true, hint: 'Leave a field empty and the site fills it in automatically.' });

// ---- Page files (data/pages/*.json) ----
const legal = () => [
  seo(), hero(),
  date('lastUpdated', 'Last updated', { required: true }), str('updatedLabel', '"Last updated" label'),
  later(date('effectiveDate', 'Effective from')),
  list('sections', 'Sections', [str('heading', 'Heading', { required: true }), txtList('paragraphs', 'Paragraphs'), strList('list', 'Bullet list')], { summary: '{{heading}}', label_singular: 'section' }),
];
const reviewFields = () => [
  str('name', 'Customer name', { required: true }), str('role', 'Role or country'), str('date', 'Date', { hint: 'Free text, e.g. "March 2026".' }),
  int('rating', 'Stars (1–5)', { min: 1, max: 5, default: 5 }), txt('text', 'Review', { required: true }), link('link', 'Link to the review'),
  later(imgPath('avatar', 'Photo', 'reviews', { size: 'avatar' })), later(sel('source', 'Where it was posted', ['', 'Fiverr', 'Google', 'Facebook', 'WhatsApp', 'Website'])), later(bool('verified', 'Verified buyer')),
];
const homeSection = (name, label, fields) => ({ name, label, widget: 'object', fields: [bool('show', 'Show this section', { default: true }), ...fields] });
const sectionHead = () => [str('title', 'Title'), str('text', 'Text'), link('link', '"See all" link'), sel('background', 'Background', ['', 'soft'])];

const pages = [
  { name: 'home', label: 'Home', icon: 'home', fields: [
    seo(),
    obj('hero', 'Top of the page', [
      str('eyebrow', 'Small text above the title'), str('title', 'Title (H1)', { required: true }), txt('text', 'Intro text'), buttons(),
      list('tiles', 'Shortcut tiles', [icon(), str('title', 'Title'), str('text', 'Text'), str('label', 'Link text'), href()], { summary: '{{title}}' }),
    ], { collapsed: false }),
    F('list', 'sections', 'Sections (drag to reorder)', { types: [
      homeSection('products', 'Products', [...sectionHead(), int('limit', 'How many', { default: 4 })]),
      homeSection('services', 'Services', [...sectionHead(), int('limit', 'How many', { default: 2 })]),
      homeSection('tools', 'Free tools', [...sectionHead(), int('limit', 'How many', { default: 4 })]),
      homeSection('about', 'About', [str('title', 'Title'), txtList('text', 'Paragraphs'), image('image', 'Photo', 'about', { size: 'about' }), buttons(), sel('background', 'Background', ['', 'soft'])]),
      homeSection('work', 'Recent work', [...sectionHead(), int('limit', 'How many', { default: 2 })]),
      homeSection('reviews', 'Reviews', [...sectionHead(), int('limit', 'How many', { default: 3 })]),
      homeSection('blog', 'Blog', [...sectionHead(), int('limit', 'How many', { default: 3 })]),
      homeSection('cta', 'Call to action', [str('title', 'Title'), str('text', 'Text'), buttons(), sel('background', 'Background', ['', 'soft'])]),
    ], hint: 'Add, remove and drag sections. Each one appears on the home page in this order.' }),
    later(obj('announcement', 'Announcement bar', [bool('show', 'Show'), str('text', 'Text'), link()])),
    later(list('trustBadges', 'Trust badges', [icon(), str('text', 'Text')], { summary: '{{text}}' })),
  ] },
  { name: 'shop', label: 'Shop page', icon: 'storefront', preview_path: 'shop/', fields: [
    seo(), hero(), str('productsTitle', 'Products heading (hidden, for screen readers)'),
    str('allLabel', '"All" filter label'), str('currencyLabel', 'Currency label'), str('fromLabel', '"From" label'), str('choosePlanLabel', '"Choose a plan" label'),
    str('addToCartLabel', '"Add to cart" label'), str('saleLabel', 'Sale badge'), str('soldOutLabel', 'Sold out label'), str('stockLabel', 'Stock label', { hint: '{n} = number in stock' }),
    str('maxStockMessage', 'Max stock message', { hint: '{n} = number in stock' }), str('quantityLabel', 'Quantity label'), str('formatLabel', '"Format" label'),
    list('benefits', 'Benefits', [icon(), str('title', 'Title'), str('text', 'Text')], { summary: '{{title}}' }),
    links('policyLinks', 'Policy links'),
    obj('cart', 'Cart texts', ['title', 'openLabel', 'closeLabel', 'empty', 'totalLabel', 'checkoutLabel', 'continueLabel', 'removeLabel', 'increaseLabel', 'decreaseLabel'].map((k) => str(k, k))),
    obj('sections', 'Product page headings', ['about', 'description', 'usage', 'features', 'faq', 'reviews'].map((k) => str(k, k))),
    obj('queue', '"Get in the product queue" box', [str('title', 'Title'), txtList('lines', 'Lines'), buttons()]),
  ] },
  { name: 'payments', label: 'Payment page', icon: 'payments', fields: [
    hidden('_help'), seo(), hero(),
    ...['summaryTitle', 'orderIdLabel', 'editCartLabel', 'stockNotice', 'noMethods', 'currencyTitle', 'methodTitle', 'payTitle', 'detailsTitle', 'copyLabel', 'copiedLabel', 'stepsTitle', 'locationTitle', 'openMapLabel', 'hoursTitle', 'missingDetails', 'verifyNote', 'noscript'].map((k) => str(k, k)),
    obj('empty', 'Empty cart box', [str('title', 'Title'), txt('text', 'Text'), button()]),
    obj('form', 'Payment form texts', ['nameLabel', 'mobileLabel', 'emailLabel', 'amountLabel', 'transactionLabel', 'dateLabel', 'timeLabel', 'messageLabel', 'submitPayment', 'submitAppointment', 'sending', 'invalidPhone', 'invalidAmount', 'invalidDate', 'invalidTime', 'emptyCart', 'duplicate', 'error'].map((k) => str(k, k))),
    obj('paypal', 'PayPal box texts', ['title', 'note', 'fallback', 'error', 'feeLabel'].map((k) => str(k, k))),
    obj('done', 'Thank-you box', [str('title', 'Title'), txt('payment', 'After a payment form', { hint: '{id} = order ID' }), txt('paypal', 'After a PayPal payment'), txt('appointment', 'After an appointment request'), button()]),
  ] },
  { name: 'services', label: 'Services page', icon: 'work', preview_path: 'services/', fields: [
    seo(), hero(), str('fromLabel', '"From" label'), str('orderLabel', 'WhatsApp order button'),
    str('orderMessage', 'WhatsApp message', { hint: '{service}, {package} and {price} are filled in.' }),
    obj('paypal', 'PayPal on packages', ['payLabel', 'payLabelFee', 'feeLabel', 'note', 'doneTitle', 'doneText', 'doneWhatsapp', 'error', 'fallback', 'sendError'].map((k) => str(k, k, { hint: { payLabel: '{price} = package price', payLabelFee: 'Used when PayPal fees are set: {total} = price + fee, {fee} = the fee' }[k] }))),
    obj('process', '"How it works"', [str('title', 'Title'), list('steps', 'Steps', [str('title', 'Title'), txt('text', 'Text')], { summary: '{{title}}' })]),
    obj('sections', 'Service page headings', ['about', 'description', 'features', 'faq'].map((k) => str(k, k))),
  ] },
  { name: 'tools', label: 'Tools page', icon: 'handyman', preview_path: 'tools/', fields: [
    seo(), hero(), str('openLabel', '"Open tool" link'), str('freeLabel', '"Free" label'), str('howTitle', '"How to use it" heading'), str('faqTitle', 'Questions heading'),
  ] },
  { name: 'about', label: 'About', icon: 'person', preview_path: 'about/', fields: [
    seo(), hero(), image('image', 'Photo', 'about', { size: 'about' }), txtList('paragraphs', 'Paragraphs'), str('factsTitle', 'Facts heading'),
    list('facts', 'Quick facts', [str('label', 'Label'), str('value', 'Value')], { summary: '{{label}}: {{value}}' }), buttons(),
    later(txt('mission', 'Mission')), later(txt('vision', 'Vision')),
    later(list('values', 'Values', [icon(), str('title', 'Title'), txt('text', 'Text')], { summary: '{{title}}' })),
    later(imgPath('signature', 'Signature image', 'about', { size: 'signature' })),
  ] },
  { name: 'experience', label: 'Experience', icon: 'badge', preview_path: 'experience/', fields: [
    seo(), hero(), str('currentLabel', '"Current" badge'),
    list('roles', 'Jobs', [
      str('title', 'Job title', { required: true }), str('company', 'Company'), str('period', 'Period', { hint: 'e.g. Jan 2024 – Present' }), str('type', 'Type', { hint: 'e.g. Full-time' }),
      bool('current', 'Current job'), strList('points', 'What you did'), image('image', 'Photo', 'about', { caption: true, size: 'experience' }),
      later(str('location', 'Location')), later(imgPath('logo', 'Company logo', 'about', { size: 'companyLogo' })), later(strList('skills', 'Skills used')),
    ], { summary: '{{title}} – {{company}}' }),
  ] },
  { name: 'skills', label: 'Skills', icon: 'build', preview_path: 'skills/', fields: [
    seo(), hero(),
    list('groups', 'Skill groups', [icon(), str('title', 'Title'), strList('items', 'Skills'), later(int('level', 'Level (0–100)', { min: 0, max: 100 }))], { summary: '{{title}}' }),
    str('languagesTitle', 'Languages heading'),
    list('languages', 'Languages', [str('name', 'Language'), str('level', 'Level')], { summary: '{{name}} – {{level}}' }),
  ] },
  { name: 'work', label: 'Work', icon: 'photo_library', preview_path: 'work/', fields: [
    seo(), hero(),
    list('projects', 'Projects', [
      str('title', 'Title', { required: true }), image('image', 'Image', 'work', { size: 'work' }), txt('summary', 'Summary'), strList('points', 'Highlights'), buttons(),
      later(str('client', 'Client')), later(date('date', 'Date')), later(strList('tags', 'Tags')), later(images('gallery', 'More images', 'work', 'wide')), later(href('url', 'Live link')),
    ], { summary: '{{title}}', thumbnail: 'image.src' }),
  ] },
  { name: 'credentials', label: 'Credentials', icon: 'workspace_premium', preview_path: 'credentials/', fields: [
    seo(), hero(), str('certificatesTitle', 'Certificates heading'),
    list('certificates', 'Certificates', [
      str('title', 'Title', { required: true }), str('detail', 'Details', { hint: 'Issuer and date' }), image('image', 'Certificate image', 'credentials', { size: 'credential' }),
      later(str('issuer', 'Issuer')), later(date('issueDate', 'Issue date')), later(str('credentialId', 'Credential ID')), later(href('credentialUrl', 'Verify link')),
    ], { summary: '{{title}}' }),
    str('educationTitle', 'Education heading'),
    list('education', 'Education', [str('title', 'Title'), str('detail', 'Details')], { summary: '{{title}}' }),
  ] },
  { name: 'reviews', label: 'Reviews', icon: 'reviews', preview_path: 'reviews/', fields: [
    seo(), hero(),
    list('items', 'Reviews', reviewFields(), { summary: '{{name}} ({{rating}}★)' }),
    obj('fiverr', 'Fiverr box', [str('title', 'Title'), txt('text', 'Text'), button()]),
    obj('form', 'Review form', [bool('show', 'Show the form', { default: true }), ...['title', 'text', 'nameLabel', 'emailLabel', 'ratingLabel', 'messageLabel', 'allowLabel', 'submitLabel', 'success', 'ratingError', 'note'].map((k) => str(k, k))]),
  ] },
  { name: 'contact', label: 'Contact page', icon: 'contact_mail', preview_path: 'contact/', fields: [
    seo(), hero(), str('detailsTitle', 'Details heading'),
    obj('labels', 'Labels', ['whatsapp', 'email', 'address', 'hours', 'cv'].map((k) => str(k, k))),
    obj('cv', 'CV download', [bool('show', 'Show'), str('label', 'Text'), F('file', 'href', 'CV file', { media_folder: '/assets/files', public_folder: '/assets/files', accept: '.pdf' })]),
    obj('form', 'Contact form', ['title', 'text', 'nameLabel', 'emailLabel', 'messageLabel', 'submitLabel', 'whatsappLabel', 'success', 'error', 'note'].map((k) => str(k, k))),
  ] },
  { name: 'blog', label: 'Blog page', icon: 'article', preview_path: 'blog/', fields: [seo(), hero(), str('readMoreLabel', '"Read more" label'), str('backLabel', '"Back to blog" label'), str('byLabel', '"By" label')] },
  { name: 'faq', label: 'FAQ', icon: 'quiz', preview_path: 'faq/', fields: [
    seo(), hero(),
    list('groups', 'Groups', [str('title', 'Group title', { required: true }), later(icon()), faq('items', 'Questions')], { summary: '{{title}}' }),
  ] },
  { name: 'search', label: 'Search page', icon: 'search', preview_path: 'search/', fields: [
    seo(), hero(), str('placeholder', 'Search box placeholder'), str('buttonLabel', 'Button'),
    str('resultsLabel', 'Results text', { hint: '{n} = count, {q} = search words' }), str('noResults', 'No results text', { hint: '{q} = search words' }), str('loading', 'Loading text'), str('unavailable', 'Error text'),
  ] },
  { name: 'track', label: 'Order tracking page', icon: 'local_shipping', preview_path: 'track/', fields: [
    hidden('_help'), seo(), hero(),
    str('idLabel', 'Order ID label'), str('idHint', 'Order ID hint'), str('checkLabel', 'Phone or email label'), str('submitLabel', 'Button'),
    str('loading', 'Loading text'), str('notFound', 'Not found text'), str('unavailable', 'Tracking not available text'), str('tooMany', 'Too many tries text'),
    str('statusLabel', '"Status" label'), str('itemsLabel', '"Items" label'), str('totalLabel', '"Total" label'), str('noteLabel', '"Message from the seller" label'),
    str('historyTitle', 'History heading'), str('updatedLabel', '"Last update" label'), str('helpText', 'Help text above the WhatsApp link'),
    str('linkLabel', '"Track your order" link text', { hint: 'Shown after an order is sent, and in the order email.' }),
    list('statuses', 'Order statuses', [
      str('id', 'Status ID', { required: true, pattern: ['^[a-z0-9-]+$', 'Lowercase letters, numbers and dashes'], hint: 'Do not change the ID of a status that orders already use. "received" is the first status of every new order; "cancelled" is left out of the progress bar.' }),
      str('label', 'Name', { required: true }), str('text', 'What it means for the buyer'), icon('icon', 'Icon'),
    ], { summary: '{{label}} ({{id}})', min: 2, hint: 'In the order of the progress bar. You change the status of an order on arafatbin.com/admin/orders/.' }),
  ] },
  { name: 'terms', label: 'Terms and conditions', icon: 'gavel', preview_path: 'terms-and-conditions/', fields: legal() },
  { name: 'privacy', label: 'Privacy policy', icon: 'privacy_tip', preview_path: 'privacy-policy/', fields: legal() },
  { name: 'refund', label: 'Refund policy', icon: 'currency_exchange', preview_path: 'refund-policy/', fields: legal() },
  { name: '404', label: '404 (page not found)', icon: 'error', fields: [seo(), str('code', 'Big code text'), str('title', 'Title'), txt('text', 'Text'), buttons()] },
];

// ---- Products, services, blog ----
const variant = () => [
  str('id', 'Plan ID', { required: true, hint: 'Unique, e.g. P005-STD-1M. Never reuse an old ID.' }),
  str('name', 'Plan name', { required: true }),
  prices('prices', 'Price', 'USD is the main price. A currency with a rate (Settings → Payment methods) is worked out from USD; fill it here only if it has no rate.'),
  prices('compareAtPrices', 'Old price (shown crossed out)', 'Optional, for a sale. Rates apply here too.'),
  int('stock', 'Stock', { min: 0, default: 0, hint: '0 = sold out' }),
];
const statusField = () => sel('status', 'Status', [{ label: 'Live', value: '' }, { label: 'Draft (hidden from the site)', value: 'draft' }], { default: '', hint: 'Draft hides it from the site, the sitemap and search.' });
const productFields = [
  str('title', 'Product name', { required: true }), str('slug', 'URL slug', { required: true, pattern: ['^[a-z0-9]+(-[a-z0-9]+)*$', 'Lowercase letters, numbers and dashes'], hint: 'Page address: /shop/<slug>/. Changing it breaks old links.' }),
  str('id', 'Product ID', { required: true, hint: 'Unique, e.g. P006.' }), statusField(), paymentsOff('product'), str('category', 'Category', { required: true }), seo(),
  list('variants', 'Plans', variant(), { summary: '{{name}} ({{stock}} in stock)', hint: 'One plan = one price. Add more plans for options like 1 or 3 months.' }),
  images('images', 'Images', 'products', 'product'),
  txt('summary', 'Short summary', { required: true, hint: 'Shown on cards and under the title.' }), txt('about', 'About'), txtList('description', 'Description'),
  str('usageTitle', 'Usage heading'), txt('usageIntro', 'Usage intro'), strList('usage', 'Usage steps / rules'),
  list('features', 'Features', [icon(), str('text', 'Text')], { summary: '{{text}}' }),
  str('format', 'Format / delivery', { hint: 'e.g. Account details by email' }), faq(), list('reviews', 'Reviews of this product', reviewFields(), { summary: '{{name}}' }),
  link('externalLink', 'Outside link (e.g. Fiverr)', true),
  later(str('brand', 'Brand')), later(str('sku', 'SKU / MPN')), later(str('deliveryTime', 'Delivery time', { hint: 'e.g. Within 1 hour' })), later(str('warranty', 'Warranty')),
  later(str('badge', 'Badge', { hint: 'e.g. Best seller' })), later(bool('featured', 'Featured')), later(strList('highlights', 'Highlights')), later(str('videoUrl', 'Video link')),
  later(strList('tags', 'Tags')), later(obj('rating', 'Rating', [num('value', 'Average (1–5)', { min: 1, max: 5 }), int('count', 'Number of ratings', { min: 0 })])),
  later(F('relation', 'related', 'Related products', { collection: 'products', value_field: 'slug', display_fields: ['title'], search_fields: ['title'], multiple: true })),
];
const servicePackage = () => [
  str('name', 'Package name', { required: true }), prices('prices', 'Price', 'The first currency is shown on the page. A USD price adds the PayPal button.'),
  later(strList('features', 'Included')), later(str('deliveryTime', 'Delivery time')), later(int('revisions', 'Revisions', { min: 0 })), later(bool('popular', 'Most popular')),
];
const serviceFields = [
  str('title', 'Service name', { required: true }), str('slug', 'URL slug', { required: true, pattern: ['^[a-z0-9]+(-[a-z0-9]+)*$', 'Lowercase letters, numbers and dashes'], hint: 'Page address: /services/<slug>/' }),
  statusField(), paymentsOff('service'), str('category', 'Category', { required: true }), icon('icon', 'Icon', { required: true }), seo(),
  str('packagesTitle', 'Packages heading'), str('priceLabel', 'Price label', { hint: 'e.g. Starting from' }),
  list('packages', 'Packages', servicePackage(), { summary: '{{name}}', min: 1 }), images('images', 'Images', 'services', 'service'),
  txt('summary', 'Short summary', { required: true }), txt('about', 'About'), txtList('description', 'Description'),
  str('usageTitle', 'Steps heading'), txt('usageIntro', 'Steps intro'), strList('usage', 'Steps'),
  list('features', 'Features', [icon(), str('text', 'Text')], { summary: '{{text}}' }), faq(), buttons(),
  later(str('deliveryTime', 'Delivery time')), later(int('revisions', 'Revisions', { min: 0 })), later(bool('featured', 'Featured')), later(strList('highlights', 'Highlights')),
  later(str('videoUrl', 'Video link')), later(strList('tags', 'Tags')), later(images('portfolio', 'Portfolio samples', 'services', 'service')),
  later(F('relation', 'related', 'Related services', { collection: 'services', value_field: 'slug', display_fields: ['title'], multiple: true })),
];
const block = (name, label, fields) => ({ name, label, widget: 'object', fields });
const postFields = [
  str('title', 'Title', { required: true }), str('slug', 'URL slug', { required: true, pattern: ['^[a-z0-9]+(-[a-z0-9]+)*$', 'Lowercase letters, numbers and dashes'], hint: 'Page address: /blog/<slug>/' }),
  date('date', 'Date', { required: true, default: '{{now}}' }), str('author', 'Author', { default: 'Arafat Bin Wahahid' }), str('category', 'Category'), strList('tags', 'Tags'),
  txt('excerpt', 'Excerpt', { required: true, hint: 'One or two sentences for the blog list and Google.' }), seo({ article: true }),
  image('image', 'Cover image', 'blog', { size: 'blogCover' }), bool('draft', 'Draft (hidden from the site)'),
  F('list', 'content', 'Content', { types: [
    block('p', 'Paragraph', [txt('text', 'Text')]), block('h2', 'Heading', [str('text', 'Text')]), block('h3', 'Subheading', [str('text', 'Text')]),
    block('quote', 'Quote', [txt('text', 'Text')]), block('list', 'List', [bool('ordered', 'Numbered'), strList('items', 'Items')]),
    block('image', 'Image', [imgPath('src', 'Image', 'blog', { size: 'blogImage' }), str('alt', 'Alt text'), str('caption', 'Caption')]),
  ], hint: 'Add blocks and drag them into order.' }),
  later(date('updated', 'Updated on')), later(bool('featured', 'Featured')), later(txt('authorBio', 'Author bio')),
  later(F('relation', 'related', 'Related posts', { collection: 'blog', value_field: 'slug', display_fields: ['title'], multiple: true })),
];

// ---- Free tools (data/collections/tools.json) ----
const currencyCode = (name, label, o) => str(name, label, { pattern: ['^[A-Z]{3}$', 'Three capital letters, e.g. OMR'], hint: 'A code from Settings → Exchange rates', ...o });
const toolFields = [
  str('title', 'Tool name', { required: true }), str('slug', 'URL slug', { required: true, pattern: ['^[a-z0-9]+(-[a-z0-9]+)*$', 'Lowercase letters, numbers and dashes'], hint: 'Page address: /tools/<slug>/' }),
  sel('type', 'Tool type', [{ label: 'Website cost calculator', value: 'website-cost' }, { label: 'Currency converter', value: 'currency' }], { required: true, hint: 'Decides which tool the page shows. Each type has its own settings below.' }),
  statusField(), str('category', 'Category', { hint: 'e.g. Money, Business' }), icon('icon', 'Icon', { required: true }), seo(),
  txt('summary', 'Short summary', { required: true, hint: 'Shown on cards and under the title.' }),
  txtList('intro', 'Intro paragraphs'), strList('steps', 'How to use it (steps)'), faq(),
  obj('cta', 'Call to action under the tool', [str('title', 'Title'), txt('text', 'Text'), buttons()]),
  obj('calculator', 'Website cost calculator settings', [
    F('relation', 'service', 'Packages from this service', { collection: 'services', value_field: 'slug', display_fields: ['title'], required: true, hint: 'The packages and prices of this service are the starting choices.' }),
    currencyCode('currency', 'Prices are in', { required: true, default: 'OMR', hint: 'Every package of the service needs a price in this currency; the extras’ prices below are in it too. A code from Settings → Exchange rates.' }),
    list('extras', 'Extras', [
      str('id', 'ID', { required: true, pattern: ['^[a-z0-9-]+$', 'Lowercase letters, numbers and dashes'], hint: 'Short and unique, e.g. blog' }), str('name', 'Name', { required: true }),
      num('price', 'Price', { required: true, min: 0, step: 0.001, hint: 'In the currency chosen above' }),
      str('unit', 'Unit', { hint: 'e.g. page. Empty = a simple yes/no tick box; with a unit the visitor types a number.' }),
      int('max', 'Most the visitor can choose', { min: 1 }),
    ], { summary: '{{name}} ({{price}})' }),
    obj('labels', 'Texts', ['packageTitle', 'extrasTitle', 'currencyLabel', 'totalLabel', 'perLabel', 'noExtras', 'whatsappLabel'].map((k) => str(k, k, { required: true, hint: k === 'perLabel' ? '{unit} = the extra’s unit' : undefined }))
      .concat([txt('whatsappMessage', 'WhatsApp message', { required: true, hint: '{package}, {extras} and {total} are filled in' }), txt('note', 'Note under the price', { required: true, hint: '{currency} = the currency chosen above, {date} = rates date' })])),
  ], { hint: 'Only for the website cost calculator.' }),
  obj('converter', 'Currency converter settings', [
    currencyCode('from', 'Start with: from', { required: true }), currencyCode('to', 'Start with: to', { required: true }), num('amount', 'Start amount', { required: true, min: 0 }),
    list('pairs', 'Pair pages', [currencyCode('from', 'From', { required: true }), currencyCode('to', 'To', { required: true })], { summary: '{{from}} → {{to}}', hint: 'Each pair gets its own page for Google, e.g. /tools/currency-converter/usd-to-bdt/. The starting pair above is the main page, so it gets no second page.' }),
    F('list', 'amounts', 'Amounts in the quick tables', { field: { name: 'item', label: 'Amount', widget: 'number', value_type: 'float', min: 0.001 } }),
    obj('labels', 'Texts', ['amountLabel', 'fromLabel', 'toLabel', 'swapLabel', 'ownRateTitle', 'ownRateHint', 'banglaLabel', 'allTitle', 'wordsLabel', 'updatedLabel', 'tableTitle', 'otherTitle', 'pairTitle', 'pairText', 'pairDescription']
      .map((k) => str(k, k, { required: true, hint: k.startsWith('pair') || k === 'tableTitle' ? '{from}, {to}, {fromName} and {toName} are filled in' : undefined }))),
  ], { hint: 'Only for the currency converter. Rates are in Settings → Exchange rates.' }),
];

// ---- Global settings (data/global/*.json) ----
const method = () => [
  str('id', 'Method ID', { required: true, hint: 'e.g. omr-bank. Lowercase and dashes.' }), sel('type', 'Type', ['transfer', 'appointment'], { required: true }),
  bool('enabled', 'Show this method', { default: true }), str('name', 'Name', { required: true }), icon('icon', 'Icon', { required: true }), txt('intro', 'Intro'),
  str('paypalClientId', 'PayPal Client ID', { hint: 'Only for PayPal: the whole Live Client ID (about 80 characters). Never the Secret.' }),
  obj('fees', 'PayPal fees (added at checkout)', [
    num('percent', 'Fee % for receiving a payment', { min: 0, max: 50, step: 0.01, hint: 'From your PayPal fee page (Oman account), e.g. the PayPal Checkout or card rate.' }),
    num('internationalPercent', 'Extra % for buyers in another country', { min: 0, max: 50, step: 0.01, hint: 'Always added, because the site cannot know the buyer’s country.' }),
    num('fixed', 'Fixed fee per payment (USD)', { min: 0, step: 0.01 }),
    num('conversionPercent', 'Currency conversion % when you withdraw', { min: 0, max: 50, step: 0.01, hint: 'If PayPal converts USD to OMR when you withdraw to your bank. 0 = no conversion.' }),
  ], { hint: 'Only for PayPal. All 0 = no fee is added. The buyer pays price + fee, so after PayPal takes its fees you get the full USD price.' }),
  list('details', 'Payment details', [str('label', 'Label'), str('value', 'Value', { hint: 'Empty = hidden, customers are told to ask on WhatsApp.' })], { summary: '{{label}}: {{value}}' }),
  link('link', 'Pay button'), image('poster', 'Poster / QR code', 'payments', { size: 'poster' }),
  obj('location', 'Meeting place (appointments)', [str('name', 'Name'), str('address', 'Address'), str('mapQuery', 'Map location', { hint: 'Coordinates like 16.81,53.47 or a place name' })]),
  list('hours', 'Opening hours', [str('days', 'Days'), str('time', 'Time')], { summary: '{{days}} {{time}}' }),
  obj('timeRange', 'Allowed appointment times', [time('start', 'From'), time('end', 'To')]),
  strList('steps', 'How to pay (steps)'),
];
const globals = [
  { name: 'site', label: 'Site', icon: 'settings', fields: [
    str('name', 'Site name', { required: true }), str('title', 'Home page title', { required: true, hint: 'About 60 characters.' }), str('titleSeparator', 'Title separator'),
    txt('description', 'Default description', { required: true }), str('url', 'Site URL', { required: true, hint: 'No slash at the end' }),
    str('language', 'Language code', { hint: 'e.g. en' }), str('locale', 'Locale', { hint: 'e.g. en-US' }), str('currency', 'Default currency'),
    imgPath('defaultImage', 'Default share image', 'about', { size: 'share', hint: `Used when a page has no image of its own. ${imageHint('share')}` }), imgPath('favicon', 'Favicon', 'brand', { size: 'favicon' }), str('homeLabel', '"Home" in breadcrumbs'),
    obj('verification', 'Site verification codes', ['google', 'bing', 'yandex', 'pinterest', 'facebook', 'baidu'].map((k) => str(k, k, { hint: 'The code, or the whole <meta> tag' }))),
    obj('seo', 'SEO defaults', [str('author', 'Author'), str('twitterSite', 'X (Twitter) @username'), str('twitterCreator', 'X creator @username'), str('facebookAppId', 'Facebook App ID')]),
    str('clarityId', 'Microsoft Clarity project ID', { hint: 'Empty = off' }), str('googleAnalyticsId', 'Google Analytics ID', { hint: 'G-XXXXXXX. Empty = off' }),
    str('web3formsAccessKey', 'Web3Forms access key', { required: true }),
    obj('theme', 'Colours', [color('primary', 'Primary'), color('accent', 'Accent'), color('dark', 'Dark'), color('text', 'Text'), color('muted', 'Muted text'), color('background', 'Background'), color('soft', 'Soft background'), color('border', 'Border'), str('radius', 'Corner radius', { hint: 'e.g. 14px' })]),
    obj('person', 'About you (for Google)', [str('jobTitle', 'Job title'), str('worksFor', 'Works for'), str('locality', 'City'), str('region', 'Region'), str('country', 'Country code'), strList('knowsAbout', 'Knows about')]),
    obj('robots', 'robots.txt', [strList('allow', 'Allow'), strList('disallow', 'Disallow')]),
  ] },
  { name: 'header', label: 'Header', icon: 'top_panel_open', fields: [
    obj('logo', 'Logo', [str('text', 'Text', { required: true }), imgPath('image', 'Logo image', 'brand', { size: 'logo' }), href('href', 'Link')], { collapsed: false }),
    links('links', 'Top links (desktop)'), obj('search', 'Search icon', [str('label', 'Label'), href()], { hint: 'Clear both to hide the icon.' }), button('button', 'Header button'),
    obj('menu', '3-dot menu', [str('buttonLabel', 'Button label'), list('columns', 'Columns', [str('title', 'Title'), links('links', 'Links', true)], { summary: '{{title}}' })]),
  ] },
  { name: 'footer', label: 'Footer', icon: 'bottom_panel_open', fields: [
    txt('about', 'About text'), bool('showSocial', 'Show social icons'), list('columns', 'Columns', [str('title', 'Title'), links('links', 'Links')], { summary: '{{title}}' }),
    str('contactTitle', 'Contact heading'), str('copyright', 'Copyright', { hint: '{year} = current year' }), links('bottomLinks', 'Bottom links'),
    later(obj('newsletter', 'Newsletter box', [bool('show', 'Show'), str('title', 'Title'), str('text', 'Text'), str('placeholder', 'Email placeholder'), str('button', 'Button')])),
    obj('paymentMethods', 'Payment methods row', [
      bool('show', 'Show', { default: true }),
      str('label', 'Name for screen readers', { hint: 'e.g. Payment methods we accept' }),
      list('logos', 'Logos', [
        str('name', 'Name', { required: true, hint: 'e.g. PayPal. Shown in the tile until a logo is uploaded.' }),
        imgPath('image', 'Logo', 'payments', { size: 'payLogo' }),
      ], { summary: '{{name}}', thumbnail: 'image', hint: 'The tiles move slowly from right to left in the footer of every page. Drag to reorder.' }),
      obj('more', '"+200 more" button', [str('label', 'Text', { hint: 'e.g. +200 more' }), href('href', 'Link', { hint: 'e.g. /payments/ or /faq/' })]),
    ], { hint: 'Shown in the footer of every page, above the copyright line.' }),
  ] },
  { name: 'contact', label: 'Contact details', icon: 'call', fields: [
    str('whatsapp', 'WhatsApp number', { hint: 'Digits only with country code, e.g. 96892130528' }), str('whatsappDisplay', 'WhatsApp as shown'), bool('showFloatingWhatsapp', 'Floating WhatsApp button'),
    list('phones', 'Phone numbers', [str('label', 'Label'), str('display', 'As shown'), str('number', 'Number', { hint: 'With +country code' })], { summary: '{{label}}: {{display}}' }),
    str('email', 'Email', { type: 'email' }), str('address', 'Address'), str('mapUrl', 'Google Maps link'), str('hours', 'Hours'),
    later(list('businessHours', 'Opening hours by day', [str('day', 'Day'), time('open', 'Opens'), time('close', 'Closes'), bool('closed', 'Closed')], { summary: '{{day}}' })),
    later(str('responseTime', 'Usual reply time', { hint: 'e.g. Within 1 hour' })),
  ] },
  { name: 'social', label: 'Social links', icon: 'share', fields: [
    list('social', 'Links', [str('label', 'Name', { required: true }), href('url', 'Link', { required: true }), icon(), str('display', 'Text on the contact page')], { root: true, summary: '{{label}}' }),
  ] },
  { name: 'payments', label: 'Payment methods', icon: 'account_balance', fields: [
    hidden('_help'), sel('defaultCurrency', 'Default currency', CURRENCIES), str('orderPrefix', 'Order ID prefix', { hint: 'e.g. AB → AB-261021-XXXXX' }),
    list('currencies', 'Currencies', [
      str('code', 'Code', { required: true }), str('name', 'Name'),
      num('rate', 'Rate: 1 USD =', { min: 0, step: 0.0001, hint: 'Your own rate, e.g. 0.385 for OMR or 122 for BDT. With a rate, every product price in this currency is worked out from its USD price. 0 = use the prices written on each product.' }),
      num('roundTo', 'Round prices up to', { min: 0, step: 0.001, hint: 'e.g. 0.1 for OMR or 5 for BDT. 0 = the smallest coin. Always rounds up, never down.' }),
      list('methods', 'Methods', method(), { summary: '{{name}}' }),
    ], { summary: '{{code}} – {{name}}', collapsed: true }),
  ] },
  { name: 'rates', label: 'Exchange rates', icon: 'currency_exchange', fields: [
    hidden('_help'),
    date('updated', 'Rates updated on', { required: true, hint: 'Shown under the tools. Change it every time you update the rates.' }),
    txt('note', 'Note under the tools'),
    list('currencies', 'Currencies', [
      currencyCode('code', 'Code', { required: true, hint: 'e.g. BDT' }), str('name', 'Name', { required: true }),
      num('rate', 'Rate: 1 USD =', { required: true, min: 0.000001, step: 0.0001, hint: 'How much of this currency 1 US Dollar buys, above 0. USD itself must stay 1.' }),
      int('decimals', 'Decimals', { min: 0, max: 3, default: 2, hint: 'OMR and BHD use 3' }),
      str('unit', 'Name in words (one)', { hint: 'e.g. Rial Omani' }), str('units', 'Name in words (many)', { hint: 'e.g. Rials Omani' }),
      str('subunit', 'Small unit (one)', { hint: 'e.g. Baisa' }), str('subunits', 'Small unit (many)'), int('subunitPer', 'Small units in one', { min: 1, hint: 'e.g. 1000 Baisa in 1 Rial' }),
      bool('lakh', 'Use lakh and crore', { hint: 'For Taka: 1,00,000 and "one lakh"' }),
    ], { summary: '{{code}} – {{name}} ({{rate}})', required: true, min: 1, hint: 'Used by the currency converter and the website cost calculator. Each code once, USD always with rate 1. These are not the shop prices (those are in Payment methods).' }),
  ] },
  { name: 'sitemap', label: 'Sitemap', icon: 'account_tree', fields: [hidden('_help'), strList('urls', 'Links listed first in sitemap.xml', { hint: 'Every page is added automatically. Add extra links here, like the CV PDF.' })] },
  { name: 'icons', label: 'Icons', icon: 'interests', fields: [
    F('keyvalue', 'icons', 'Icons', { root: true, key_label: 'Name', value_label: 'SVG code (inside a 24×24 stroke icon)', hint: 'Add your own: paste the inner SVG code, e.g. <path d="…"/>. The name can then be chosen in every Icon field.' }),
  ] },
];

const draftFilter = [{ name: 'drafts', label: 'Drafts', field: 'status', pattern: 'draft' }];
// Page files in the order given; every page in data/pages/ must be in one of the groups (checked when the CMS is built)
const pagesIn = (names) => names.map((n) => {
  const p = pages.find((x) => x.name === n);
  if (!p) throw new Error(`templates/cms.js: no page "${n}"`);
  return file('pages')(p);
});
const file = (dir) => (p) => ({ ...p, file: `data/${dir}/${p.name}.json`, format: 'json', ...(p.preview_path !== undefined ? { preview_path: p.preview_path } : {}) });

export function cmsConfig() {
  return {
    backend: {
      name: 'github', repo: REPO, branch: 'main', auth_methods: ['token'],
      commit_messages: { create: 'Create {{collection}} “{{slug}}”', update: 'Update {{collection}} “{{slug}}”', delete: 'Delete {{collection}} “{{slug}}”', uploadMedia: 'Upload “{{path}}”', deleteMedia: 'Delete “{{path}}”' },
    },
    app_title: `${header.logo.text} CMS`,
    logo: { src: site.favicon },
    site_url: site.url,
    display_url: site.url.replace(/^https?:\/\//, ''),
    media_folder: 'assets/images', public_folder: '/assets/images',
    media_libraries: { default: { config: { slugify_filename: true, max_file_size: 15000000, transformations: { raster_image: { format: 'webp', quality: 85, width: 2000, height: 2000 } } } } },
    slug: { encoding: 'ascii', clean_accents: true },
    output: { omit_empty_optional_fields: false, json: { indent_size: 2 } },
    // Clean full-width forms: the preview pane only showed the raw data, "View on site" links stay
    editor: { preview: false },
    show_preview_links: true,
    collections: [
      { name: 'products', label: 'Products', label_singular: 'product', icon: 'shopping_bag', description: 'Things people buy in the shop. Prices, stock, plans, images and SEO for each product.', file: 'data/collections/products.json', format: 'json', identifier_field: 'title', summary: '{{title}} · {{category}}', thumbnail: 'images.0.src', view_filters: draftFilter, view_groups: [{ label: 'Category', field: 'category' }], preview_path: 'shop/{{fields.slug}}/', fields: productFields },
      { name: 'services', label: 'Services', label_singular: 'service', icon: 'design_services', description: 'Work people order on WhatsApp or pay for with PayPal: packages, prices, images and SEO.', file: 'data/collections/services.json', format: 'json', identifier_field: 'title', summary: '{{title}} · {{category}}', thumbnail: 'images.0.src', view_filters: draftFilter, preview_path: 'services/{{fields.slug}}/', fields: serviceFields },
      { name: 'tools', label: 'Free tools', label_singular: 'tool', icon: 'handyman', description: 'Website cost calculator and currency converter. Exchange rates are in Settings → Exchange rates.', file: 'data/collections/tools.json', format: 'json', identifier_field: 'title', summary: '{{title}}', thumbnail: false, view_filters: draftFilter, preview_path: 'tools/{{fields.slug}}/', fields: toolFields },
      { divider: true },
      { name: 'blog', label: 'Blog posts', label_singular: 'post', icon: 'edit_note', description: 'One file per post. Newest first.', folder: 'data/collections/blog', extension: 'json', format: 'json', identifier_field: 'title', slug: '{{fields.slug}}', summary: '{{title}} ({{date}})', thumbnail: 'image.src', sortable_fields: { fields: ['date', 'title'], default: { field: 'date', direction: 'descending' } }, view_filters: [{ name: 'drafts', label: 'Drafts', field: 'draft', pattern: true }], view_groups: [{ name: 'year', label: 'Year', field: 'date', pattern: '\\d{4}' }], preview_path: 'blog/{{fields.slug}}/', fields: postFields },
      { divider: true },
      { name: 'pages', label: 'Shop pages', icon: 'storefront', description: 'Home page and the shop, payment, services, tools and order tracking pages.', files: pagesIn(['home', 'shop', 'payments', 'services', 'tools', 'track']) },
      { name: 'about-pages', label: 'About me pages', icon: 'person', description: 'About, experience, skills, work, credentials and reviews.', files: pagesIn(['about', 'experience', 'skills', 'work', 'credentials', 'reviews']) },
      { name: 'help-pages', label: 'Help & legal pages', icon: 'help', description: 'Contact, FAQ, blog page, search, policies and the 404 page.', files: pagesIn(['contact', 'faq', 'blog', 'search', 'terms', 'privacy', 'refund', '404']) },
      { divider: true },
      { name: 'settings', label: 'Settings', icon: 'tune', description: 'Things on every page: site name and SEO, header, footer, contact details, payment methods, exchange rates, icons.', files: globals.map(file('global')) },
    ],
  };
}

// <title> and Sveltia CMS script for dist/admin/index.html (kept out of Google)
export const adminHtml = () => `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>${header.logo.text} CMS</title>
</head>
<body>
<script src="https://unpkg.com/@sveltia/cms@${CMS_VERSION}/dist/sveltia-cms.js"></script>
</body>
</html>
`;
