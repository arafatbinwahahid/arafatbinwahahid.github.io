# arafatbin.com — JAMstack static website

- **J**avaScript → **Astro** + `templates/*.js` (build করার সময় JSON থেকে HTML বানায়), `src/pages/api/` (Cloudflare-এ order tracking-এর ছোট server অংশ), `assets/js/main.js` (মেনু, ফর্ম), `assets/js/shop.js` (কার্ট, পেমেন্ট)
- **A**PI → `data/` ফোল্ডারের JSON ফাইল (সব লেখা, ছবি, আইকন, লিংক)
- **M**arkup → `dist/`-এ তৈরি হওয়া আসল HTML + `assets/css/style.css`

**SSG (Static Site Generation):** `npm run build` (Astro) চালালে প্রতিটি পেইজ আগে থেকেই পুরো লেখাসহ HTML ফাইল হয়ে যায়।
তাই Google বা অন্য search engine পেইজ খুললেই সব লেখা সরাসরি পায়, JavaScript চালাতে হয় না।
প্রতিটি পেইজে title, description, canonical, Open Graph, breadcrumb আর Schema.org (JSON-LD) ডাটা থাকে।
ছবির width/height নিজে থেকে বসে যায়, আর build প্রতিটি ছবির ছোট WebP কপি (400/800/1200/1600px) আর link preview-এর জন্য 1200px JPG বানায় (`sharp` package দিয়ে, GitHub-এ নিজে থেকে install হয়)। সাইটে শুধু এই ছোট কপিগুলো যায়, আসল বড় ছবি নয়। কোনো framework বা animation নেই, তাই সাইট খুব দ্রুত লোড হয়।

## File structure

```
├── astro.config.mjs         ← Astro: সাইট build করে (static পেইজ dist/client/-এ, API dist/server/-এ)
├── wrangler.jsonc           ← Cloudflare-এর সেটিং: database (D1), rate limit, 404 পেইজ
├── src/
│   ├── pages/[...path].astro ← সব পেইজ (templates/pages.js থেকে)
│   ├── pages/404.astro      ← 404 পেইজ
│   ├── pages/api/           ← Order tracking API: orders.js (নতুন অর্ডার), track.js (ক্রেতা দেখে), admin/orders.js (আপনি বদলান)
│   └── lib/orders.js        ← database, password আর যাচাইয়ের কোড
├── templates/
│   ├── astro-site.js        ← build-এর আগে JSON যাচাই, পরে sitemap, CMS, ছবি, search index
│   ├── build-steps.js       ← উপরের কাজগুলোর আসল কোড
│   ├── helpers.js           ← JSON লোড + ছোট HTML helper
│   ├── layout.js            ← <head> (SEO), header, 3-dot মেনু, footer
│   ├── pages.js             ← প্রতিটি পেইজের HTML
│   ├── webmcp.js            ← AI agent-এর tool (/webmcp.js) JSON থেকে বানায়
│   ├── cms.js               ← CMS-এর ফর্ম (/admin/config.yml বানায়)
│   ├── cms-check.js         ← প্রতিটি JSON ঘরের জন্য CMS-এ ফর্মের ঘর আছে কিনা দেখে
│   └── validate.js          ← build-এর আগে সব JSON ফাইল schemas/ দিয়ে যাচাই করে (ajv)
├── schemas/                 ← প্রতিটি JSON ফাইলের নিয়ম (কোন ঘর লাগবে, কী ধরনের মান)
├── .htmlvalidate.json       ← HTML যাচাইয়ের নিয়ম (html-validate)
├── linkinator.config.json   ← ভাঙা লিংক খোঁজার নিয়ম (linkinator)
├── assets/
│   ├── css/style.css        ← ডিজাইন (এখানে এডিট করুন; build নিজে ছোট করে প্রতিটি পেইজে বসায়)
│   ├── js/main.js           ← মেনু বন্ধ করা, Contact/Review ফর্ম, Web3Forms-এ পাঠানো
│   ├── js/shop.js           ← কার্ট, currency, gallery, quantity, পেমেন্ট ফর্ম (শুধু Shop ও Payment পেইজে)
│   ├── js/search.js         ← /search/ পেইজে খোঁজা (Pagefind)
│   ├── js/paypal.js         ← PayPal / কার্ডের বোতাম (Payment ও সার্ভিস পেইজ)
│   ├── js/service-pay.js    ← সার্ভিস প্যাকেজে PayPal পেমেন্ট
│   ├── js/track.js          ← /track/ পেইজে অর্ডারের অবস্থা দেখানো
│   ├── js/orders-admin.js   ← /admin/orders/ পেইজ (আপনার অর্ডার তালিকা)
│   ├── images/              ← সব ছবি, ফোল্ডারে ভাগ করা:
│   │   ├── brand/           ← লোগো
│   │   ├── products/        ← Shop-এর প্রোডাক্টের ছবি
│   │   ├── services/        ← সার্ভিসের ছবি
│   │   ├── payments/        ← পেমেন্টের poster / QR code
│   │   ├── about/           ← নিজের ছবি (About, Experience, Home)
│   │   ├── work/            ← Work পেইজের প্রজেক্ট
│   │   └── credentials/     ← সার্টিফিকেট
│   └── files/               ← CV (PDF)
├── CNAME                    ← arafatbin.com
├── .github/workflows/deploy.yml  ← main-এ push করলে build + পরীক্ষা + gh-pages ব্রাঞ্চে publish
│
└── data/                    ★ শুধু এই ফোল্ডার এডিট করবেন ★
    ├── global/              ← পুরো সাইটের common অংশ
    │   ├── site.json        ← সাইটের নাম, URL, SEO, রং (theme), Google Analytics, ফর্ম key, robots.txt, Google/Bing verification
    │   ├── header.json      ← লোগো, হেডার লিংক, WhatsApp বাটন, 3-dot মেনুর ২ কলাম
    │   ├── footer.json      ← ফুটারের লেখা, কলাম, কপিরাইট, নিচের লিংক
    │   ├── contact.json     ← WhatsApp, ফোন, ইমেইল, ঠিকানা, ম্যাপ
    │   ├── social.json      ← সোশ্যাল লিংক ও আইকন
    │   ├── sitemap.json     ← sitemap.xml-এ বাড়তি লিংক (বাকি সব নিজে যোগ হয়)
    │   ├── payments.json    ← currency (OMR/USD/BDT), পেমেন্ট মেথড, ব্যাংক/Send Money/PayPal/RedotPay তথ্য, poster, ম্যাপ, সময়
    │   ├── rates.json       ← ফ্রি টুলের exchange rate (1 USD = কত, প্রতিটি currency আলাদা, হাতে বসানো)
    │   └── icons.json       ← সব আইকন (নাম দিয়ে যেকোনো JSON-এ ব্যবহার করুন)
    │
    ├── pages/               ← প্রতিটি পেইজের লেখা
    │   ├── home.json        → /           (উপরে Shop + Service, নিচে বাকি section)
    │   ├── shop.json        → /shop/  (benefits, policy লিংক, কার্টের লেখা, নিচের queue CTA)
    │   ├── payments.json    → /payments/  (Payment পেইজ ও ফর্মের সব লেখা)
    │   ├── services.json    → /services/
    │   ├── tools.json       → /tools/  (Free tools পেইজের লেখা)
    │   ├── about.json       → /about/
    │   ├── experience.json  → /experience/
    │   ├── skills.json      → /skills/
    │   ├── work.json        → /work/
    │   ├── credentials.json → /credentials/
    │   ├── reviews.json     → /reviews/
    │   ├── contact.json     → /contact/
    │   ├── blog.json        → /blog/
    │   ├── terms.json       → /terms-and-conditions/
    │   ├── privacy.json     → /privacy-policy/
    │   ├── refund.json      → /refund-policy/
    │   ├── faq.json         → /faq/
    │   ├── track.json       → /track/  (Order tracking পেইজের লেখা আর অর্ডারের status)
    │   └── 404.json         → 404 error page
    │
    └── collections/         ← প্রতিটি আইটেমের নিজের পেইজ তৈরি হয়
        ├── products.json    → /shop/<slug>/  (দাম, stock, ছবি, about, usage, FAQ, review)
        ├── services.json    → /services/<slug>/
        ├── tools.json       → /tools/<slug>/  (Website cost calculator, Currency converter ও তার pair পেইজ)
        └── blog/*.json      → /blog/<slug>/   (প্রতিটি পোস্ট = একটি ফাইল)
```

`sitemap.xml` নিজে থেকে তৈরি হয়: সব পেইজ, প্রোডাক্ট, সার্ভিস, টুল ও ব্লগ পোস্টের লিংক স্বয়ংক্রিয়ভাবে যোগ হয়, কোনো তারিখ ছাড়া। `data/global/sitemap.json`-এ শুধু বাড়তি লিংক (যেমন CV-এর PDF) দিন। `robots.txt` তৈরি হয় `site.json` থেকে।

## কীভাবে এডিট করবেন

| কী বদলাবেন | কোন ফাইল |
| --- | --- |
| সাইটের রং | `data/global/site.json` → `theme` |
| হেডার মেনু / 3-dot মেনুর লিংক | `data/global/header.json` |
| ফুটার | `data/global/footer.json` |
| ফোন, ইমেইল, WhatsApp, ঠিকানা | `data/global/contact.json` |
| হোম পেইজের section-এর ক্রম | `data/pages/home.json` → `sections` (উপর-নিচ সরান, `"show": false` দিলে লুকাবে) |
| নতুন প্রোডাক্ট | `data/collections/products.json`-এ একটি `{ ... }` কপি করে নতুন `id` ও `slug` দিন |
| নতুন সার্ভিস | `data/collections/services.json` |
| ফ্রি টুলের লেখা, extras-এর দাম, currency pair | `data/collections/tools.json` (CMS: Free tools) |
| টুলের exchange rate | `data/global/rates.json` (CMS: Settings → Exchange rates) |
| নতুন ব্লগ পোস্ট | `data/collections/blog/`-এ একটি ফাইল কপি করুন, নাম ও `slug` বদলান |
| নতুন রিভিউ | `data/pages/reviews.json` → `items` |
| নতুন ছবি | ঠিক ফোল্ডারে রাখুন (যেমন `assets/images/products/`), JSON-এ লিখুন `"/assets/images/products/নাম.jpg"`। নাম ছোট হাতের ইংরেজি অক্ষরে, স্পেসের বদলে `-` দিন (যেমন `netflix-shared-account-1.jpg`); ছবি 2000px-এর চেয়ে বড় না হলেই ভালো |
| sitemap-এ বাড়তি লিংক (যেমন PDF) | `data/global/sitemap.json` → `urls` |
| নতুন আইকন | `data/global/icons.json`-এ SVG কোড যোগ করুন |
| কোনো পেমেন্ট মেথড বন্ধ | সব জায়গা থেকে: `data/global/payments.json` → মেথডের `"enabled": false` (CMS: Settings → Payment methods → Show this method)। শুধু একটা প্রোডাক্ট বা সার্ভিসের জন্য: তার `"paymentsOff"`-এ মেথডের id, যেমন `["usd-paypal"]` (CMS: Payment methods turned off)। কার্টে এমন প্রোডাক্ট থাকলে Payment পেইজে সেই মেথড আসে না, কোনো currency-র সব মেথড বন্ধ হলে currency-টাই লুকায়; সার্ভিসে PayPal বন্ধ করলে PayPal বোতাম আসে না |
| পেমেন্ট মেথডের চলমান লোগো সারি আর "+200 more" বোতাম | `data/global/footer.json` → `paymentMethods` (CMS: Settings → Footer → Payment methods row): প্রতিটি লোগোর নাম আর ছবি (ছবি না দিলে টাইলে নাম দেখায়), বোতামের লেখা আর লিংক। সব পেইজের ফুটারে, ধীরে ডান থেকে বামে সরে; "Reduce motion" চালু থাকলে থেমে থাকে |
| লোগো | `data/global/header.json` → `logo.image` (হেডার ও ফুটার), `data/global/site.json` → `favicon`। build নিজে চারপাশের সাদা অংশ কেটে ছোট কপি বানায় |

**বাটন:** `{ "label": "লেখা", "href": "/contact/", "style": "primary | outline | light", "icon": "wa" }`

**ব্লগ পোস্টের content:** `{ "type": "p", "text": "..." }`, `"h2"`, `"h3"`, `"quote"`,
`{ "type": "list", "items": ["..."] }`, `{ "type": "image", "src": "...", "alt": "...", "caption": "..." }`

**JSON নিয়ম:** লেখা সবসময় সোজা `"ডাবল কোট"`-এ দিন, ফোনের বাঁকা কোট `“ ”` নয় (iPhone-এ Settings → General → Keyboard → Smart Punctuation বন্ধ রাখুন)। শেষ আইটেমের পরে কমা দেবেন না। ভুল হলে build কোন ফাইলে সমস্যা তা বলে দেবে।

## Shop ও Payment

**প্রোডাক্ট (`data/collections/products.json`):**

| ঘর | কী |
| --- | --- |
| `id` | প্রতিটির আলাদা (যেমন `P005`), অর্ডার ইমেইলে এটা আসে |
| `prices` | তিন currency-তেই দাম দিতে হবে: `{ "OMR": 4.6, "USD": 12, "BDT": 1460 }` |
| `compareAtPrices` | (ঐচ্ছিক) আগের দাম, দিলে "Sale" ব্যাজ ও কাটা দাম দেখায় |
| `stock` | কয়টি বিক্রি করা যাবে। `0` দিলে "Sold out" |
| `variants` | (ঐচ্ছিক) একাধিক plan, প্রতিটির নিজের `id`, `name`, `prices`, `stock`। যেমন: `[{ "id": "P005-STD-1M", "name": "Standard · 1 Month", "prices": { "OMR": 2.3, "USD": 6, "BDT": 730 }, "stock": 3 }]`। দিলে উপরের `prices`/`stock` লাগবে না, পেইজে "Choose a plan" দেখায় আর কার্ডে "From" দাম |
| `seo` | (ঐচ্ছিক) `title`, `description`, `keywords`। `"titleSuffix": false` দিলে title-এর শেষে সাইটের নাম যোগ হয় না |
| `usageTitle`, `usageIntro` | (ঐচ্ছিক) "How to use" অংশের শিরোনাম আর শুরুর লাইন বদলাতে |
| `images` | এক বা একাধিক ছবি, একাধিক দিলে gallery হয় |
| `about`, `description`, `usage`, `features`, `format` | প্রোডাক্ট পেইজের অংশগুলো |
| `faq` | `[{ "q": "প্রশ্ন", "a": "উত্তর" }]` |
| `reviews` | আপনি নিজে যোগ করবেন: `[{ "name": "...", "rating": 5, "text": "...", "date": "October 2026" }]`। খালি থাকলে অংশটা দেখায় না |
| `externalLink` | (ঐচ্ছিক) যেমন Fiverr লিংক |

দাম বা stock ভুল হলে (যেমন কোনো currency-র দাম নেই) build থেমে যাবে আর কোন প্রোডাক্টে সমস্যা তা বলবে।

**পেমেন্ট (`data/global/payments.json`):** প্রতিটি currency-র নিচে তার মেথড। ব্যাংক নাম, account number, PayPal email, RedotPay ID ইত্যাদি `"value"`-তে লিখুন। খালি `"value"` সাইটে দেখায় না, তার বদলে "WhatsApp-এ জানতে চান" লেখা আসে, আর build লগে সতর্কবার্তা দেয়। `poster.src`-এ ছবির পথ দিলে poster দেখায়। Face to Face-এর জন্য `location.mapQuery` (যেমন `"16.8186958,53.4757235"`), `hours` (`[{ "days": "Saturday – Thursday", "time": "4 PM – 9 PM" }]`) আর `timeRange` (`{ "start": "16:00", "end": "21:00" }`) দিন। `"enabled": false` দিলে মেথড লুকাবে।

**অর্ডার যেভাবে কাজ করে:**
1. গ্রাহক কার্টে প্রোডাক্ট নেয়। দাম আর stock সবসময় JSON থেকে আসে, ব্রাউজারে সেভ করা ডাটা থেকে নয়। Payment পেইজে আর ফর্ম পাঠানোর ঠিক আগে stock আবার যাচাই হয়।
2. Payment পেইজে একটি Order ID তৈরি হয় (যেমন `AB-261020-K7Q2M`)। গ্রাহক currency ও মেথড বেছে পেমেন্ট করে, তারপর ফর্ম পাঠায়।
3. আপনার ইমেইলে (Web3Forms) আসে: Order ID, গ্রাহকের নাম/মোবাইল/ইমেইল, প্রতিটি প্রোডাক্টের নাম, ID, quantity, unit price, মোট, currency, মেথড, গ্রাহকের দেওয়া amount ও transaction নম্বর, পাঠানোর তারিখ ও সময়। Appointment হলে visit-এর তারিখ ও সময়।
4. **ফর্ম পাঠালেই অর্ডার paid নয়।** ইমেইলের Order ID আর amount আপনার ব্যাংক/PayPal/RedotPay-এর সাথে মিলিয়ে নিজে যাচাই করুন, তারপর গ্রাহককে জানান।
5. **Stock কমানো:** পেমেন্ট যাচাই হওয়ার পর `products.json`-এ ওই প্রোডাক্টের `stock` নিজে কমিয়ে দিন। সাইট নিজে stock কমায় না, কারণ GitHub Pages-এ কোনো server বা database নেই।

**নিরাপত্তা:** এটা static সাইট, তাই ব্রাউজারের যাচাই কেউ চাইলে এড়িয়ে যেতে পারে। সেজন্য আসল যাচাই হলো ধাপ ৪-এর হাতে মিলিয়ে দেখা। Web3Forms-এর access key ব্রাউজারে থাকতেই হয়। এটা গোপন password নয়, এটা দিয়ে শুধু আপনার ইমেইলে ফর্ম পাঠানো যায়। spam বাড়লে Web3Forms dashboard থেকে key বদলে `site.json`-এ নতুনটা দিন। কোনো password বা ব্যাংকের গোপন তথ্য JSON-এ রাখবেন না, কারণ JSON-এর সবকিছু public।

## Free tools (`/tools/`)

হেডার, 3-dot মেনু, ফুটার আর হোম পেইজে (Shop ও Services-এর পরে) "Free tools"। সব হিসাব ভিজিটরের ফোনেই হয়, কোনো API বা বাইরের সার্ভিস লাগে না, তাই পেইজ দ্রুত।

**Website cost calculator (`/tools/website-cost-calculator/`):** প্যাকেজ আর দাম আসে `tools.json` → `calculator.service`-এ দেওয়া সার্ভিসের (`web-development`) প্যাকেজ থেকে, তাই সার্ভিসের দাম বদলালে এখানেও বদলায়। `calculator.currency` (এখন OMR): সার্ভিসের প্রতিটি প্যাকেজে এই currency-র দাম থাকতে হবে, না থাকলে build জানিয়ে দেয়। বাড়তি কাজ (extra pages, blog, payment …) `calculator.extras`-এ: `name`, `price` (ওই currency-তে), আর সংখ্যা নিতে চাইলে `unit` (যেমন `"page"`) ও `max`। ভিজিটর currency বদলালে `rates.json` দিয়ে হিসাব হয়। "Send this quote on WhatsApp" বোতামে প্যাকেজ, extras আর মোট দাম লেখা থাকে (`labels.whatsappMessage`, `{package}` `{extras}` `{total}`)।

**Currency converter (`/tools/currency-converter/`):** rate `data/global/rates.json`-এ, প্রতিটি currency-র `"rate"` = 1 USD-তে কত (যেমন OMR `0.3845`, BDT `122`); যেকোনো দুই currency-র হিসাব USD দিয়ে হয়। `"updated"`-এ তারিখ দিন, পেইজে দেখায়। `decimals` (OMR/BHD 3), কথায় লেখার জন্য `unit`/`units`/`subunit`/`subunits`/`subunitPer` (Rial Omani / Baisa 1000), আর `"lakh": true` দিলে লাখ-কোটি (BDT)। `converter.pairs`-এর প্রতিটি জোড়ার নিজের পেইজ হয় (যেমন `/tools/currency-converter/usd-to-bdt/`), Google-এ "USD to BDT" খুঁজলে আসার জন্য; শুরুর জোড়া (`from`/`to`, এখন OMR → BDT) মূল converter পেইজটাই, তাই তার আলাদা পেইজ হয় না; `amounts` = সেই পেইজের টেবিলের অঙ্ক। ভিজিটর চাইলে নিজের rate বসাতে পারেন (শুধু তাঁর ফোনে)। নতুন currency যোগ করতে `rates.json`-এ যোগ করুন, সব টুলে নিজে আসে।

**নতুন টুল:** এখন দুই ধরনের (`type`: `website-cost`, `currency`)। `"status": "draft"` দিলে টুল সাইট, sitemap, search আর হোম থেকে লুকায়। অন্য ধরনের টুল (যেমন image converter) বানাতে নতুন কোড লাগবে।

## CMS: arafatbin.com/admin/ (Sveltia CMS)


**Draft আর Publish (অনেক কিছু বদলে একবারে সাইট আপডেট):**
- CMS-এ **Save** করলে পরিবর্তন সাইটে যায় না, `cms-drafts` ব্রাঞ্চে **draft** হিসেবে জমা থাকে। যত খুশি প্রোডাক্ট, সার্ভিস, পেইজ আর Settings বদলান; কোনো build হয় না।
- প্রতিটি Save-এর পর GitHub নিজে (ফ্রি) পুরো build আর পরীক্ষা চালায়।
- সব শেষ হলে **arafatbin.com/admin/publish/** খুলুন (CMS-এর একই GitHub token): কোন কোন save অপেক্ষায় আছে, আর পরীক্ষার ফল দেখায়। ✓ পাস করলে **Publish all** চাপুন: সব draft একসাথে `main`-এ যায়, Cloudflare **একবার** build করে (৩–৫ মিনিট)।
- পরীক্ষায় ভুল পেলে Publish বোতাম বন্ধ থাকে আর ঠিক কোন ফাইলের কোন ঘরে সমস্যা তা লেখা থাকে। CMS-এ ঠিক করে আবার Save করুন।
- **Discard all drafts** = এখনো publish না করা সব পরিবর্তন বাদ।
- প্রথমবার: Publish পেইজে **Create the drafts branch** একবার চাপুন, তারপর CMS খুলবে।
- Cloudflare-এর build মিনিট বাঁচাতে: Worker → Settings → Build → **Branch control → Builds for non-production branches বন্ধ করুন** (draft-এর পরীক্ষা GitHub-ই করে)।
- CMS-এর প্রতিটি ঘর build-এর নিয়ম (`schemas/`) নিজে পড়ে নেয়: আবশ্যক ঘর খালি, ভুল ফরম্যাট (ID, ইমেইল, ফোন, লিংক), সীমার বাইরের সংখ্যা থাকলে CMS Save করতে দেয় না। যেসব নিয়ম একাধিক ফাইল মিলিয়ে দেখতে হয় (যেমন প্রতিটি currency-তে দাম, একই ID দুবার), সেগুলো Publish পেইজের পরীক্ষায় ধরা পড়ে।

JSON হাতে না লিখে ফর্মে লিখুন। বাম মেনুতে **Products, Services, Free tools**, **Blog posts**, পেইজগুলো তিন ভাগে (**Shop pages**, **About me pages**, **Help & legal pages**) আর **Settings** (Site, Header, Footer, Contact details, Social links, Payment methods, Exchange rates, Sitemap, Icons)। প্রোডাক্ট আর সার্ভিসের তালিকায় ছবি দেখায়, **Drafts** filter আর category অনুযায়ী ভাগ আছে। প্রতিটি ফর্মের উপরে **🔍 SEO** অংশ। Save করলে main ব্রাঞ্চে commit হয়, ৩–৫ মিনিটে সাইট আপডেট হয় (আগের মতো সব পরীক্ষা চলে, ভুল থাকলে পুরোনো সাইট থাকে)।

**প্রথমবার লগইন (Access Token):**
1. GitHub → Settings → Developer settings → Personal access tokens → **Fine-grained tokens** → Generate new token
2. Token name: `arafatbin CMS`, Expiration: যেমন ৯০ দিন
3. Repository access: **Only select repositories** → `arafatbinwahahid.github.io`
4. Permissions → Repository permissions → **Contents: Read and write** (Metadata নিজে Read-only হয়)
5. Generate token → কপি করুন → arafatbin.com/admin/ → **Sign In Using Access Token** → paste
6. Token কাউকে দেবেন না, repo-তে রাখবেন না। মেয়াদ শেষ হলে নতুন বানান। ফাঁস হলে GitHub থেকে সাথে সাথে মুছুন।

**জানা দরকার:**
- প্রতিটি ছবির ঘরে **📐 Best size** লেখা থাকে: কত px আর কোন অনুপাতে (যেমন প্রোডাক্ট 1200 × 900, share image 1200 × 630), আর সাইটের কোথায় দেখাবে।
- ছবি আপলোড করলে নিজে WebP হয় (সর্বোচ্চ 2000px), নাম ছোট হাতের হয়, আর ঠিক ফোল্ডারে যায় (products, services, blog …)।
- **Status → Draft** দিলে প্রোডাক্ট/সার্ভিস/টুল সাইট, sitemap আর search থেকে লুকায়।
- "Saved for later" লেখা ঘরগুলো এখন সাইটে দেখায় না, পরে কাজে লাগানোর জন্য রাখা।
- Icon ঘরে Settings → Icons-এর সব আইকন থেকে বাছা যায়; নতুন আইকন সেখানে যোগ করলে সব জায়গায় পাওয়া যায়।
- CMS ফর্ম `templates/cms.js`-এ। কোনো JSON-এ নতুন ঘর যোগ করলে সেখানেও যোগ করতে হয়, নাহলে build জানিয়ে দেয় (CMS save করলে সেই ঘর মুছে যেত)।

## SEO: প্রতিটি পেইজের সব tag

প্রতিটি পেইজ (`data/pages/*.json`), প্রোডাক্ট, সার্ভিস আর ব্লগ পোস্টে একটি `"seo"` অংশ আছে। **যে ঘর খালি (`""`, `[]`) রাখবেন, build নিজে সেটা বসিয়ে নেবে।**

| ঘর | কোন tag | কখন দেবেন |
|---|---|---|
| `title`, `titleSuffix` | `<title>`, og:title, twitter:title | title ৬০ অক্ষরের মধ্যে; `false` দিলে " \| Arafat Bin Wahahid" যোগ হবে না |
| `description` | meta description, og/twitter description | ৭০–১৫৫ অক্ষর |
| `keywords` | meta keywords | ইচ্ছা হলে (Google এটা দেখে না, Bing অল্প দেখে) |
| `canonical` | `<link rel="canonical">` | শুধু যখন এই পেইজটা অন্য কোনো URL-এর কপি |
| `image`, `imageAlt` | og:image, twitter:image (+ alt) | Facebook/WhatsApp-এ শেয়ার করলে যে ছবি আসবে |
| `author` | meta author | খালি = `site.json` → `seo.author` |
| `robots.index` / `follow` | robots noindex / nofollow | `false` দিলে Google-এ দেখাবে না, sitemap থেকেও বাদ যাবে |
| `robots.nosnippet`, `noimageindex`, `notranslate`, `indexifembedded` | robots | Google-এর বিশেষ নিয়ম, `true` দিলে চালু |
| `robots.maxSnippet`, `maxImagePreview`, `maxVideoPreview` | max-snippet, max-image-preview, max-video-preview | `-1` = সীমা নেই; ছবি `none`/`standard`/`large` |
| `robots.unavailableAfter` | unavailable_after | এই তারিখের পর Google পেইজটা সরিয়ে দেবে, যেমন `"2027-12-31"` |
| `googlebot`, `bingbot` | শুধু Google বা Bing-এর জন্য নিয়ম | যেমন `"nosnippet"` |
| `openGraph.type`, `title`, `description`, `localeAlternate` | og:* | Facebook-এ আলাদা লেখা দেখাতে চাইলে |
| `twitter.card`, `title`, `description`, `creator` | twitter:* | X-এ আলাদা লেখা বা `@username` |
| `article.*` (ব্লগ) | article:published_time, modified_time, section, tag | খালি = পোস্টের তারিখ, category, tags |
| `alternates` | hreflang | অন্য ভাষার সংস্করণ থাকলে: `[{ "hreflang": "bn", "href": "/bn/about/" }]` |
| `schema` | বাড়তি JSON-LD | schema.org-এর যেকোনো object, স্বয়ংক্রিয়গুলোর পাশে যোগ হয় |
| `meta` | অন্য যেকোনো meta tag | `[{ "name": "rating", "content": "adult" }]` বা `[{ "property": "...", "content": "..." }]` |

পুরো সাইটের জন্য `data/global/site.json`:
- `seo`: author, X (Twitter) `@username`, Facebook App ID
- `verification`: Google, Bing, Yandex, Pinterest, Facebook, Baidu-র কোড (শুধু কোড বা পুরো `<meta>` লাইন, দুটোই চলে)

## বাইরের সার্ভিস (সব ঐচ্ছিক, খালি রাখলে বন্ধ)

**Microsoft Clarity (heatmap ও session recording):** clarity.microsoft.com-এ project খুলুন → Settings → Overview থেকে Project ID নিন → `site.json` → `"clarityId"`। Google Analytics-এর মতোই প্রথম tap/scroll-এর পর লোড হয়, তাই সাইট ধীর হয় না। ফর্মে লেখা কিছু রেকর্ড হয় না।

**PayPal বোতাম (PayPal ও কার্ডে সরাসরি পেমেন্ট):** developer.paypal.com → Apps & Credentials → **Live** → Create App → Client ID কপি করুন → `payments.json`-এ PayPal মেথডের `"paypalClientId"`-তে দিন। তখন Payment পেইজে PayPal/কার্ডের বোতাম আসে; পেমেন্ট হলে অর্ডার (PayPal order ID সহ) Web3Forms-এ নিজে চলে আসে। Client ID থাকলে PayPal প্যানেলে কোনো ফর্ম থাকে না, ক্রেতার নাম ও email PayPal থেকে আসে। সার্ভিসের যে প্যাকেজে `"USD"` দাম আছে (`services.json` → `packages` → `prices`), সেখানে "Order on WhatsApp"-এর পাশে "Pay … with PayPal or card" বোতাম আসে; লেখা `data/pages/services.json` → `paypal`। PayPal শুধু USD-তে (OMR/BDT PayPal সমর্থন করে না)। ডেলিভারির আগে PayPal account-এ টাকা এসেছে কিনা দেখে নিন। Client ID গোপন নয়, কিন্তু **Secret কখনো কোথাও দেবেন না।**

**নিজের exchange rate (দেশ/currency অনুযায়ী):** `payments.json` → প্রতিটি currency-তে `"rate"` (1 USD = কত, যেমন OMR `0.385`, BDT `122`) আর `"roundTo"` (দাম কত ধাপে উপরের দিকে রাউন্ড হবে, যেমন OMR `0.1`, BDT `5`)। rate দিলে সেই currency-র সব প্রোডাক্টের দাম USD দাম থেকে নিজে হিসাব হয় (প্রোডাক্টে হাতে লেখা দাম তখন বাদ), সবসময় উপরের দিকে রাউন্ড, তাই কখনো কম না। `0` = প্রতিটি প্রোডাক্টে হাতে লেখা দাম। সার্ভিসের প্যাকেজে USD দাম না থাকলে rate দিয়ে USD বের হয় (PayPal বোতামের জন্য)। CMS: Settings → Payment methods → Currencies।

**PayPal fee ক্রেতার দামে যোগ (যাতে পুরো USD দাম আপনার কাছে আসে):** `payments.json` → PayPal মেথড → `"fees"`: `percent` (পেমেন্ট নেওয়ার %), `internationalPercent` (অন্য দেশের ক্রেতার বাড়তি %, সবসময় ধরা হয় কারণ সাইট ক্রেতার দেশ জানে না), `fixed` (প্রতি পেমেন্টে USD), `conversionPercent` (withdraw-এর সময় USD → OMR conversion-এর %)। হিসাব: `মোট = (দাম ÷ (1 − conversion%) + fixed) ÷ (1 − percent − internationalPercent)`, সেন্টে উপরের দিকে রাউন্ড। Payment পেইজে "PayPal fee" আলাদা লাইনে দেখায়, PayPal receipt-এও আলাদা লাইন, সার্ভিসের বোতামে মোট দাম। সংখ্যাগুলো **আপনার ওমান PayPal account-এর fee পেইজ** থেকে নিন (US-এর fee আলাদা)। সব `0` = কোনো fee যোগ হয় না। প্রতিটি PayPal পেমেন্টের ইমেইলে PayPal-এর আসল হিসাবও আসে: **PayPal fee charged**, **PayPal fee %**, **You received (net)**, আর currency বদল হলে **Exchange rate used**। কয়েকটা পেমেন্টের পর সেই % দেখে `fees` ঠিক করুন।

**Site search (Pagefind):** কিছু করতে হয় না। build প্রতিবার সব পেইজের লেখা থেকে খোঁজার index বানায়, `/search/` পেইজে খোঁজা যায়, হেডারে 🔍 আইকন। লেখা `data/pages/search.json`-এ। হেডার থেকে সরাতে `header.json` থেকে `"search"` মুছুন।

**Cloudflare (দ্রুত, cache, নিরাপত্তা):** কোডে কিছু লাগে না, ডোমেইনের সেটিং:
1. cloudflare.com-এ ফ্রি account → Add site → `arafatbin.com` → Free plan।
2. Cloudflare যে ২টি nameserver দেবে, ডোমেইন যেখান থেকে কিনেছেন সেখানে বসান (আগের DNS record Cloudflare নিজে কপি করে; GitHub Pages-এর A/CNAME record আছে কিনা মিলিয়ে নিন)।
3. SSL/TLS → **Full**। Speed → **Rocket Loader বন্ধ** রাখুন (ফর্ম ও কার্টের JS-এ সমস্যা করতে পারে)। Scrape Shield → **Email Obfuscation বন্ধ**।
4. Caching → Cache Rules → নতুন rule: URI Path starts with `/assets/` → Eligible for cache, Edge TTL ১ মাস, Browser TTL ১ মাস। ছবি আর JS-এর নামে ফিঙ্গারপ্রিন্ট আছে (যেমন `main.js?v=1a2b3c4d`), তাই বদলালে নতুন URL হয়, পুরোনোটা আটকে থাকে না।
5. HTML পেইজ cache করবেন না (সাধারণ সেটিং-এ করে না), তাহলে publish-এর সাথে সাথে নতুন লেখা আসবে।

## AI agent-এর জন্য WebMCP (`/webmcp.js`)

build প্রতিবার `data/`-এর JSON থেকে নিজে `dist/webmcp.js` বানায়, এটা হাতে এডিট করতে হয় না। নতুন প্রোডাক্ট, সার্ভিস, টুল বা পেইজ যোগ করলে এতেও নিজে যোগ হয়।
যে browser WebMCP চেনে (`document.modelContext`), শুধু সেখানেই ফাইলটা লোড হয়, তাই সাধারণ ভিজিটরের সাইট একটুও ধীর হয় না।
AI agent এই tool-গুলো ব্যবহার করতে পারে:

| Tool | কাজ |
|---|---|
| `get-site-info` | সাইট, যোগাযোগ, currency, পেমেন্ট মেথড, ফ্রি টুল, পেইজের তালিকা |
| `list-products` / `get-product` | প্রোডাক্ট, প্ল্যান, দাম, stock, FAQ |
| `list-services` / `get-service` | সার্ভিস, প্যাকেজ, দাম, FAQ |
| `search-site` | প্রোডাক্ট, সার্ভিস, টুল, পেইজ ও FAQ-তে খোঁজা |
| `get-cart` / `add-to-cart` | ভিজিটরের কার্ট দেখা ও যোগ করা (stock-এর বেশি নয়; পেমেন্ট ভিজিটর নিজে করেন) |
| `whatsapp-link` | লেখা-সহ WhatsApp লিংক বানানো (নিজে কিছু পাঠায় না) |
| `convert-currency` | `rates.json`-এর rate দিয়ে currency বদল, সাইটের converter-এর মতো একই হিসাব (Currency converter টুল থাকলেই) |

কোডটা আছে `templates/webmcp.js`-এ।

## Order tracking (`/track/`)

- ক্রেতা checkout করলে (ফর্ম বা PayPal) অর্ডার নিজে থেকে Cloudflare-এর database-এ save হয়, status **Order received**। Thank-you বক্সে "Track your order" বোতাম আসে, আর অর্ডারের ইমেইলেও tracking লিংক থাকে।
- ক্রেতা `/track/`-এ Order ID আর ফোনের শেষ ৪ সংখ্যা (বা ইমেইল) দিয়ে অবস্থা দেখেন: status, progress bar, items, total, আপনার message আর পুরো history। নাম, ফোন, ইমেইল কখনো দেখায় না। এক মিনিটে ১৫ বারের বেশি চেষ্টা করলে আটকে দেয়, তাই অন্যের অর্ডার আন্দাজে খোঁজা যায় না।
- **আপনি:** `arafatbin.com/admin/orders/` → `ADMIN_PASSWORD` দিয়ে খুলুন। সব অর্ডার দেখুন, খুঁজুন, status বদলান (Payment confirmed, Working on it, Delivered, Cancelled), history-তে নোট আর ক্রেতার জন্য message লিখুন, অর্ডার মুছুন। WhatsApp-এ আসা অর্ডারের জন্য **New order** দিয়ে নিজে অর্ডার বানান, তারপর "Send the link on WhatsApp" দিয়ে ক্রেতাকে tracking লিংক পাঠান।
- লেখা আর status-এর নাম: CMS → **Shop pages → Order tracking page**। নতুন status যোগ করা যায়; যে status-এর ID অর্ডারে ব্যবহার হচ্ছে তার ID বদলাবেন না।
- মেনু আর ফুটারে "Track order" লিংক আছে।

## Live chat (tawk.to, ফ্রি)

1. tawk.to-তে ফ্রি account খুলুন, website হিসেবে arafatbin.com দিন।
2. **Administration → Chat Widget** → "Direct Chat Link" কপি করুন: `https://tawk.to/chat/PROPERTY_ID/WIDGET_ID`।
3. CMS → **Settings → Contact details → Live chat**: Property ID আর Widget ID বসান। খালি = বন্ধ।
4. ফোনে tawk.to অ্যাপ নামিয়ে login করুন, নতুন মেসেজ এলে notification আসবে।

সবুজ WhatsApp বোতামের উপরে নীল chat বোতাম আসে। Chat-এর script শুধু বোতাম চাপলে লোড হয়, তাই সাইট ধীর হয় না। একবার chat করলে পরের পেইজগুলোতে conversation খোলা থাকে।

## Cloudflare-এর ফ্রি সুবিধা

| সুবিধা | কী করে | কীভাবে চালু |
| --- | --- | --- |
| **Web Analytics** | কত ভিজিটর, কোন পেইজ, কোন দেশ, কোন ডিভাইস; cookie ছাড়া | Cloudflare → Analytics & Logs → **Web Analytics → Add a site** → snippet থেকে `token` কপি করুন → CMS → Settings → Site → **Cloudflare Web Analytics token** |
| **Cache আর security header** | ছবি আর JS ব্রাউজারে ১ বছর থাকে (নাম বদলালে নতুনটা আসে), পেইজ সবসময় নতুন; clickjacking ও অন্য আক্রমণ থেকে সুরক্ষা | নিজে থেকেই (`dist/client/_headers`, `templates/build-steps.js`) |
| **ছবি ছোট করা** | build প্রতিটি ছবির ছোট WebP কপি বানায়, তাই Cloudflare-এর টাকার Polish/Images লাগে না | নিজে থেকেই |
| **Order database (D1)** আর **rate limit** | order tracking, আন্দাজে খোঁজা আর spam আটকানো | প্রথম deploy-এ নিজে থেকেই |
| **Email Routing** | `contact@arafatbin.com`-এ আসা ইমেইল আপনার Gmail-এ পাঠায় | domain Cloudflare-এ আসার পর → Email → Email Routing → Enable (ঐচ্ছিক) |
| **Always HTTPS, DDoS সুরক্ষা, CDN** | সাইট দ্রুত আর নিরাপদ | domain Cloudflare-এ এলেই |

## দ্রুত লোডের জন্য যা নিজে হয়

- CSS প্রতিটি পেইজের `<head>`-এ ছোট করে বসানো থাকে, আলাদা ফাইল লোড করতে হয় না
- JS থেকে comment ও ফাঁকা জায়গা বাদ যায়
- প্রথম ছবি আগে লোড হয়, বাকিগুলো স্ক্রল করলে
- Google Analytics প্রথম tap/scroll-এ বা পেইজ লোডের 3.5 সেকেন্ড পরে লোড হয়

## স্বয়ংক্রিয় পরীক্ষা

প্রতিটি push আর Pull Request-এ GitHub নিজে তিনটি পরীক্ষা চালায়। কোনোটা ব্যর্থ হলে সাইট deploy হয় না, তাই ভাঙা সাইট লাইভে যায় না।

| টুল | কী ধরে | কোথায় দেখবেন |
| --- | --- | --- |
| **ajv** | JSON-এর ভুল: ঘরের নামে বানান ভুল (`"prise"`), বাদ পড়া ঘর, সংখ্যার জায়গায় লেখা (`"stock": "5"`), ভুল ছবির পথ, ভুল বাটন style | build লগে, যেমন: `data/collections/products.json › [netflix-shared-profile] › variants › 1: unknown field "prise"` |
| **html-validate** | ভুল HTML (ভাঙা attribute, ভুল ক্রম ইত্যাদি) | `npm test` লগে |
| **linkinator** | সাইটের ভেতরের ভাঙা লিংক আর হারানো ছবি বা ফাইল | `npm test` লগে, যেমন `[404] dist/experiance/` |

Pull Request-এ লাল ❌ দেখালে **Details**-এ গিয়ে লগ দেখুন। লম্বা title (৭০ অক্ষরের বেশি) শুধু সতর্কবার্তা দেয়, deploy আটকায় না। বাইরের সাইটের লিংক (WhatsApp, Fiverr ইত্যাদি) পরীক্ষা করা হয় না, কারণ ওই সাইটগুলো প্রায়ই স্বয়ংক্রিয় পরীক্ষা আটকে দেয়।

## চালানো ও publish (Cloudflare)

```bash
npm install              # একবার
npm run build            # dist/ তৈরি: dist/client/ = static পেইজ, dist/server/ = API
npm run preview          # Cloudflare-এর মতো করে http://localhost:8787 এ দেখুন (order tracking-সহ)
npm run check            # build + HTML যাচাই + ভাঙা লিংক খোঁজা
```

লোকালি order admin পরীক্ষা করতে প্রজেক্টের ফোল্ডারে `.dev.vars` ফাইল বানান, ভেতরে `ADMIN_PASSWORD=যেকোনো-পাসওয়ার্ড` (এই ফাইল git-এ যায় না)।

**Cloudflare-এ প্রথমবার সেট করা (একবারই, সব ফ্রি):**
1. dash.cloudflare.com-এ ফ্রি account খুলুন।
2. **Workers & Pages → Create → Import a repository** → GitHub connect করুন → `arafatbinwahahid.github.io` বাছুন।
3. Build settings: **Build command** = `npm run build`, **Deploy command** = `npx wrangler deploy` (সাধারণত নিজে থেকেই থাকে)। Save and Deploy।
   প্রথম deploy-এ Cloudflare নিজে order database (D1) বানিয়ে নেয়, কোনো ID লিখতে হয় না।
4. **Settings → Variables and Secrets → Add → Type: Secret**, নাম `ADMIN_PASSWORD`, মান একটা শক্ত পাসওয়ার্ড। এটা দিয়ে `/admin/orders/` খোলে। এই পাসওয়ার্ড কোথাও লিখবেন না, কাউকে দেবেন না।
5. **Settings → Domains & Routes → Add → Custom domain** → `arafatbin.com` (domain Cloudflare-এ যোগ করতে বলবে: Cloudflare যে দুটো nameserver দেয়, domain যেখানে কিনেছেন সেখানে বসান)। চাইলে `www.arafatbin.com`-ও যোগ করুন।
6. Domain Cloudflare-এ চলে এলে GitHub-এ **Settings → Pages**-এ GitHub Pages বন্ধ করতে পারেন, আর `.github/workflows/deploy.yml`-এর "Publish to gh-pages" ধাপ মুছে দিতে পারেন (তখন GitHub শুধু পরীক্ষা চালাবে)।

এরপর `main`-এ প্রতিটি push বা CMS save-এ Cloudflare নিজে build করে publish করে (৩–৫ মিনিট)। build বা পরীক্ষা ব্যর্থ হলে পুরোনো সাইট থাকে। প্রতিটি Pull Request-এর জন্য Cloudflare একটা আলাদা preview লিংকও দেয়।

**খরচ:** Free প্ল্যানে static পেইজ সীমাহীন; API (order tracking) দিনে ১ লাখ request পর্যন্ত, database ৫ GB পর্যন্ত। এই সাইটের জন্য ০ টাকা।

**Cloudflare পর্যন্ত:** domain সরানো না পর্যন্ত GitHub Actions আগের মতো static পেইজগুলো `gh-pages` ব্রাঞ্চে publish করে, তাই arafatbin.com চলতে থাকে (শুধু order tracking তখন কাজ করে না, ক্রেতাকে WhatsApp-এ যোগাযোগ করতে বলে)।
