# arafatbin.com — Astro JAMstack website

পুরো ওয়েবসাইটের সব লেখা, ছবি, লিংক, দাম, মেনু — সবকিছু `src/data/` ফোল্ডারের **JSON ফাইলে** আছে।
কোড না ছুঁয়ে শুধু JSON এডিট করলেই ওয়েবসাইট বদলে যাবে।

## File structure

```
arafatbinwahahid.github.io/
├── .github/workflows/deploy.yml     ← main-এ push করলে নিজে থেকে build + GitHub Pages-এ deploy
├── astro.config.mjs                 ← Astro config (site URL নেয় site.json থেকে)
├── package.json
├── public/                          ← যা আছে তা হুবহু ওয়েবসাইটে যায়
│   ├── CNAME                        ← arafatbin.com ডোমেইন
│   ├── files/Arafat_Bin_Wahahid_CV.pdf
│   └── images/                      ← সব ছবি এখানে রাখুন, JSON-এ লিখুন "/images/নাম.jpg"
│
└── src/
    ├── data/                        ★ সব কন্টেন্ট এখানে — শুধু এগুলো এডিট করবেন ★
    │   ├── settings/
    │   │   ├── site.json            ← নাম, ডোমেইন, SEO, Google Analytics, ফর্ম key, CV, robots.txt নিয়ম
    │   │   ├── navigation.json      ← হেডার মেনু, হেডার বাটন, ফুটারের কলাম ও লিংক
    │   │   ├── contact.json         ← WhatsApp, ফোন, ইমেইল, ঠিকানা, ম্যাপ
    │   │   └── social.json          ← সোশ্যাল লিংক (ফুটার + কন্টাক্ট পেইজ)
    │   │
    │   ├── pages/                   ← প্রতিটি পেইজের লেখা
    │   │   ├── home.json            → /            (Home)
    │   │   ├── shop.json            → /shop        (Shop পেইজের শিরোনাম/নোট)
    │   │   ├── services.json        → /services    (Service পেইজের শিরোনাম + "How it works")
    │   │   ├── about.json           → /about
    │   │   ├── experience.json      → /experience
    │   │   ├── skills.json          → /skills
    │   │   ├── work.json            → /work
    │   │   ├── credentials.json     → /credentials
    │   │   ├── reviews.json         → /reviews     (রিভিউ তালিকা + রিভিউ ফর্ম)
    │   │   ├── contact.json         → /contact
    │   │   ├── blog.json            → /blog        (Blog পেইজের শিরোনাম)
    │   │   ├── terms.json           → /terms-and-conditions
    │   │   ├── privacy.json         → /privacy-policy
    │   │   ├── refund.json          → /refund-policy
    │   │   ├── faq.json             → /faq
    │   │   └── 404.json             → 404 error page
    │   │
    │   └── collections/             ← একাধিক আইটেম (প্রতিটির নিজের পেইজ তৈরি হয়)
    │       ├── services.json        → /services/<slug>  (প্রতিটি সার্ভিস)
    │       ├── products.json        → /shop/<slug>      (প্রতিটি প্রোডাক্ট)
    │       └── blog/                → /blog/<slug>      (প্রতিটি পোস্ট = একটি JSON ফাইল)
    │           ├── excel-dashboard-tips.json
    │           └── life-as-fuel-attendant.json
    │
    ├── pages/                       ← রাউট (URL) — সাধারণত এডিট করতে হবে না
    │   ├── index.astro  about.astro  experience.astro  skills.astro  work.astro
    │   ├── credentials.astro  reviews.astro  contact.astro  faq.astro  404.astro
    │   ├── terms-and-conditions.astro  privacy-policy.astro  refund-policy.astro
    │   ├── services/index.astro  services/[slug].astro
    │   ├── shop/index.astro      shop/[slug].astro
    │   ├── blog/index.astro      blog/[slug].astro
    │   ├── sitemap.xml.ts           ← সব পেইজ + পোস্ট + প্রোডাক্ট থেকে নিজে sitemap.xml বানায়
    │   └── robots.txt.ts            ← site.json-এর "robots" থেকে robots.txt বানায়
    ├── layouts/   BaseLayout.astro (SEO, হেডার, ফুটার)  LegalLayout.astro (Terms/Privacy/Refund)
    ├── components/  Header, Footer, Button, cards, forms ...
    ├── lib/data.ts                  ← JSON লোড করে + দাম/তারিখ ফরম্যাট
    ├── scripts/main.js              ← থিম, মেনু, অ্যানিমেশন, লাইটবক্স, ফর্ম
    └── styles/global.css            ← ডিজাইন; রং বদলাতে উপরের :root অংশ এডিট করুন
```

## কীভাবে এডিট করবেন

| কী করতে চান | কোন ফাইল |
| --- | --- |
| ফোন / ইমেইল / WhatsApp বদলানো | `src/data/settings/contact.json` |
| মেনুতে লিংক যোগ/বাদ | `src/data/settings/navigation.json` |
| নতুন প্রোডাক্ট যোগ | `src/data/collections/products.json`-এ একটি `{ ... }` ব্লক কপি করে নতুন `slug` দিন |
| নতুন সার্ভিস যোগ | `src/data/collections/services.json` |
| নতুন ব্লগ পোস্ট | `src/data/collections/blog/` ফোল্ডারে একটি ফাইল কপি করে নতুন নাম ও `slug` দিন |
| নতুন রিভিউ দেখানো | `src/data/pages/reviews.json` → `items` |
| নতুন ছবি | `public/images/`-এ রাখুন, JSON-এ `"/images/ফাইলের-নাম.jpg"` লিখুন |
| পোস্ট লুকানো | পোস্টের JSON-এ `"draft": true` |

**ব্লগ পোস্টের `content` ব্লক:**
`{ "type": "p", "text": "..." }` (প্যারাগ্রাফ), `"h2"` / `"h3"` (শিরোনাম), `"quote"`,
`{ "type": "list", "items": ["..."], "ordered": false }`,
`{ "type": "image", "src": "/images/x.jpg", "alt": "...", "caption": "..." }`।

**বাটন ফরম্যাট (যেকোনো জায়গায়):** `{ "label": "লেখা", "href": "/contact", "style": "primary | ghost | dark | line", "icon": "wa | mail | dl | globe | in | phone | pin" }`

JSON নিয়ম: স্ট্রিং সবসময় `"ডাবল কোট"`-এ, শেষ আইটেমের পরে কমা দেবেন না।

## চালানো ও deploy

```bash
npm install
npm run dev      # http://localhost:4321 এ লাইভ প্রিভিউ
npm run build    # dist/ ফোল্ডারে স্ট্যাটিক সাইট
```

GitHub Pages: রিপোর **Settings → Pages → Source** থেকে **GitHub Actions** সিলেক্ট করুন।
এরপর `main` ব্রাঞ্চে push করলেই সাইট নিজে থেকে build ও publish হবে।
