# arafatbin.com — JAMstack static website

- **J**avaScript → `build.js` + `templates/*.js` (build করার সময় JSON থেকে HTML বানায়), `assets/js/main.js` (মেনু, ফর্ম), `assets/js/shop.js` (কার্ট, পেমেন্ট)
- **A**PI → `data/` ফোল্ডারের JSON ফাইল (সব লেখা, ছবি, আইকন, লিংক)
- **M**arkup → `dist/`-এ তৈরি হওয়া আসল HTML + `assets/css/style.css`

**SSG (Static Site Generation):** `node build.js` চালালে প্রতিটি পেইজ আগে থেকেই পুরো লেখাসহ HTML ফাইল হয়ে যায়।
তাই Google বা অন্য search engine পেইজ খুললেই সব লেখা সরাসরি পায়, JavaScript চালাতে হয় না।
প্রতিটি পেইজে title, description, canonical, Open Graph, breadcrumb আর Schema.org (JSON-LD) ডাটা থাকে।
ছবির width/height নিজে থেকে বসে যায়, আর build প্রতিটি ছবির ছোট WebP কপি বানায় (`sharp` package দিয়ে, GitHub-এ নিজে থেকে install হয়)। কোনো framework বা animation নেই, তাই সাইট খুব দ্রুত লোড হয়।

## File structure

```
├── build.js                 ← SSG: data/ পড়ে dist/-এ HTML, sitemap.xml, robots.txt বানায়
├── templates/
│   ├── helpers.js           ← JSON লোড + ছোট HTML helper
│   ├── layout.js            ← <head> (SEO), header, 3-dot মেনু, footer
│   └── pages.js             ← প্রতিটি পেইজের HTML
├── assets/
│   ├── css/style.css        ← ডিজাইন (এখানে এডিট করুন; build নিজে minify করে dist-এ দেয়)
│   ├── js/main.js           ← মেনু বন্ধ করা, Contact/Review ফর্ম, Web3Forms-এ পাঠানো
│   ├── js/shop.js           ← কার্ট, currency, gallery, quantity, পেমেন্ট ফর্ম (শুধু Shop ও Payment পেইজে)
│   ├── images/              ← সব ছবি
│   └── files/               ← CV (PDF)
├── CNAME                    ← arafatbin.com
├── .github/workflows/deploy.yml  ← main-এ push করলে GitHub Pages-এ auto publish
│
└── data/                    ★ শুধু এই ফোল্ডার এডিট করবেন ★
    ├── global/              ← পুরো সাইটের common অংশ
    │   ├── site.json        ← সাইটের নাম, URL, SEO, রং (theme), Google Analytics, ফর্ম key, robots.txt
    │   ├── header.json      ← লোগো, হেডার লিংক, WhatsApp বাটন, 3-dot মেনুর ২ কলাম
    │   ├── footer.json      ← ফুটারের লেখা, কলাম, কপিরাইট, নিচের লিংক
    │   ├── contact.json     ← WhatsApp, ফোন, ইমেইল, ঠিকানা, ম্যাপ
    │   ├── social.json      ← সোশ্যাল লিংক ও আইকন
    │   ├── sitemap.json     ← sitemap.xml-এ বাড়তি লিংক (বাকি সব নিজে যোগ হয়)
    │   ├── payments.json    ← currency (OMR/USD/BDT), পেমেন্ট মেথড, ব্যাংক/Send Money/PayPal/RedotPay তথ্য, poster, ম্যাপ, সময়
    │   └── icons.json       ← সব আইকন (নাম দিয়ে যেকোনো JSON-এ ব্যবহার করুন)
    │
    ├── pages/               ← প্রতিটি পেইজের লেখা
    │   ├── home.json        → /           (উপরে Shop + Service, নিচে বাকি section)
    │   ├── shop.json        → /shop/  (benefits, policy লিংক, কার্টের লেখা, নিচের queue CTA)
    │   ├── payments.json    → /payments/  (Payment পেইজ ও ফর্মের সব লেখা)
    │   ├── services.json    → /services/
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
    │   └── 404.json         → 404 error page
    │
    └── collections/         ← প্রতিটি আইটেমের নিজের পেইজ তৈরি হয়
        ├── products.json    → /shop/<slug>/  (দাম, stock, ছবি, about, usage, FAQ, review)
        ├── services.json    → /services/<slug>/
        └── blog/*.json      → /blog/<slug>/   (প্রতিটি পোস্ট = একটি ফাইল)
```

`sitemap.xml` নিজে থেকে তৈরি হয়: সব পেইজ, প্রোডাক্ট, সার্ভিস ও ব্লগ পোস্টের লিংক স্বয়ংক্রিয়ভাবে যোগ হয়, কোনো তারিখ ছাড়া। `data/global/sitemap.json`-এ শুধু বাড়তি লিংক (যেমন CV-এর PDF) দিন। `robots.txt` তৈরি হয় `site.json` থেকে।

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
| নতুন ব্লগ পোস্ট | `data/collections/blog/`-এ একটি ফাইল কপি করুন, নাম ও `slug` বদলান |
| নতুন রিভিউ | `data/pages/reviews.json` → `items` |
| নতুন ছবি | `assets/images/`-এ রাখুন, JSON-এ লিখুন `"/assets/images/নাম.jpg"` |
| sitemap-এ বাড়তি লিংক (যেমন PDF) | `data/global/sitemap.json` → `urls` |
| নতুন আইকন | `data/global/icons.json`-এ SVG কোড যোগ করুন |
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

## চালানো ও publish

```bash
npm install              # একবার (sharp, ছবি WebP করার জন্য)
node build.js            # dist/ ফোল্ডারে সাইট তৈরি
node build.js --serve    # তৈরি করে http://localhost:8080 এ দেখুন
```

GitHub Pages: রিপোর **Settings → Pages → Source** = **GitHub Actions**।
এরপর `main`-এ push করলেই সাইট নিজে থেকে build হয়ে publish হবে।
