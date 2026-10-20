# arafatbin.com — JAMstack static website

- **J**avaScript → `build.js` + `templates/*.js` (build করার সময় JSON থেকে HTML বানায়), `assets/js/main.js` (মেনু, ফর্ম)
- **A**PI → `data/` ফোল্ডারের JSON ফাইল (সব লেখা, ছবি, আইকন, লিংক)
- **M**arkup → `dist/`-এ তৈরি হওয়া আসল HTML + `assets/css/style.css`

**SSG (Static Site Generation):** `node build.js` চালালে প্রতিটি পেইজ আগে থেকেই পুরো লেখাসহ HTML ফাইল হয়ে যায়।
তাই Google বা অন্য search engine পেইজ খুললেই সব লেখা সরাসরি পায়, JavaScript চালাতে হয় না।
প্রতিটি পেইজে title, description, canonical, Open Graph, breadcrumb আর Schema.org (JSON-LD) ডাটা থাকে।
ছবির width/height নিজে থেকে বসে যায়। কোনো framework, npm package বা animation নেই, তাই সাইট খুব দ্রুত লোড হয়।

## File structure

```
├── build.js                 ← SSG: data/ পড়ে dist/-এ HTML, sitemap.xml, robots.txt বানায়
├── templates/
│   ├── helpers.js           ← JSON লোড + ছোট HTML helper
│   ├── layout.js            ← <head> (SEO), header, 3-dot মেনু, footer
│   └── pages.js             ← প্রতিটি পেইজের HTML
├── assets/
│   ├── css/style.css        ← ডিজাইন
│   ├── js/main.js           ← মেনু বন্ধ করা, shop filter, ফর্ম পাঠানো
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
    │   └── icons.json       ← সব আইকন (নাম দিয়ে যেকোনো JSON-এ ব্যবহার করুন)
    │
    ├── pages/               ← প্রতিটি পেইজের লেখা
    │   ├── home.json        → /           (উপরে Shop + Service, নিচে বাকি section)
    │   ├── shop.json        → /shop/
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
        ├── products.json    → /shop/<slug>/
        ├── services.json    → /services/<slug>/
        └── blog/*.json      → /blog/<slug>/   (প্রতিটি পোস্ট = একটি ফাইল)
```

`sitemap.xml` আর `robots.txt` build করার সময় নিজে থেকে তৈরি হয়।

## কীভাবে এডিট করবেন

| কী বদলাবেন | কোন ফাইল |
| --- | --- |
| সাইটের রং | `data/global/site.json` → `theme` |
| হেডার মেনু / 3-dot মেনুর লিংক | `data/global/header.json` |
| ফুটার | `data/global/footer.json` |
| ফোন, ইমেইল, WhatsApp, ঠিকানা | `data/global/contact.json` |
| হোম পেইজের section-এর ক্রম | `data/pages/home.json` → `sections` (উপর-নিচ সরান, `"show": false` দিলে লুকাবে) |
| নতুন প্রোডাক্ট | `data/collections/products.json`-এ একটি `{ ... }` কপি করে নতুন `slug` দিন |
| নতুন সার্ভিস | `data/collections/services.json` |
| নতুন ব্লগ পোস্ট | `data/collections/blog/`-এ একটি ফাইল কপি করুন, নাম ও `slug` বদলান |
| নতুন রিভিউ | `data/pages/reviews.json` → `items` |
| নতুন ছবি | `assets/images/`-এ রাখুন, JSON-এ লিখুন `"/assets/images/নাম.jpg"` |
| নতুন আইকন | `data/global/icons.json`-এ SVG কোড যোগ করুন |

**বাটন:** `{ "label": "লেখা", "href": "/contact/", "style": "primary | outline | light", "icon": "wa" }`

**ব্লগ পোস্টের content:** `{ "type": "p", "text": "..." }`, `"h2"`, `"h3"`, `"quote"`,
`{ "type": "list", "items": ["..."] }`, `{ "type": "image", "src": "...", "alt": "...", "caption": "..." }`

**JSON নিয়ম:** লেখা সবসময় `"ডাবল কোট"`-এ, শেষ আইটেমের পরে কমা দেবেন না। ভুল হলে build কোন ফাইলে সমস্যা তা বলে দেবে।

## চালানো ও publish

```bash
node build.js            # dist/ ফোল্ডারে সাইট তৈরি
node build.js --serve    # তৈরি করে http://localhost:8080 এ দেখুন
```

GitHub Pages: রিপোর **Settings → Pages → Source** = **GitHub Actions**।
এরপর `main`-এ push করলেই সাইট নিজে থেকে build হয়ে publish হবে।
