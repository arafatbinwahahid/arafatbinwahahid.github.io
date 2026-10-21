// 1. Close the 3-dot menu when clicking outside it or pressing Escape
const menu = document.querySelector('.menu');
document.addEventListener('click', (e) => { if (menu?.open && !menu.contains(e.target)) menu.open = false; });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && menu) menu.open = false; });

// 2. Send data to Web3Forms (used by the forms below and by shop.js)
window.sendToWeb3Forms = async (data) => {
  const res = await fetch('https://api.web3forms.com/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ access_key: document.body.dataset.formsKey, from_name: 'Website', ...data }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.success) throw new Error(json.message || 'Send failed');
};

// 3. Contact + review forms
document.querySelectorAll('form[data-form]').forEach((form) => {
  const status = form.querySelector('.status');
  const say = (text, ok) => { status.textContent = text; status.className = 'status ' + (ok ? 'ok' : 'err'); };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (form.botcheck.checked) return;
    const f = form.elements;
    const data = { name: f.name.value.trim(), email: f.email.value.trim(), message: f.message.value.trim() };
    if (form.dataset.form === 'review') {
      if (!f.rating.value) return say(form.dataset.ratingError);
      data.subject = `New review: ${f.rating.value} of 5 stars`;
      data.rating = f.rating.value + ' / 5';
      data.allow_public = f.allow_public.checked ? 'Yes' : 'No';
    } else {
      data.subject = 'New message from website: ' + data.name;
    }
    const button = form.querySelector('[type=submit]');
    button.disabled = true;
    try {
      await window.sendToWeb3Forms(data);
      say(form.dataset.success, true);
      form.reset();
    } catch {
      say(form.dataset.error);
    }
    button.disabled = false;
  });

  // "Send on WhatsApp" button on the contact form
  form.querySelector('[data-wa]')?.addEventListener('click', (e) => {
    const f = form.elements;
    const text = `Hello, my name is ${f.name.value.trim() || '...'}. ${f.message.value.trim()}`;
    window.open(`https://wa.me/${e.currentTarget.dataset.wa}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
  });
});

// 4. Giscus comments on blog posts: load the widget when it comes near the screen
const giscus = document.querySelector('[data-giscus]');
if (giscus) {
  new IntersectionObserver((entries, obs) => {
    if (!entries[0].isIntersecting) return;
    obs.disconnect();
    const s = document.createElement('script');
    const d = giscus.dataset;
    const attrs = { repo: d.repo, 'repo-id': d.repoId, category: d.category, 'category-id': d.categoryId, lang: d.lang, mapping: 'pathname', strict: '0', 'reactions-enabled': '1', 'emit-metadata': '0', 'input-position': 'top', theme: 'light', loading: 'lazy' };
    for (const [k, v] of Object.entries(attrs)) s.setAttribute(`data-${k}`, v);
    s.src = 'https://giscus.app/client.js';
    s.crossOrigin = 'anonymous';
    s.async = true;
    giscus.append(s);
  }, { rootMargin: '400px' }).observe(giscus);
}
