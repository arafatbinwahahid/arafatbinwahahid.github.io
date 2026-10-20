// Small client-side behaviour: theme, menu, animations, lightbox, forms, shop filter.
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const root = document.documentElement;

// Theme toggle
$('#themeBtn')?.addEventListener('click', () => {
  const cur = root.getAttribute('data-theme');
  const dark = cur ? cur === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
  const next = dark ? 'light' : 'dark';
  root.setAttribute('data-theme', next);
  try { localStorage.setItem('theme', next); } catch {}
});

// Mobile menu
const links = $('#links');
const menuBtn = $('#menuBtn');
menuBtn?.addEventListener('click', () => {
  const open = links.classList.toggle('open');
  menuBtn.setAttribute('aria-expanded', String(open));
});

// LCD typing effect on the home page
const lcd = $('.lcd[data-words]');
if (lcd && !reduced) {
  const words = JSON.parse(lcd.dataset.words || '[]');
  const out = $('#lcdText');
  let w = 0, i = 0;
  (function type() {
    const word = words[w];
    if (i <= word.length) { out.textContent = word.slice(0, i++); setTimeout(type, 55); }
    else setTimeout(() => { i = 0; w = (w + 1) % words.length; out.textContent = ''; setTimeout(type, 250); }, 1900);
  })();
}

// Reveal on scroll
const io = new IntersectionObserver((entries) => {
  entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
}, { threshold: 0.15 });
$$('.rv, h2, .tags').forEach((el) => io.observe(el));
$$('.tags').forEach((t) => $$('span', t).forEach((s, i) => (s.style.transitionDelay = i * 60 + 'ms')));

// Count-up numbers
const countIo = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (!e.isIntersecting) return;
    countIo.unobserve(e.target);
    const end = +e.target.dataset.count;
    if (reduced) return;
    let start = null;
    const step = (t) => {
      start ??= t;
      const p = Math.min((t - start) / 1400, 1);
      e.target.textContent = Math.round(end * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
}, { threshold: 0.6 });
$$('[data-count]').forEach((el) => countIo.observe(el));

// Scroll gauge, solid header, timeline fill
const gauge = $('#gauge i'), hdr = $('#hdr'), tl = $('#tl'), tlFill = $('#tlFill');
function onScroll() {
  const max = root.scrollHeight - innerHeight;
  gauge.style.width = (max > 0 ? (scrollY / max) * 100 : 0) + '%';
  hdr.classList.toggle('solid', scrollY > 40);
  if (tl && tlFill) {
    const r = tl.getBoundingClientRect();
    const p = (innerHeight * 0.65 - r.top) / r.height;
    tlFill.style.height = Math.max(0, Math.min(1, p)) * (r.height - 12) + 'px';
  }
}
addEventListener('scroll', onScroll, { passive: true });
addEventListener('resize', onScroll);
onScroll();

// Lightbox
const lb = $('#lb');
const openLb = (src, cap) => { $('img', lb).src = src; $('img', lb).alt = cap || ''; $('p', lb).textContent = cap || ''; lb.showModal?.(); };
$$('[data-zoom]').forEach((el) => {
  el.addEventListener('click', () => openLb(el.dataset.zoom, el.dataset.cap));
  el.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLb(el.dataset.zoom, el.dataset.cap); } });
});
$('.x', lb)?.addEventListener('click', () => lb.close());
lb?.addEventListener('click', (e) => { if (e.target === lb) lb.close(); });

// Shop category filter
$$('[data-filter]').forEach((btn) => btn.addEventListener('click', () => {
  $$('[data-filter]').forEach((b) => b.classList.toggle('on', b === btn));
  const f = btn.dataset.filter;
  $$('#products [data-cat]').forEach((p) => (p.hidden = f !== 'all' && p.dataset.cat !== f));
}));

// Forms (Web3Forms). Access key comes from site.json via <body data-forms-key>.
const formsKey = document.body.dataset.formsKey;
const email = document.body.dataset.email;
const builders = {
  contact: (f) => ({
    subject: 'New message from website: ' + f.name.value.trim(),
    name: f.name.value.trim(), email: f.email.value.trim(), message: f.message.value.trim(),
  }),
  review: (f) => {
    if (!f.rating.value) return 'Please choose a star rating first.';
    const d = {
      subject: `New review from website: ${f.rating.value} of 5 stars`,
      name: f.name.value.trim(), rating: f.rating.value + ' / 5', message: f.message.value.trim(),
      allow_public: f.allow_public.checked ? 'Yes, may be shown on the website' : 'No, keep private',
    };
    if (f.email.value.trim()) d.email = f.email.value.trim();
    return d;
  },
};
$$('form[data-form]').forEach((form) => {
  const status = $('.status', form);
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (form.botcheck?.checked) return;
    const data = builders[form.dataset.form](form);
    if (typeof data === 'string') { status.className = 'status err'; status.textContent = data; return; }
    const btn = $('button[type=submit]', form);
    btn.disabled = true; status.className = 'status'; status.textContent = 'Sending...';
    try {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ ...data, access_key: formsKey, from_name: 'Website' }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      status.className = 'status ok'; status.textContent = form.dataset.success; form.reset();
    } catch (err) {
      status.className = 'status err';
      status.textContent = `Could not send${err?.message ? ' (' + err.message + ')' : ''}. Please message me on WhatsApp or email ${email}.`;
    }
    btn.disabled = false;
  });
  $('[data-send-wa]', form)?.addEventListener('click', () => {
    const n = form.name.value.trim(), m = form.message.value.trim();
    const text = 'Hello Arafat, ' + (n ? 'my name is ' + n + '. ' : '') + (m || 'I saw your website and would like to talk.');
    window.open(`https://wa.me/${form.dataset.wa}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
  });
});
